import { RefType } from '@/data/attachments'
import { CustomerID } from '@/lib/database/schema/customer'
import { BUCKET_NAME, BUCKET_REGION, s3Client } from '@/lib/s3'
import { PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3'
import crypto from 'crypto'

type KeyData = {
  customerID: CustomerID
  refType: RefType
  refID: number
  mimeType: string
}

type ValidationResult =
  | {
      success: false
      error: string
    }
  | {
      success: true
      key: string
      type: 'image' | 'pdf'
      url: string
    }

type UploadRequest = {
  key: string
  mimeType: string
  body: Uint8Array
}

export const allowedMimetypes = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
} as const

export type MimeType = keyof typeof allowedMimetypes

const fileTypeMap: Record<MimeType, 'image' | 'pdf'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'application/pdf': 'pdf',
} as const

export type AttachmentType = (typeof fileTypeMap)[MimeType]

export const fileService = {
  validate: function (file: File, keyData: KeyData): ValidationResult {
    if (!(file.type in allowedMimetypes)) {
      return {
        success: false,
        error: `Ikke supporteret mime type: ${file.type}`,
      }
    }

    const key = utils.genKey({ ...keyData, mimeType: file.type })
    if (!key) {
      return { success: false, error: `Kunne ikke generere en objekt key` }
    }

    const type = utils.getType(file.type)
    if (!type) {
      return {
        success: false,
        error: `Ikke supporteret filtype: ${file.type}`,
      }
    }

    const url = utils.genURL(key)

    return { success: true, key, type, url }
  },
  upload: async function (input: UploadRequest) {
    const params: PutObjectCommandInput = {
      Bucket: BUCKET_NAME,
      Key: input.key,
      Body: input.body,
      ContentType: input.mimeType,
    }

    const command = new PutObjectCommand(params)
    const res = await s3Client.send(command)

    return {
      success: res.$metadata.httpStatusCode === 200,
      response: res,
    }
  },
  delete: async function () {},
}

const utils = {
  genKey: function (data: KeyData): string {
    return `${data.customerID}/${data.refType}/${data.refID}/${crypto.randomBytes(16).toString('hex')}${allowedMimetypes[data.mimeType as MimeType][0]}`
  },
  genURL: function (name: string): string {
    return `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${name}`
  },
  getType: function (mime: string): 'image' | 'pdf' | null {
    return fileTypeMap[mime as MimeType] ?? null
  },
}
