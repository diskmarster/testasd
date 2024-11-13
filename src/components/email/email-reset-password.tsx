import { siteConfig } from '@/config/site'
import { ResetPasswordType } from '@/data/user.types'
import { ResetPasswordLink } from '@/service/password-reset'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Tailwind, Text } from '@react-email/components'

export function EmailResetPassword({
  link,
  pwType,
}: {
  link: ResetPasswordLink
  pwType: ResetPasswordType
}) {
  const pwName = pwType == 'pw' ? 'adgangskode' : 'pinkode'

  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Glemt {pwName} på {siteConfig.name}</Preview>
        <Body className='bg-muted font-sans'>
          <Container className='bg-white mx-auto pt-5 pb-12'>
            <Section className='px-12'>
              <Heading as='h4'>{siteConfig.name}</Heading>
              <Hr className='border-border my-5' />
              <Text className='text-primary-foreground text-base leading-6 text-left'>
                Vi har modtaget en forespørgsel på at nulstille din {pwName} på
                {siteConfig.name}.
              </Text>
              <Text className='text-primary-foreground text-base leading-6 text-left'>
                For at nulstille din {pwName} skal du blot klikke på knappen
                nedenunder og følge instrukserne.
              </Text>
              <Button
                className='bg-[#023eb6] rounded-md text-white text-base font-semibold text-center block w-full p-2.5'
                href={link}>
                Nulstil din {pwName}
              </Button>
              <Hr className='border-border my-5' />
              <Text className='text-primary-foreground text-base leading-6 text-left'>
                Vores supportteam står klar til at hjælpe jer, hvis I har
                spørgsmål eller har brug for hjælp til opsætningen. Tøv ikke med
                at kontakte os – vi er her for at sikre, at I får den bedst mulige
                oplevelse med Nem Lager.
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
