import { ImageResponse } from "next/og";

async function loadAssets(): Promise<
  {
    name: string;
    data: Buffer;
    weight: 400 | 600 | 700 | 800 | 900;
    style: "normal";
  }[]
> {
  const [
    { base64Font: normal },
    { base64Font: mono },
    { base64Font: semibold },
    { base64Font: bold },
    { base64Font: extrabold },
    { base64Font: black },
  ] = await Promise.all([
    import("./geist-regular-otf.json").then((mod) => mod.default || mod),
    import("./geistmono-regular-otf.json").then((mod) => mod.default || mod),
    import("./geist-semibold-otf.json").then((mod) => mod.default || mod),
    import("./geist-bold-otf.json").then((mod) => mod.default || mod),
    import("./geist-extrabold-otf.json").then((mod) => mod.default || mod),
    import("./geist-black-otf.json").then((mod) => mod.default || mod),
  ]);

  return [
    {
      name: "Geist",
      data: Buffer.from(normal, "base64"),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Geist Mono",
      data: Buffer.from(mono, "base64"),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Geist",
      data: Buffer.from(semibold, "base64"),
      weight: 600 as const,
      style: "normal" as const,
    },
    {
      name: "Geist",
      data: Buffer.from(bold, "base64"),
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "Geist",
      data: Buffer.from(extrabold, "base64"),
      weight: 800 as const,
      style: "normal" as const,
    },
    {
      name: "Geist",
      data: Buffer.from(black, "base64"),
      weight: 900 as const,
      style: "normal" as const,
    },
  ];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");

  const [fonts] = await Promise.all([loadAssets()]);

  return new ImageResponse(
    (
      <div
        style={{
          fontFamily: "Geist Sans",
          color: "white",
          width: "100%",
          height: "100%",
          backgroundImage: `url('https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AETKtVGX6PE8HonBkyUQvYdMST07mubG5VcxAhz')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontWeight: 800,
            fontSize: 56,
            textAlign: "center",
            marginTop: "380px",
            paddingLeft: "2.5rem",
            paddingRight: "2.5rem",
            letterSpacing: "-0.04em",
          }}
        >
          {title}
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    }
  );
}
