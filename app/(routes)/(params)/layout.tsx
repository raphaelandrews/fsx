import { Footer } from "@/components/footer";
import { Toolbar } from "@/components/toolbar/toolbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toolbar />
      <div className="container relative !max-w-[1120px]  min-h-[calc(100dvh-4.75rem)]">
        {children}
      </div>
      <Footer className="!justify-center w-11/12 max-w-2xl px-0" />
    </>
  );
}
