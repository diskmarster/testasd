import { TableIntegrationLogs } from '@/components/integrations/integration-logs-table'
import { CustomerID } from '@/lib/database/schema/customer'
import { IntegrationLog } from '@/lib/database/schema/integrations'
import { integrationsService } from '@/service/integrations'

interface Props {
	customerID: CustomerID
}

const pageSize = 10

export async function IntegrationLogsTableWrapper({ customerID }: Props) {
	const logs: IntegrationLog[] = []
	let readCount = 0
	let pageCount = 1

	do {
		const curPage = await integrationsService.getIntegrationLogs(
			customerID,
			pageSize,
			pageCount,
		)
		readCount = curPage.length
		pageCount += 1
		logs.push(...curPage)
	} while (readCount == pageSize)

	return <TableIntegrationLogs data={logs} />
}
