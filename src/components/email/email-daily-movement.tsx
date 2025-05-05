import { siteConfig } from '@/config/site'
import { CustomerMailSettingWithEmail } from '@/data/customer.types'
import { InventoryAction } from '@/data/inventory.types'
import { User } from '@/lib/database/schema/auth'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Tailwind, Text } from '@react-email/components'
import { formatDate } from 'date-fns'
import { da } from 'date-fns/locale'

interface Props {
  actions: InventoryAction[]
	mailInfo: CustomerMailSettingWithEmail
	user: User
}

export function EmailDailyStockMovements({ mailInfo, user: customer, actions }: Props) {
  const dateStr = formatDate(Date.now(), 'do MMMM yyyy', { locale: da })

  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-muted font-sans">
          <Preview>Daglig lageroversigt fra {siteConfig.name}</Preview>
          <Container className="bg-white mx-auto pt-5 pb-12">
            <Section className="px-12">
              <Heading as="h4">{siteConfig.name}</Heading>
              <Hr className="border-[#e6ebf1] dark:border-[#6b6b6b] my-5" />

              <Text className="text-primary-foreground text-base leading-6 text-left">
                Hej {customer.name},
              </Text>

              <Text className="text-primary-foreground text-base leading-6 text-left">
                Her er en oversigt over dine lagerbevægelser fra den {dateStr}.
                Du modtager denne opdatering for lokationen{' '}
                <strong>{mailInfo.locationName}</strong>.
              </Text>

              {actions.length > 0 ? (
                <>
                  <Text className="text-primary-foreground text-base leading-6 text-left mt-4 mb-2">
                    Oversigt over bevægelser:
                  </Text>
                  <table className="w-full border-collapse text-sm text-left mb-6">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-3 py-2">Varenavn</th>
                        <th className="border px-3 py-2">Varenummer</th>
                        <th className="border px-3 py-2">Type</th>
                        <th className="border px-3 py-2">Antal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actions.map((action, index) => (
                        <tr key={index}>
                          <td className="border px-3 py-1">
                            {action.productText1 ?? '–'}
                          </td>
                          <td className="border px-3 py-1">
                            {action.productSku ?? '–'}
                          </td>
                          <td className="border px-3 py-1 capitalize">
                            {action.type}
                          </td>
                          <td className="border px-3 py-1">{action.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                  <Text className="text-primary-foreground text-base leading-6 text-left mt-4">
                    Der er ingen registrerede bevægelser for denne dato.
                  </Text>
                )}

              <Text className="text-primary-foreground text-base leading-6 text-left">
                Vores supportteam står klar til at hjælpe jer, hvis I har
                spørgsmål eller har brug for hjælp til opsætningen. Tøv ikke med
                at kontakte os – vi er her for at sikre, at I får den bedst mulige
                oplevelse med {siteConfig.name}.
              </Text>

              <Text className="text-primary-foreground text-base leading-6 text-left">
                – SkanCode Teamet
              </Text>

              <Hr className="border-[#e6ebf1] dark:border-[#6b6b6b] my-5" />

              <Text className="text-muted-foreground text-xs leading-5">
                SkanCode A/S
                <br />
                Hejrevang 13, 3450 Allerød
                <br />
                support@skancode.dk
                <br />
                +45 7222 0211
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}
