import { siteConfig } from '@/config/site'
import { UserActivationLink } from '@/service/user'
import { Heading, Link, Section, Tailwind, Text } from '@react-email/components'

export function EmailInviteUser({ link }: { link: UserActivationLink }) {
  return (
    <Tailwind>
      <Section>
        <Heading as='h1'>Du er blevet inviteret til Nem Lager</Heading>
        <Text>Vi er glade for at have jer som kunde i {siteConfig.name}</Text>
      </Section>
      <Section>
        <Heading as='h2'>Opret din bruger og kom godt i gang</Heading>
        <Text>
          <Link href={link} target='_blank'>
            Følg dette oprettelseslink
          </Link>{' '}
          for at oprette din bruger, og komme i gang med at bruge systemet.
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
