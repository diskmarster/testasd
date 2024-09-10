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

export function ModalInventoryIncoming() {
  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline'>
          <Icons.plus className="size-4" />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Credenza</CredenzaTitle>
          <CredenzaDescription>
            A responsive modal component for shadcn/ui.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          This component is built using shadcn/ui&apos;s dialog and drawer
          component, which is built on top of Vaul.
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
