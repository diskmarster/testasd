import { CreateCustomerCard } from "@/components/auth/create-customer-card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opret kunde",
}

export default async function Page() {
  return (
    <section className="w-full">
      <CreateCustomerCard />
    </section>
  )
}
