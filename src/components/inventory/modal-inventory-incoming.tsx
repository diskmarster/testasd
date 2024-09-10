import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { FormattedInventory } from "@/data/inventory.types"
import { Batch, Placement } from "@/lib/database/schema/inventory"

interface Props {
  inventory: FormattedInventory[]
  placements: Placement[]
  batches: Batch[]
}

export function ModalInventoryIncoming({ inventory, placements, batches }: Props) {
  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline'>
          <Icons.plus className="size-4" />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Opdater beholdning</CredenzaTitle>
          <CredenzaDescription>
            Opdater beholdning ved at lave en tilgang eller afgang
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          Beholdning antal: {inventory.length}
        </CredenzaBody>
        <CredenzaFooter>
          <CredenzaClose asChild>
            <button>Close</button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}
