import { Footer } from "@/components/footer";
import { Header } from "@/components/header/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <div className="absolute inset-y-0 inset-x-2 sm:inset-x-8 md:inset-x-0 md:left-1/2 md:w-full md:max-w-[720px] md:-translate-x-1/2 dotted-border-x pointer-events-none" />
      <Header />
      <main className="relative flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
