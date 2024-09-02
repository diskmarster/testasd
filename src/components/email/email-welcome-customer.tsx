import { siteConfig } from "@/config/site";
import { CustomerActivationLink } from "@/service/customer";
import { Heading, Link, Section, Tailwind, Text } from "@react-email/components";

export function EmailWelcomeCustomer({ company, link }: { company: string, link: CustomerActivationLink }) {
  return (
    <Tailwind>
      <Section>
        <Heading as="h1">Velkommen {company}</Heading>
        <Text>Vi er glade for at have jer som kunde i {siteConfig.name}</Text>
      </Section>
      <Section>
        <Heading as="h2">Opret jeres første bruger</Heading>
        <Text><Link href={link} target="_blank">Følg dette oprettelseslink</Link> for at oprette jeres første bruger, og komme i gang med at bruge systemet.</Text>
      </Section>
      <Section>
        <Text>
          Venlig hilsen<br />
          SkanCode Teamet
        </Text>
      </Section>
    </Tailwind>
  );
};
