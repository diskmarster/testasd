import { S3Client } from '@aws-sdk/client-s3'

export const BUCKET_NAME = 'nemlager-55t13hajf5'
export const BUCKET_REGION = 'eu-central-1'

export const s3Client = new S3Client({
  region: 'eu-central-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_ACCESS_KEY_SECRET!,
  },
})
