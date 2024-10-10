import * as XLSX from 'xlsx'
import { z } from 'zod'

type ReadAndValidateFileSuccess<T extends z.ZodTypeAny> = {
  success: true
  data: z.infer<T>[]
}

type ReadAndValidateFileError<T extends z.ZodTypeAny> = {
  success: false
  errors: z.ZodError<T[]>
}

type ReadAndValidateFileResponse<T extends z.ZodTypeAny> =
  | ReadAndValidateFileSuccess<T>
  | ReadAndValidateFileError<T>

const SUPPORTED_TYPES: { [key: string]: string } = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  csv: 'text/csv',
}

export function readAndValidateFileData<T extends z.ZodTypeAny>(
  file: File,
  schema: z.ZodArray<T>,
  debug: boolean = false,
): Promise<ReadAndValidateFileResponse<T>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      try {
        let data

        switch (file.type) {
          case SUPPORTED_TYPES['xlsx']:
          case SUPPORTED_TYPES['xls']:
          case SUPPORTED_TYPES['csv']:
            data = readWithXLSX(reader)
            break
          default:
            console.error('wrong import file type')
            return
        }

        const parseRes = schema.safeParse(data)

        if (debug) {
          console.log('read and validate debugging enabled')
          console.log({ fileType: file.type, sheetData: data, parseRes })
        }

        if (!parseRes.success) {
          resolve({
            success: false,
            errors: parseRes.error as z.ZodError<T[]>,
          })
        } else {
          resolve({
            success: true,
            data: parseRes.data,
          })
        }
      } catch (error) {
        reject({
          success: false,
          errors: error,
        })
      }
    }

    reader.onerror = error => {
      reject({
        success: false,
        errors: error,
      })
    }

    reader.readAsArrayBuffer(file)
  })
}

function readWithXLSX(reader: FileReader): Record<string, any>[] {
  const workbook = XLSX.read(reader.result, { type: 'binary' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const sheetData = XLSX.utils.sheet_to_json(sheet, {
    blankrows: true,
    defval: '',
  })

  // lowercasing first letter of the headers value in case users capitalizes it
  const lowercasedKeysArray = sheetData.map((row: any) => {
    return Object.keys(row as Record<string, any>).reduce(
      (acc, key) => {
        const lowercasedKey = key.charAt(0).toLowerCase() + key.slice(1)
        acc[lowercasedKey] = row[key]
        return acc
      },
      {} as Record<string, any>,
    )
  })

  return lowercasedKeysArray
}
