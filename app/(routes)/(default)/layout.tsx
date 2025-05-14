import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function Home({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="container !max-w-[1120px] relative pt-2 min-h-[calc(100dvh-8.25rem)] sm:min-h-[calc(100dvh-7.5rem)]">
        {children}
      </div>
      <Footer className="!max-w-[1120px]" />
    </>
  );
}
