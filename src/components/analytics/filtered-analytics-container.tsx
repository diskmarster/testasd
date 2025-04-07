import { analyticsService } from "@/service/analytics"
import { FilteredAnalyticsChart } from "./filtered-analytics-chart"
import { AnalyticsFilterDTO } from "@/app/[lng]/(site)/sys/analytics/validation"
import { customerService } from "@/service/customer"

export async function FilteredAnalyticsContainer() {
  const filter: AnalyticsFilterDTO = {
    start: { days: 6 },
  }
  const data = await analyticsService.getFilteredAnalytics(filter)
  const customers = await customerService.getAll()

  return (
   <FilteredAnalyticsChart defaultAnalytics={data} defaultFilter={filter} customers={customers}/>
  )
}
