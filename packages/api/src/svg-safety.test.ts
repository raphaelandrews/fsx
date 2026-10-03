import { describe, expect, test } from "bun:test";

import { MEDIA_KEY_PATTERN, MEDIA_PATH_PATTERN, mediaPathPatternFor } from "./media-kinds";
import { ensureSvgViewBox, findSvgProblem } from "./svg-safety";

const svg = (body: string, attributes = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"') =>
  `<svg ${attributes}>${body}</svg>`;

describe("findSvgProblem", () => {
  test.each([
    ["a plain shape", svg('<rect width="24" height="24" fill="#c00"/>')],
    ["an XML declaration and comments", `<?xml version="1.0" encoding="UTF-8"?>\n<!-- logo -->\n${svg("<path d='M0 0h24'/>")}`],
    [
      "gradients referenced by fragment",
      svg('<defs><linearGradient id="g"><stop offset="0"/></linearGradient></defs><rect fill="url(#g)" width="1" height="1"/>'),
    ],
    ["an internal <use>", svg('<defs><path id="p" d="M0 0"/></defs><use href="#p"/><use xlink:href="#p"/>')],
    ["an embedded raster", svg('<image href="data:image/png;base64,iVBORw0KGgo=" width="1" height="1"/>')],
    ["a <style> with CDATA", svg("<style><![CDATA[.a{fill:url(#g)}]]></style>")],
    [
      "Inkscape bookkeeping",
      svg(
        '<sodipodi:namedview id="n" inkscape:zoom="1"/><metadata><rdf:RDF><cc:Work><dc:title>Logo</dc:title></cc:Work></rdf:RDF></metadata>',
        'xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="x" xmlns:inkscape="y" sodipodi:docname="logo.svg"',
      ),
    ],
  ])("accepts %s", (_name, source) => {
    expect(findSvgProblem(source)).toBeNull();
  });

  test.each([
    ["a script element", svg("<script>alert(1)</script>"), "not allowed"],
    ["a namespaced script", svg("<svg:script>alert(1)</svg:script>"), "not allowed"],
    ["foreignObject", svg("<foreignObject><div/></foreignObject>"), "not allowed"],
    ["animation that can rewrite links", svg('<set attributeName="href" to="javascript:alert(1)"/>'), "not allowed"],
    ["an event handler", svg('<rect onclick="alert(1)"/>'), "event handlers"],
    ["an event handler on the root", '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>', "event handlers"],
    ["a handler hidden behind > in a quoted value", svg('<path d="M0 0>" onload="alert(1)"/>'), "event handlers"],
    ["an external link", svg('<image href="https://evil.example/x.png"/>'), "links"],
    ["a javascript: link", svg('<a href="javascript:alert(1)"><rect/></a>'), "not allowed"],
    ["an entity-encoded javascript: link", svg('<use href="&#106;avascript:alert(1)"/>'), "links"],
    ["a nested SVG data URL", svg('<image href="data:image/svg+xml;base64,PHN2Zy8+"/>'), "links"],
    ["a DOCTYPE", `<!DOCTYPE svg [<!ENTITY x "y">]>${svg("")}`, "DOCTYPE"],
    ["an external stylesheet", `<?xml-stylesheet href="https://evil.example/a.css"?>${svg("")}`, "processing"],
    ["a CSS import", svg("<style>@import url(https://evil.example/a.css);</style>"), "import"],
    ["an external CSS url", svg('<rect style="fill:url(https://evil.example/x)"/>'), "inside the file"],
    ["CDATA outside <style>", svg("<text><![CDATA[x]]></text>"), "CDATA"],
    ["an HTML document", "<html><body>hi</body></html>", "not an SVG"],
    ["unbalanced markup", '<svg xmlns="http://www.w3.org/2000/svg"><g>', "well-formed"],
    ["content after the root", `${svg("")}<script>alert(1)</script>`, "after the root"],
    ["unquoted attributes", "<svg width=10></svg>", "could not be read"],
  ])("rejects %s", (_name, source, reason) => {
    expect(findSvgProblem(source)).toContain(reason);
  });
});

describe("ensureSvgViewBox", () => {
  test("derives a viewBox from plain width and height", () => {
    expect(ensureSvgViewBox('<svg width="120px" height="80"><rect/></svg>')).toBe(
      '<svg viewBox="0 0 120 80" width="120px" height="80"><rect/></svg>',
    );
  });

  test("keeps an existing viewBox and skips relative sizes", () => {
    const withViewBox = '<svg viewBox="0 0 1 1" width="10" height="10"/>';
    expect(ensureSvgViewBox(withViewBox)).toBe(withViewBox);
    const relative = '<svg width="100%" height="100%"/>';
    expect(ensureSvgViewBox(relative)).toBe(relative);
  });
});

describe("media key patterns", () => {
  const uuid = "0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0";

  test("accept every kind and the SVG extension", () => {
    expect(MEDIA_KEY_PATTERN.test(`clubs/${uuid}.svg`)).toBe(true);
    expect(MEDIA_PATH_PATTERN.test(`/api/media/locations/${uuid}.webp`)).toBe(true);
    expect(MEDIA_KEY_PATTERN.test(`clubs/${uuid}.gif`)).toBe(false);
    expect(MEDIA_KEY_PATTERN.test(`other/${uuid}.png`)).toBe(false);
  });

  test("scope a path to its own kind", () => {
    expect(mediaPathPatternFor("clubs").test(`/api/media/clubs/${uuid}.svg`)).toBe(true);
    expect(mediaPathPatternFor("clubs").test(`/api/media/players/${uuid}.webp`)).toBe(false);
  });
});
