import { TableClients } from "@/components/clients/table-overview"
import { customerService } from "@/service/customer"

export async function ClientTable() {
  const clients = await customerService.getAll()
  return (
    <TableClients data={clients} />
  )
}
