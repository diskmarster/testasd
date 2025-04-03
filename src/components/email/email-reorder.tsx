import { siteConfig } from "@/config/site";
import { CustomerMailSettingWithEmail } from "@/data/customer.types";
import { Body, Text, Container, Head, Heading, Hr, Html, Preview, Section, Tailwind, Link } from "@react-email/components";

interface Props {
	mailInfo: CustomerMailSettingWithEmail
  link: string
}

export function EmailSendReorder({ mailInfo, link }: Props) {
  return (
    <Tailwind>
      <Html>
				<Head />
				<Body className='bg-muted font-sans'>
					<Preview>Der er vare som skal genbestilles i {siteConfig.name}</Preview>
					<Container className='bg-white mx-auto pt-5 pb-12'>
						<Section className='px-12'>
							<Heading as='h4'>{siteConfig.name}</Heading>
							<Hr className='border-[#e6ebf1] dark:border-[#6b6b6b] my-5' />
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								Der er varer i {siteConfig.name} som skal genbestilles til {mailInfo.locationName}. 
							</Text>
							<Text className='text-primary-foreground text-base leading-6 text-left'>
                Du kan se de vare som skal genbestilles ved at tilgå dette <Link href={link}>link</Link>
              </Text>
							<Hr className='border-[#e6ebf1] dark:border-[#6b6b6b] my-5' />
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								Vores supportteam står klar til at hjælpe jer, hvis I har
								spørgsmål eller har brug for hjælp til opsætningen. Tøv ikke med
								at kontakte os – vi er her for at sikre, at I får den bedst mulige
								oplevelse med {siteConfig.name}.
							</Text>
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								- SkanCode Teamet
							</Text>
							<Hr className='border-[#e6ebf1] dark:border-[#6b6b6b] my-5' />
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
