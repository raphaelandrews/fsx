import { ViewportWarning } from "./components/viewport-waring";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="relative w-screen h-screen bg-[hsl(0_0%_85%] dark:bg-background bg-[radial-gradient(hsl(0_0%_75%),transparent_1px)] dark:bg-[radial-gradient(var(--color-secondary),transparent_1px)] [background-size:16px_16px] overflow-hidden">
        {children}
        <ViewportWarning />
      </div>
    </>
  );
}
