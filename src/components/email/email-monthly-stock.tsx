import { siteConfig } from '@/config/site'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Tailwind, Text } from '@react-email/components'

interface Props { }

export function EmailSendMonthlyStock({ }: Props) {
	return (
		<Tailwind>
			<Html>
				<Head />
				<Preview>TEST</Preview>
				<Body className='bg-muted font-sans'>
					<Container className='bg-white mx-auto pt-5 pb-12'>
						<Section className='px-12'>
							<Heading as='h4'>Nem Lager</Heading>
							<Hr className='border-border my-5' />
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								Din månedlig lagerværdi rapport for TEST
							</Text>
							<Hr className='border-border my-5' />
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								Vores supportteam står klar til at hjælpe jer, hvis I har
								spørgsmål eller har brug for hjælp til opsætningen. Tøv ikke med
								at kontakte os – vi er her for at sikre, at I får den bedst mulige
								oplevelse med {siteConfig.name}.
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
