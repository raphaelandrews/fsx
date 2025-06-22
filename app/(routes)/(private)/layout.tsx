import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import { Header } from "./components/header/header";
import { Footer } from "@/components/footer";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <>
      <Header />
      <div className="container relative !max-w-[1120px] pt-2 min-h-[calc(100dvh-8.25rem)]">
        {children}
      </div>
      <Footer className="justify-between max-w-[1120px] py-6" />
    </>
  );
}
