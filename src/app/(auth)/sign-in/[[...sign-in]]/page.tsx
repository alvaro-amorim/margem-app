import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

import { isClerkConfigured } from "@/lib/env";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Clerk ainda não configurado</CardTitle>
            <CardDescription>
              Adicione as chaves no arquivo de ambiente para habilitar login e proteção de rotas.
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <SignIn />
    </main>
  );
}
