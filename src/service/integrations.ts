import { integrations } from '@/data/integrations'
import { IntegrationLogStatus } from '@/data/integrations.types'
import { db, TRX } from '@/lib/database'
import { CustomerID } from '@/lib/database/schema/customer'
import {
	CustomerIntegration,
	CustomerIntegrationID,
	CustomerIntegrationSettings,
	FullSyncCronConfig,
	IntegrationLog,
	NewCustomerIntegration,
} from '@/lib/database/schema/integrations'
import { hasher } from '@/lib/hash/hasher'
import {
	SyncProviderConfig,
	syncProviderConfigs,
	SyncProviderEvent,
	SyncProviderEventType,
	SyncProviderResponseEventData,
	SyncProviderType,
} from '@/lib/integrations/sync/interfaces'
import {
	LAMBDA_CODE_S3_BUCKET,
	LAMBDA_CODE_S3_KEY,
	LAMBDA_FUNCTION_ROLE,
	lambdaClient,
	lambdaSchedulerClient,
	SCHEDULER_ROLE,
} from '@/lib/lambda'
import { ActionError } from '@/lib/safe-action/error'
import { tryCatch } from '@/lib/utils.server'
import {
	CreateFunctionCommand,
	DeleteFunctionCommand,
	ServiceException,
	UpdateFunctionCodeCommand,
} from '@aws-sdk/client-lambda'
import {
	CreateScheduleCommand,
	DeleteScheduleCommand,
} from '@aws-sdk/client-scheduler'
import { randomUUID } from 'crypto'

const ORIGIN_URL = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
	? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
	: 'http://localhost:3000'
const GIT_BRANCH = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ?? 'localdev'

export const integrationsService = {
	newCustomerIntegration: async function (
		provider: SyncProviderType,
		data: Omit<NewCustomerIntegration, 'provider'>,
	): Promise<boolean> {
		const encryptedConfig = this.encryptConfig(provider, data.config)

		const transaction = await db.transaction(async tx => {
			const newIntegration = await integrations.newCustomerIntegration(
				{
					...data,
					provider: provider,
					config: encryptedConfig,
				},
				tx,
			)
			if (!newIntegration) {
				return false
			}

			const integrationSettings = await integrations.getCustomerSettings(
				data.customerID,
				tx,
			)
			if (!integrationSettings) {
				const newIntegrationSettings = await integrations.newCustomerSettings(
					{
						integrationID: newIntegration.id,
						customerID: data.customerID,
						useSyncProducts: false,
					},
					tx,
				)
				if (!newIntegrationSettings) {
					tx.rollback()
					return false
				}
			}

			return newIntegration != undefined
		})

		return transaction
	},
	getSettings: async function (
		customerID: CustomerID,
	): Promise<CustomerIntegrationSettings | undefined> {
		return await integrations.getCustomerSettings(customerID)
	},
	getIntegration: async function (
		customerIntegrationID: CustomerIntegrationID,
	): Promise<CustomerIntegration | undefined> {
		return await integrations.getCustomerIntegration(customerIntegrationID)
	},
	getProviders: async function (
		customerID: CustomerID,
	): Promise<CustomerIntegration[]> {
		return await integrations.getProviders(customerID)
	},
	getProviderByType: async function (
		customerID: CustomerID,
		provider: SyncProviderType,
	): Promise<CustomerIntegration | undefined> {
		return await integrations.getProviderByType(customerID, provider)
	},
	decryptConfig: function <T extends SyncProviderType = SyncProviderType>(
		provider: T,
		config: unknown,
	): SyncProviderConfig[T] {
		if (typeof config != 'object' || config == null) {
			throw new ActionError('config is not an object')
		}

		const providerConfig = syncProviderConfigs[provider]
		const providerKeys = Object.keys(providerConfig)
		const configKeys = Object.keys(config)

		if (
			providerKeys.length != configKeys.length ||
			!configKeys.every(key => providerKeys.includes(key))
		) {
			throw new ActionError('invalid config')
		}

		const decryptedConfig = providerKeys.reduce(
			(acc, cur) => {
				// @ts-ignore
				acc[cur] = hasher.decrypt(config[cur])
				return acc
			},
			{} as SyncProviderConfig[typeof provider],
		)
		return decryptedConfig
	},
	encryptConfig: function <T extends SyncProviderType = SyncProviderType>(
		provider: T,
		config: unknown,
	): SyncProviderConfig[T] {
		if (typeof config != 'object' || config == null) {
			throw new ActionError('config is not an object')
		}

		const providerConfig = syncProviderConfigs[provider]
		const providerKeys = Object.keys(providerConfig)
		const configKeys = Object.keys(config)

		if (
			providerKeys.length != configKeys.length ||
			!configKeys.every(key => providerKeys.includes(key))
		) {
			throw new ActionError('invalid config')
		}

		const encrypted = providerKeys.reduce(
			(acc, cur) => {
				// @ts-ignore
				acc[cur] = hasher.encrypt(config[cur])
				return acc
			},
			{} as SyncProviderConfig[typeof provider],
		)

		return encrypted
	},
	deleteCustomerIntegration: async function (
		customerID: CustomerID,
		integrationID: number,
	): Promise<boolean> {
		return await db.transaction(async tx => {
			const syncConfig = await integrations.getFullSyncCronConfig(
				[integrationID, customerID],
				tx,
			)
			if (syncConfig == undefined) {
				console.log(
					`Could not find a fullSyncConfig with integrationID: ${integrationID} and customerID: ${customerID}`,
				)
			} else {
				const didLambdaDelete = await this.deleteLambda(syncConfig, tx)
				if (!didLambdaDelete.success) {
					console.error(didLambdaDelete.message)
					return didLambdaDelete.success
				}
			}

			const didIntegrationDelete = await integrations.deleteCustomerIntegration(
				customerID,
				integrationID,
				tx,
			)
			if (didIntegrationDelete == false) {
				//tx.rollback()
				return didIntegrationDelete
			}

			return true
		})
	},
	updateSettings: async function (
		customerID: CustomerID,
		settings: Partial<
			Pick<
				CustomerIntegrationSettings,
				'useSyncProducts' | 'useSyncSuppliers' | 'lambaUploaded'
			>
		>,
	): Promise<boolean> {
		return await integrations.updateSettings(customerID, settings)
	},
	/**
	 * Fetches all [CustomerIntegrations] joined with [CustomerIntegrationSettings].
	 * If useSyncProducts is provided, this function will filter integrations by this flag.
	 * If customerID is provided, only integrations for this customer id is returned.
	 */
	getIntegrationsWithSettings: async function (
		customerID: CustomerID | undefined = undefined,
		useSyncProducts: boolean | undefined = undefined,
	): Promise<(CustomerIntegration & CustomerIntegrationSettings)[]> {
		return await integrations.getIntegrationsWithSettings(
			customerID,
			useSyncProducts,
		)
	},
	getFullSyncCronConfigs: async function (): Promise<FullSyncCronConfig[]> {
		return await integrations.getFullSyncCronConfigs()
	},
	createLambda: async function (
		customerID: CustomerID,
		provider: SyncProviderType,
		integrationID: CustomerIntegrationID,
	) {
		let branchName = GIT_BRANCH
		const lastSlashIndex = branchName.lastIndexOf('/')
		branchName = branchName.slice(lastSlashIndex + 1, lastSlashIndex + 9) // if no slash was found lastSlashIndex == -1 and this will crop the whole string to 8 characters

		const rand = randomUUID().slice(0, 8).toLowerCase()
		const functionName = `nem-lager-integration-full-sync-${branchName}-${customerID}-${rand}`
		const command = new CreateFunctionCommand({
			Runtime: 'nodejs22.x',
			FunctionName: functionName,
			Description: `Function to perform full sync for customer ${customerID}. NOTE: look in EventBridge Schedule for trigger of this function.`,
			Code: {
				S3Bucket: LAMBDA_CODE_S3_BUCKET,
				S3Key: LAMBDA_CODE_S3_KEY,
			},
			Role: LAMBDA_FUNCTION_ROLE,
			PackageType: 'Zip',
			Handler: 'index.handler',
			Publish: true,
			Environment: {
				Variables: {
					CUSTOMER_ID: customerID.toFixed(0),
					NL_CRON_SECRET: process.env.NL_CRON_SECRET!,
					BASE_URL: ORIGIN_URL,
				},
			},
			Tags: {
				'customer-id': customerID.toFixed(0),
				provider: provider,
				'git-branch': GIT_BRANCH,
			},
			Timeout: 30, // Timeout of function invocation in seconds. This can possibly be less due to vercel function timeout
		})
		const createLambdaRes = await lambdaClient.send(command)

		if (createLambdaRes.$metadata.httpStatusCode != 201) {
			return { success: false, createLambdaRes, createScheduleRes: undefined }
		}

		const scheduleName = `nem-lager-integration-full-sync-${branchName}-${customerID}-${rand}-schedule`
		const scheduleCommand = new CreateScheduleCommand({
			Name: scheduleName,
			Description: `Schedule for lambda function '${createLambdaRes.FunctionName}'`,
			ScheduleExpression: 'cron(0 3 ? * * *)',
			Target: {
				Arn: createLambdaRes.FunctionArn,
				RoleArn: SCHEDULER_ROLE,
			},
			FlexibleTimeWindow: {
				Mode: 'OFF',
			},
		})
		const createScheduleRes = await lambdaSchedulerClient.send(scheduleCommand)

		if (createScheduleRes.$metadata.httpStatusCode != 200) {
			console.error(
				`FAILED TO CREATE SCHEDULE, BUT LAMBDA STILL EXISTS! functionName: ${functionName}`,
			)
			return { success: false, createLambdaRes, createScheduleRes }
		}

		const res = await tryCatch(
			integrations.createFullSyncCronConfig({
				customerID,
				integrationID,
				functionName,
				functionARN: createLambdaRes.FunctionArn!,
				scheduleName,
				scheduleARN: createScheduleRes.ScheduleArn!,
			}),
		)
		if (!res.success) {
			console.error(
				`FAILED TO CREATE FULL SYNC CRON CONFIG, BUT LAMBDA AND SCHEDULE STILL EXISTS! functionName: ${functionName}, scheduleName: ${scheduleName}`,
			)
			console.error(res.error)
			return { success: false, createLambdaRes, createScheduleRes }
		}

		return { success: true, createLambdaRes, createScheduleRes }
	},
	updateLambdaCode: async function (config: FullSyncCronConfig) {
		const retry = async (
			cmd: UpdateFunctionCodeCommand,
			att: number = 0,
			max: number = 3,
		) => {
			try {
				const result = await lambdaClient.send(cmd)
				if (result.$metadata.httpStatusCode == 500 && att < max) {
					return retry(cmd, att + 1, max)
				}

				return result
			} catch (e) {
				if (e instanceof ServiceException && att < max) {
					return retry(cmd, att + 1, max)
				}
				throw e
			}
		}

		const cmd = new UpdateFunctionCodeCommand({
			FunctionName: config.functionARN,
			S3Bucket: LAMBDA_CODE_S3_BUCKET,
			S3Key: LAMBDA_CODE_S3_KEY,
			Publish: true,
		})

		return await tryCatch(retry(cmd))
	},
	/**
	 * This is current only called from deleteCustomerIntegration.
	 *
	 * If needed other places consider wrapping this in a transaction if other database queries are performed.
	 * */
	deleteLambda: async function (config: FullSyncCronConfig, tx: TRX = db) {
		const scheduleCmd = new DeleteScheduleCommand({
			Name: config.scheduleName,
		})
		const scheduleRes = await tryCatch(lambdaSchedulerClient.send(scheduleCmd))
		if (!scheduleRes.success) {
			console.error(
				`Deleting eventbridge schedule failed with error: ${scheduleRes.error}`,
			)
			return { success: false, message: 'Kunne ikke slette schedule' }
		}

		const lambdaCmd = new DeleteFunctionCommand({
			FunctionName: config.functionARN,
		})
		const lambdaRes = await tryCatch(lambdaClient.send(lambdaCmd))
		if (!lambdaRes.success) {
			console.error(
				`Deleting lambda function failed with error: ${lambdaRes.error}`,
			)
			return { success: false, message: 'Kunne ikke slette lambda funktion' }
		}

		const success = await tx.transaction(async trx => {
			const success = await integrations.deleteFullSyncCronConfig(
				[config.integrationID, config.customerID],
				trx,
			)
			if (success == false) trx.rollback()

			return success
		})

		if (!success) {
			console.error(
				'Deleting full sync config failed, but lambda and schedule were deleted from AWS',
			)
			return { success, message: 'Kunne ikke slette synkroniserings config' }
		}

		return { success: true, message: 'success' }
	},
	getIntegrationLogs: async function (
		customerID: CustomerID,
		pageSize: number = 50,
		page: number = 1,
	): Promise<IntegrationLog[]> {
		return await integrations.getIntegrationLogs(
			customerID,
			pageSize,
			(page - 1) * pageSize,
		)
	},
	createIntegrationLog: async function <
		TProvider extends SyncProviderType,
		TEvent extends SyncProviderEventType,
	>({
		customerID,
		message,
		status,
		integrationID,
		provider,
		eventType,
		eventData,
	}: {
		customerID: number
		message: string
		status: IntegrationLogStatus
		integrationID: number
		provider: TProvider
		eventType: TEvent
		eventData: SyncProviderResponseEventData<TProvider>[TEvent]
	}): Promise<IntegrationLog | undefined> {
		const event: SyncProviderEvent = {
			provider,
			type: eventType,
			data: eventData,
		} as SyncProviderEvent

		return await integrations.createIntegrationLog({
			customerID,
			message,
			status,
			integrationID,
			event,
		})
	},
}
