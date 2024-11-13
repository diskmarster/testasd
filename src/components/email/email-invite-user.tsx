import { siteConfig } from '@/config/site'
import { UserActivationLink } from '@/service/user'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Tailwind, Text } from '@react-email/components'

export function EmailInviteUser({ company, link }: { company: string, link: UserActivationLink }) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>{company} har inviteret dig til {siteConfig.name}</Preview>
        <Body className='bg-muted font-sans'>
          <Container className='bg-white mx-auto pt-5 pb-12'>
            <Section className='px-12'>
              <Heading as='h4'>Nem Lager</Heading>
              <Hr className='border-border my-5' />
              <Text className='text-primary-foreground text-base leading-6 text-left'>
                Du er blevet inviteret til at oprette en konto på {siteConfig.name} som en
                del af {company}. Vi ser frem til at have dig med, og vi har gjort
                det nemt for dig at komme i gang.
              </Text>
              <Text className='text-primary-foreground text-base leading-6 text-left'>
                For at komme i gang og få mest muligt ud af vores system, bedes du
                oprette en bruger ved at klikke på knappen nedenunder.
              </Text>
              <Button
                className='bg-primary rounded-md text-primary-foreground text-base font-semibold text-center block w-full p-2.5'
                href={link}>
                Kom i gang med at bruge {siteConfig.name}
              </Button>
              <Hr className='border-border my-5' />
              <Text className='text-primary-foreground text-base leading-6 text-left'>
                Vores supportteam står klar til at hjælpe jer, hvis I har
                spørgsmål eller har brug for hjælp til opsætningen. Tøv ikke med
                at kontakte os – vi er her for at sikre, at I får den bedst mulige
                oplevelse med {siteConfig.name}.
              </Text>
              <Text className='text-primary-foreground text-base leading-6 text-left'>
                Endnu en gang, velkommen ombord! Vi glæder os til at samarbejde
                med jer.
              </Text>
              <Text className='text-primary-foreground text-base leading-6 text-left'>
                - SkanCode Teamet
              </Text>
              <Hr className='border-border my-5' />
              <Text className='text-muted-foreground text-xs leading-5'>
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
