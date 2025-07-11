/** biome-ignore-all lint/performance/noImgElement: No */
"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// biome-ignore lint/suspicious/noShadowRestrictedNames: No
export default function Error() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Aconteceu algo de errado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Algumas capivaras roeram os fios que ligam o site, por favor tente
            uma das opções abaixo.
          </p>

          <div className="flex gap-2 justify-center">
            <img src="/capybara-wine.gif" alt="Capivara" />
            <img
              src="/capybara-wine.gif"
              alt="Capivara"
              className="rotate-y-180"
            />
            <img src="/capybara.gif" alt="Capivara" className="ml-2 mr-4" />
            <img src="/capybara-cake.gif" alt="Capivara" />
            <img src="/capybara-heart.gif" alt="Capivara" />
            <img
              src="/capybara-wine.gif"
              alt="Capivara"
              className="ml-2"
            />
            <img
              src="/capybara-wine.gif"
              alt="Capivara"
              className="rotate-y-180"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => window.location.reload()} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar página
            </Button>
            <Button variant="outline" asChild className="flex-1 bg-transparent">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
