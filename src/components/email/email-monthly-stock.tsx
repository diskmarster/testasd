import { siteConfig } from '@/config/site'
import { CustomerMailSettingWithEmail } from '@/data/customer.types'
import { Customer } from '@/lib/database/schema/customer'
import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from '@react-email/components'
import { formatDate } from 'date-fns'
import { da } from 'date-fns/locale'

interface Props {
	mailInfo: CustomerMailSettingWithEmail
	customer: Customer
}

export function EmailSendMonthlyStock({ mailInfo, customer }: Props) {
	const dateStr = formatDate(Date.now(), 'do MMMM yyyy', { locale: da })
	return (
		<Tailwind>
			<Html>
				<Head />
				<Body className='bg-muted font-sans'>
					<Preview>{siteConfig.name} Rapport Mail Service</Preview>
					<Container className='bg-white mx-auto pt-5 pb-12'>
						<Section className='px-12'>
							<Heading as='h4'>Nem Lager</Heading>
							<Hr className='border-[#e6ebf1] dark:border-[#6b6b6b] my-5' />
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								Hej {customer.company}
							</Text>
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								Vedhæftet finder du den seneste lagerværdirapport for{' '}
								{mailInfo.locationName}. Rapporten indeholder en opgørelse over
								din lagerbeholdning og værdi pr. {dateStr}.
							</Text>
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								Du finder rapporten i både PDF- og Excelformat, så du nemt kan
								gennemgå og bearbejde dine data.
							</Text>
							<Hr className='border-[#e6ebf1] dark:border-[#6b6b6b] my-5' />
							<Text className='text-primary-foreground text-base leading-6 text-left'>
								Vores supportteam står klar til at hjælpe jer, hvis I har
								spørgsmål eller har brug for hjælp til opsætningen. Tøv ikke med
								at kontakte os – vi er her for at sikre, at I får den bedst
								mulige oplevelse med {siteConfig.name}.
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
