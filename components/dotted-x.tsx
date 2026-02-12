export function DottedX({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[720px] mx-2 sm:mx-8 md:mx-auto relative p-3 dotted-border-x">
      {children}
    </div>
  )
}