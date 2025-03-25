import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { z } from 'zod'
import { NewNumberParser } from '../utils'
import { TFunction } from 'i18next'

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
  //csv: 'text/csv',
}

export type ReadAndValidateFileConfig<TKey extends string = string> = Partial<{
  expectedHeaders: TKey[]
  transformHeaders: (header: TKey) => TKey | string,
  debug: boolean,
}>

const defaultConfig: Required<ReadAndValidateFileConfig> = {
  expectedHeaders: [],
  debug: false,
  transformHeaders: (h) => h,
}

export function readAndValidateFileData<T extends z.ZodTypeAny, TKey extends string = string>(
  file: File,
  schema: z.ZodArray<T>,
  t: TFunction,
  config: ReadAndValidateFileConfig<TKey | string> = defaultConfig,
): Promise<ReadAndValidateFileResponse<T>> {
  return new Promise((resolve, reject) => {
    const debug = config.debug ?? defaultConfig.debug
    const expectedHeaders = config.expectedHeaders ?? defaultConfig.expectedHeaders
    const transformHeaders = config.transformHeaders ?? defaultConfig.transformHeaders

    const reader = new FileReader()

    reader.onload = () => {
      try {
        let headers: string[]
        let data: Record<string, any>[]

        switch (file.type) {
          case SUPPORTED_TYPES['xlsx']:
          case SUPPORTED_TYPES['xls']:
            const [readHeaders, readData] = readWithXLSX(reader)
            headers = readHeaders
            data = readData
            break
          // Leaving this here in case we need some csv parsing
          // case SUPPORTED_TYPES['csv']:
          //   data = readWithPapaparse(reader)
          //   break
          default:
            console.error('wrong import file type')
            return
        }

        const transformedHeaders = headers.map(transformHeaders)
        if (debug) console.log(transformedHeaders)

        const missingHeaders = expectedHeaders.filter(h => !transformedHeaders.includes(h))
        if (missingHeaders.length > 0) {
          resolve({
            success: false,
            errors: new z.ZodError([{
              code: z.ZodIssueCode.custom,
              path: [-1, t('products.headers')],
              message: t('products.header-missing', {
                count: missingHeaders.length,
                header: missingHeaders.map(h => t('products.header-name', {context: h})).join(', ')
              })
            }])
          })
          return
        }

        const transformedData = data.map((row) => {
          // take keys for row, transform key with provided transform function
          // use transformed key to create new data object
          const res: Record<string, any> = {}

          for (const key of Object.keys(row)) {
            const transformedKey = transformHeaders(key)
            res[transformedKey] = row[key]
          }

          return res
        })

        if (debug) console.log({data: data.slice(0,5), transformedData: transformedData.slice(0, 5)})
        const parseRes = schema.safeParse(transformedData)

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

function readWithXLSX(reader: FileReader): [string[], Record<string, any>[]] {
  const workbook = XLSX.read(reader.result, { type: 'binary', sheets: 0 })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const sheetData = XLSX.utils.sheet_to_json(sheet, {
    blankrows: true,
    defval: '',
    header: 1,
  })

  const readHeaders = sheetData[0] as string[]

  const data = (sheetData.slice(1) as any[]).map((row) => {
    const rowObj: Record<string, any> = {}
    readHeaders.forEach((header, i) => rowObj[header] = row[i])

    return rowObj
  })

  // lowercasing first letter of the headers value in case users capitalizes it
  //
  // const lowercasedKeysArray = sheetData.map((row: any) => {
  //   return Object.keys(row as Record<string, any>).reduce(
  //     (acc, key) => {
  //       const lowercasedKey = key.charAt(0).toLowerCase() + key.slice(1)
  //       acc[lowercasedKey] = row[key]
  //       return acc
  //     },
  //     {} as Record<string, any>,
  //   )
  // })

  return [readHeaders, data]
}

function readWithPapaparse(reader: FileReader): Record<string, any>[] {
  const data = reader.result

  let stringData = ''
  if (typeof data == 'string') {
    stringData = data
  } else if (data) {
    stringData = new TextDecoder('windows-1252').decode(data)
  }

  const numberParser = NewNumberParser('da')
  const res = Papa.parse(stringData, {
    header: true,
    skipEmptyLines: true,
    transform: (val, field) => {
      let res
      switch (field) {
        case 'costPrice':
        case 'salesPrice':
          res = numberParser.parse(val)
          break

        default:
          res = val
          break
      }
      return res
    },
  })

  return res.data as Record<string, any>[]
}
