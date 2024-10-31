import { TableErrors } from "@/components/errors/table-errors"
import { errorsService } from "@/service/errors"

export async function ServerTable() {
  const errors = await errorsService.getAll()
  return (
    <TableErrors data={errors} />
  )
}
