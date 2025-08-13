import { siteConfig } from '@/config/site'
import {
	Body,
	CodeBlock,
	Container,
	duotoneDark,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from '@react-email/components'

export function EmailCreatedUser({
	company,
	password,
	pin,
}: {
	company: string
	password: string
	pin: string
}) {
	return (
		<Tailwind>
			<Html>
				<Head />
				<Preview>
					Du er blevet oprettet i {siteConfig.name} af Skancode A/S
				</Preview>
				<Body className='bg-muted font-sans'>
					<Container className='bg-white mx-auto pt-5 pb-12'>
						<Section className='px-12'>
							<Heading as='h4'>Nem Lager</Heading>
							<Hr className='border-border my-5' />
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								Du er blevet oprettet som bruger i {siteConfig.name} som en del
								af {company}. Vi ser frem til at have dig med, og vi har gjort
								det nemt for dig at komme i gang.
							</Text>
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								Vi har allerede lavet en adgangskode til dig samt en PIN kode
								til vores app, som du finder nedenunder. Vi anbefaler
								selvfølgelig at du ændrer dem til noget du nemmere kan huske.
							</Text>
							<CodeBlock
								code={`
## Adgangskode
${password}

## PIN kode
${pin}
`}
								language='md'
								theme={duotoneDark}
							/>
							<Hr className='border-border my-5' />
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								Vores supportteam står klar til at hjælpe jer, hvis I har
								spørgsmål eller har brug for hjælp til opsætningen. Tøv ikke med
								at kontakte os – vi er her for at sikre, at I får den bedst
								mulige oplevelse med {siteConfig.name}.
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
