export function Footer() {
  return (
    <footer className="container flex flex-col justify-between items-center gap-4 py-6 md:flex-row">
      <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
        Built by 🏝️{" "}
        <a
          href="https://ndrws.neocities.org/"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-sea hover:text-gold transition duration-200"
        >
          Andrews
        </a>
        .
      </p>
    </footer>
  );
}
