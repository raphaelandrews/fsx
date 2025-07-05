import { Footer } from "@/components/footer";
import { Header } from "@/components/header/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="container relative min-h-[calc(100dvh-8.25rem)] pt-2">
        {children}
      </div>
      <Footer className="w-11/12 max-w-2xl justify-center py-6" />
    </>
  );
}
