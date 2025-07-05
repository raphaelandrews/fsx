"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-8xl font-bold text-muted-foreground">404</h1>
            <h2 className="text-2xl font-semibold tracking-tight">
              Página não encontrada
            </h2>
            <p className="text-muted-foreground max-w-sm">
              Desculpe, não conseguimos encontrar a página que você procura. Ela
              pode ter sido movida, excluída ou você capivarou na hora de
              digitar o URL.
            </p>
          </div>

          {/** biome-ignore lint/performance/noImgElement: No */}
          <img src="/capybara.webp" alt="Capivara" />

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button asChild className="flex-1">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retornar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
