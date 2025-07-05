import { ImageResponse } from "next/og"

async function loadAssets(): Promise<
  { name: string; data: Buffer; weight: 400 | 600; style: "normal" }[]
> {
  const [
    { base64Font: normal },
    { base64Font: mono },
    { base64Font: semibold },
  ] = await Promise.all([
    import("./geist-regular-otf.json").then((mod) => mod.default || mod),
    import("./geistmono-regular-otf.json").then((mod) => mod.default || mod),
    import("./geist-semibold-otf.json").then((mod) => mod.default || mod),
  ])

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
  ]
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
          backgroundImage: `url('https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AET4p23TlHHl0J2X9r8cZeA3iMNaxuywIBLDCt7')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span tw="font-black text-[200px] italic">FSX</span>
        <p tw="font-bold text-[4rem] text-center mt-[5.25rem] px-10">{title}</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    }
  );
}
