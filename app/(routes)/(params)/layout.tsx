import { Footer } from "@/components/footer";
import { Header } from "@/components/header/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="container relative pt-2 min-h-[calc(100dvh-8.25rem)]">
        {children}
      </div>
      <Footer className="justify-center w-11/12 max-w-2xl py-6" />
    </>
  );
}
