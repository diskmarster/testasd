import { TableSysUsers } from "@/components/sys/table-users"
import { userService } from "@/service/user"

export async function UsersTable() {
  const users = await userService.getAll()
  console.log(users)
  return (
    <TableSysUsers data={users} />
  )
}
