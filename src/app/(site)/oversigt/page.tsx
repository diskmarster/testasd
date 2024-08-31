"use client"
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useSession } from "@/context/session";

export default function Home() {
  const { user } = useSession()
  return (
    <main>
      <pre>Hello, {JSON.stringify(user, null, 2)}</pre>
      <ThemeToggle />
    </main>
  );
}
