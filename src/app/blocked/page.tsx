import Link from "next/link";
import { Ban, ShieldAlert } from "lucide-react";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BlockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_24%),linear-gradient(180deg,#fffdf8_0%,#f7f3e7_100%)] px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="gap-4">
          <AppLogo href="/" size="md" priority />
          <Badge className="w-fit">Acesso bloqueado</Badge>
          <div className="flex items-start gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <CardTitle className="text-2xl">Esta conta nao pode acessar o app no momento</CardTitle>
              <CardDescription className="mt-2">
                O email ou a conta foi bloqueado pela administracao da plataforma. Se voce acredita
                que isso foi um engano, entre em contato com o suporte responsavel.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">
              <Ban className="size-4" />
              Voltar para a pagina inicial
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
