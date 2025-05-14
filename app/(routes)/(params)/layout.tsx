import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function ParamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="container relative pt-2 min-h-[calc(100dvh-8.25rem)] sm:min-h-[calc(100dvh-7.5rem)]">
        {children}
      </div>
      <Footer className="justify-center w-11/12 max-w-2xl px-0" />
    </>
  );
}
