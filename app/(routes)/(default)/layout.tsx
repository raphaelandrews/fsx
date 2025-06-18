import { Footer } from "@/components/footer";
import { Toolbar } from "@/components/toolbar/toolbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toolbar />
      <div className="container !max-w-[1120px] relative min-h-[calc(100dvh-8.25rem)] sm:min-h-[calc(100dvh-7.5rem)]">
        {children}
      </div>
      <Footer className="!max-w-[1120px]" />
    </>
  );
}
