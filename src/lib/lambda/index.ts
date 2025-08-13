import { LambdaClient } from '@aws-sdk/client-lambda'
import { SchedulerClient } from '@aws-sdk/client-scheduler'

export const LAMBDA_CODE_S3_BUCKET = 'nemlager-lambda-bucket-z6pm1bdw1k'
export const LAMBDA_CODE_S3_KEY = 'lambda.zip'
export const LAMBDA_FUNCTION_ROLE =
	'arn:aws:iam::135199136256:role/nemlager-lambda-execution-role'

export const lambdaClient = new LambdaClient({
	region: 'eu-central-1',
	credentials: {
		accessKeyId: process.env.LAMBDA_ACCESS_KEY_ID!,
		secretAccessKey: process.env.LAMBDA_ACCESS_KEY_SECRET!,
	},
})

export const SCHEDULER_ROLE =
	'arn:aws:iam::135199136256:role/nemlager-lambda-scheduler-role'

export const lambdaSchedulerClient = new SchedulerClient({
	region: 'eu-central-1',
	credentials: {
		accessKeyId: process.env.LAMBDA_ACCESS_KEY_ID!,
		secretAccessKey: process.env.LAMBDA_ACCESS_KEY_SECRET!,
	},
})
