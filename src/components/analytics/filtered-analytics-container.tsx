import { analyticsService } from "@/service/analytics"
import { FilteredAnalyticsChart } from "./filtered-analytics-chart"
import { AnalyticsFilterDTO } from "@/app/[lng]/(site)/sys/analytics/validation"

export async function FilteredAnalyticsContainer() {
  const filter: AnalyticsFilterDTO = {
    start: { days: 6 },
  }
  const data = await analyticsService.getFilteredAnalytics(filter)

  return (
   <FilteredAnalyticsChart defaultAnalytics={data} defaultFilter={filter}/>
  )
}
