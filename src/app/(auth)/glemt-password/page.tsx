import { ForgotPasswordCard } from "@/components/auth/forgot-password";

export const maxDuration = 60

export default async function Page() {
	return (
		<section className="w-full">
			<ForgotPasswordCard />
		</section>
	)
}
