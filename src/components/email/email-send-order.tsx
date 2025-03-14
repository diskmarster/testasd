import { siteConfig } from '@/config/site'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Tailwind, Text } from '@react-email/components'
import { User } from 'lucia'

export function EmailSendOrder({ company, sender, link }: { company: string, sender: User, link: string }) {
	return (
		<Tailwind>
			<Html>
				<Head />
				<Preview>{company} har sendt dig en {siteConfig.name} bestilling</Preview>
				<Body className='bg-muted font-sans'>
					<Container className='bg-white mx-auto pt-5 pb-12'>
						<Section className='px-12'>
							<Heading as='h4'>Nem Lager</Heading>
							<Hr className='border-border my-5' />
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								Du har fået sendt en {siteConfig.name} bestilling af {sender.name}. For at downloade bestillingen
								skal du klikke på linket nedenunder.
							</Text>
							<Button
								className='bg-[#023eb6] rounded-md text-white text-base font-semibold text-center block w-full p-2.5'
								href={link}>
								Download {siteConfig.name} bestilling
							</Button>
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
