import { Footer } from "@/components/footer";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex flex-col items-center gap-6 w-11/12 max-w-[500px] min-h-screen pt-12 mx-auto my-0">
        {children}
      </main>
      <Footer className="justify-center w-11/12 max-w-lg py-8" />
    </>
  );
}
