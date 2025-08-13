import { getVercelRequestID } from "@/lib/api/request"
import { apiResponse } from "@/lib/api/response"
import { SafeResult } from "@/lib/utils.server"
import { integrationsService } from "@/service/integrations"
import { UpdateFunctionCodeCommandOutput } from "@aws-sdk/client-lambda"
import { NextRequest } from "next/server"

const CRON_SECRET = process.env.NL_CRON_SECRET

export async function POST(request: NextRequest) {
	const reqID = getVercelRequestID(request.headers)
	const secret = request.headers.get('Authorization')

	if (!secret) {
		return apiResponse.unauthorized('authorization is missing', reqID)
	}

	const parts = secret.split(' ', 2)
	if (parts[0] != 'Bearer') {
		return apiResponse.unauthorized('authorization is malformed', reqID)
	}

	if (parts[1] != CRON_SECRET) {
		return apiResponse.unauthorized('authorization is denied', reqID)
	}

	const configs = await integrationsService.getFullSyncCronConfigs()

	const updateResults: [string, SafeResult<UpdateFunctionCodeCommandOutput, Error>][] = await Promise.all(configs.map(async (config) => {
		const res = await integrationsService.updateLambdaCode(config)

		return [config.functionName, res]
	}))

	const errors: Record<string, string> = {}
	let errorCount = 0

	for (const [name, res] of updateResults) {
		if (!res.success) {
			errorCount++
			errors[name] = res.error.message
		}
	}

	if (errorCount > 0) {
		return apiResponse.internalErrors(`${errorCount} functions failed to update code`, errors, reqID)
	}

	return apiResponse.noContent()
}
