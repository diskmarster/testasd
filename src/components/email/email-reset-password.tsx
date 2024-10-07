import { siteConfig } from '@/config/site'
import { ResetPasswordLink } from '@/service/password-reset'
import { Heading, Link, Section, Tailwind, Text } from '@react-email/components'

export function EmailResetPassword({
  link,
}: {
  link: ResetPasswordLink
}) {
  return (
    <Tailwind>
      <Section>
        <Heading as='h1'>Glemt kodeord!</Heading>
        <Text>
          Vi har modtaget en forespørgsel på at nulstille dit kodeord på{' '}
          {siteConfig.name}
        </Text>
      </Section>
      <Section>
        <Text>
          <Link href={link} target='_blank'>
            Følg dette link
          </Link>{' '}
          for at nulstille dit kodeord.
        </Text>
      </Section>
      <Section>
        <Text>
          Er det ikke dig som har forspugt om en nulstilling, så kan du ignorere
          denne mail.
        </Text>
      </Section>
      <Section>
        <Text>
          Venlig hilsen
          <br />
          SkanCode Teamet
        </Text>
      </Section>
    </Tailwind>
  )
}
