import { SignUpCard } from "@/components/auth/sign-up-card";
import { customerService } from "@/service/customer";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Registrer",
}

export default async function Page({ params }: { params: { linkID: string } }) {
  const customer = await customerService.getByLinkID(parseInt(params.linkID))

  if (!customer || !params.linkID) redirect("/log-ind")

  return (
    <section className="w-full">
      <p>{JSON.stringify(customer, null, 2)}</p>
      <SignUpCard customer={customer} />
    </section>
  )
}
