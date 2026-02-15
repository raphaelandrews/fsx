import { Footer } from "@/components/footer";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="relative flex-1">
        <div className="absolute inset-y-0 left-1/2 w-full max-w-[720px] -translate-x-1/2 mx-2 sm:mx-8 md:mx-0 dotted-border-x pointer-events-none" />
        <div className="relative">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
