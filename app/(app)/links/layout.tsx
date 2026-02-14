import { Footer } from "@/components/footer";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="relative min-h-[calc(100dvh-4rem)]">
        {children}
      </div>
      <Footer className="justify-center py-6" />
    </>
  );
}
