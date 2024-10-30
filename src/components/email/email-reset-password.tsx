import { siteConfig } from '@/config/site'
import { ResetPasswordType } from '@/data/user.types'
import { ResetPasswordLink } from '@/service/password-reset'
import { Heading, Link, Section, Tailwind, Text } from '@react-email/components'

export function EmailResetPassword({
  link,
  pwType,
}: {
  link: ResetPasswordLink
  pwType: ResetPasswordType
}) {
  const pwName = pwType == 'pw' ? 'kodeord' : 'pinkode'

  return (
    <Tailwind>
      <Section>
        <Heading as='h1'>Glemt {pwName}!</Heading>
        <Text>
          Vi har modtaget en forespørgsel på at nulstille dit {pwName} på{' '}
          {siteConfig.name}
        </Text>
      </Section>
      <Section>
        <Text>
          <Link href={link} target='_blank'>
            Følg dette link
          </Link>{' '}
          for at nulstille dit {pwName}.
        </Text>
      </Section>
      <Section>
        <Text>
          Er det ikke dig som har forspurgt om en nulstilling, så kan du ignorere
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
