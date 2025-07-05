import { Footer } from "@/components/footer";
import { Header } from "@/components/header/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="!max-w-[1120px] container relative min-h-[calc(100dvh-8.25rem)] pt-2">
        {children}
      </div>
      <Footer className="max-w-[1120px] justify-between py-6" />
    </>
  );
}
