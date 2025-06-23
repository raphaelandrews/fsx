import { Analytics } from "@vercel/analytics/react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="container relative !max-w-[1120px] pt-2 min-h-[calc(100dvh-8.25rem)]">
        {children}
      </div>
      <Footer className="justify-between max-w-[1120px] py-6" />
      <Analytics />
    </>
  );
}
