import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { Row, Table } from '@tanstack/react-table'
import { Unit } from '@/lib/database/schema/inventory'
import { toggleBarredUnitAction } from '@/app/(site)/sys/enheder/actions'
import { UpdateUnitForm } from '@/components/inventory/modal-update-unit'




 interface Props {
    table: Table<Unit>
    row: Row<Unit>
    } 

    export function TableOverviewActions({ table, row}: Props) {
      const [open, setOpen] = useState<boolean>(false)
      const handleToggleBar = async () => {
        const isCurrentlyBarred = row.original.isBarred
        const updatedBarredStatus = !isCurrentlyBarred
        const result = await toggleBarredUnitAction(
          row.original.id,
          updatedBarredStatus,
        )
      }
      
    return (
        <>
          <TableActionsWrapper>
            <DropdownMenuItem onClick={() => setOpen(true)}>
              Redigér produkt
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleBar}>
              {row.original.isBarred ? 'Ophæv spærring' : 'Spær'}
            </DropdownMenuItem>
          </TableActionsWrapper>
    
      <UpdateUnitForm
      unitToEdit={row.original}
      isOpen={open}                     
      setOpen={setOpen}
      /> 
      </>
      )
    }