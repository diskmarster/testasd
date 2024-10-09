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

export function readAndValidateFileData<T extends z.ZodTypeAny>(
  file: File,
  schema: z.ZodArray<T>,
  debug: boolean = false,
): Promise<ReadAndValidateFileResponse<T>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const sheetData = XLSX.utils.sheet_to_json(sheet)

        const parseRes = schema.safeParse(sheetData)

        if (debug) {
          console.log('read and validate debugging enabled')
          console.log('sheet data', sheetData)
          console.log('parse res', parseRes)
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
