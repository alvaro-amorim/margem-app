import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

import { clerkEmbeddedAppearance } from "@/lib/clerk-theme";
import { isClerkConfigured } from "@/lib/env";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Clerk ainda não configurado</CardTitle>
            <CardDescription>
              O cadastro fica disponível assim que as credenciais do Clerk forem adicionadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" className="text-sm font-medium text-slate-700 underline underline-offset-4">
              Voltar para a página inicial
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      fallbackRedirectUrl="/dashboard"
      appearance={clerkEmbeddedAppearance}
    />
  );
}
