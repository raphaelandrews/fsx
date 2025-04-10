import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function Home({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="container relative min-h-[calc(100vh-9.5rem)]">{children}</div>
      <Footer className="container flex-col justify-between md:flex-row" />
    </>
  );
}
