"use client"
import { signOutAction } from "@/app/(auth)/log-ud/actions";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/session";

export default function Home() {
  const { user } = useSession()
  return (
    <main>
      <pre>Hello, {JSON.stringify(user, null, 2)}</pre>
      <ThemeToggle />
      <form action={() => signOutAction()}>
        <Button type="submit">Log ud</Button>
      </form>
    </main>
  );
}
