import { RefType } from '@/data/attachments'
import { CustomerID } from '@/lib/database/schema/customer'
import { BUCKET_NAME, BUCKET_REGION, s3Client } from '@/lib/s3'
import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import crypto from 'crypto'

type KeyData = {
  customerID: CustomerID
  refType: RefType
  refID: number | string
  mimeType: MimeType
}

type ValidationResult =
  | {
      success: false
      error: string
    }
  | {
      success: true
      key: string
      type: 'image' | 'pdf' | 'excel'
      url: string
    }

type UploadRequest = {
  key: string
  mimeType: string
  body: Uint8Array
}

type DeleteRequest = {
  key: string
}

export const allowedMimetypes = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
} as const

export type MimeType = keyof typeof allowedMimetypes

const fileTypeMap: Record<MimeType, 'image' | 'pdf' | 'excel'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'application/pdf': 'pdf',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel'
} as const

export type AttachmentType = (typeof fileTypeMap)[MimeType]

export const fileService = {
  validate: function (keyData: KeyData): ValidationResult {
    if (!(keyData.mimeType in allowedMimetypes)) {
      return {
        success: false,
        error: `Ikke supporteret mime type: ${keyData.mimeType}`,
      }
    }

    const key = utils.genKey({ ...keyData })
    if (!key) {
      return { success: false, error: `Kunne ikke generere en objekt key` }
    }

    const type = utils.getType(keyData.mimeType)
    if (!type) {
      return {
        success: false,
        error: `Ikke supporteret filtype: ${keyData.mimeType}`,
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
  delete: async function (input: DeleteRequest) {
    const params: DeleteObjectCommandInput = {
      Bucket: BUCKET_NAME,
      Key: input.key,
    }

    const command = new DeleteObjectCommand(params)
    const res = await s3Client.send(command)

    return {
      success: res.$metadata.httpStatusCode === 204,
      response: res,
    }
  },
	uintArray8ToBase64: function(arr: Uint8Array): string {
		let base64: string
		// @ts-ignore
		if (Uint8Array.prototype.toBase64) {
			// @ts-ignore 
			base64 = buffer.toBase64('base64url')
		} else {
			let binary = ""
			for (let i = 0; i < arr.length; i++) {
				binary += String.fromCharCode(arr[i])
			}
			base64 = btoa(binary)
		}
		return base64
	}
}

const utils = {
  genKey: function (data: KeyData): string {
    return `${data.customerID}/${data.refType}/${data.refID}/${crypto.randomBytes(16).toString('hex')}${allowedMimetypes[data.mimeType as MimeType][0]}`
  },
  genURL: function (name: string): string {
    return `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${name}`
  },
  getType: function (mime: string): 'image' | 'pdf' | 'excel' | null {
    return fileTypeMap[mime as MimeType] ?? null
  },
}
