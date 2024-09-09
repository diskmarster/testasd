"use client"

import { Row, Table } from "@tanstack/react-table";
import { TableActionsWrapper } from "../table/table-actions-wrapper";
import { FormattedInventory } from '@/data/inventory.types'
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface Props {
  table: Table<FormattedInventory>
  row: Row<FormattedInventory>
}

export function TableOverviewActions({ table, row }: Props) {
  return (
    <TableActionsWrapper>
      <DropdownMenuItem>Gå til varekort</DropdownMenuItem>
    </TableActionsWrapper>
  )
}
