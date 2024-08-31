"use client"
import { signOutAction } from "@/app/(auth)/log-ud/actions";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/session";
import { userRoles } from "@/data/user.types";

export default function Home() {
  const { user } = useSession()
  return (
    <main>
      <pre>Hello, {JSON.stringify(user, null, 2)}</pre>
      <ThemeToggle />
      <form action={() => signOutAction()}>
        <Button type="submit">Log ud</Button>
      </form>
      {userRoles.map((r, i) => (<p key={i}>{r}</p>))}
    </main>
  );
}
