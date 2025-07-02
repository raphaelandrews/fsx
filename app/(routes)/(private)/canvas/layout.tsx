export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-screen h-screen bg-[radial-gradient(var(--color-secondary),transparent_1px)] [background-size:16px_16px] overflow-hidden">
      {children}
    </div>
  );
}
