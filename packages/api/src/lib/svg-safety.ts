// Uploaded SVGs are served from the site's own origin. `<img>` never runs SVG
// scripts, but opening the file URL directly would, so uploads must be static
// drawings. Media responses also carry a `sandbox` CSP (media-handler.ts); this
// check is the first layer and gives the admin a clear rejection reason.
//
// Shared by the upload procedure and the admin upload control: no server imports.

const ALLOWED_ELEMENTS = new Set(
  [
    "svg", "g", "defs", "symbol", "use", "title", "desc", "metadata", "style", "switch",
    "path", "rect", "circle", "ellipse", "line", "polyline", "polygon",
    "text", "tspan", "textPath",
    "linearGradient", "radialGradient", "stop", "pattern", "clipPath", "mask", "marker", "image",
    "filter", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix",
    "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood",
    "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge",
    "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting",
    "feSpotLight", "feTile", "feTurbulence",
  ].map((name) => name.toLowerCase()),
);

// Editor bookkeeping (Inkscape, Illustrator, RDF metadata) is inert.
const INERT_NAMESPACES = new Set(["sodipodi", "inkscape", "rdf", "cc", "dc", "i", "x", "sketch", "serif"]);

const SAFE_DATA_IMAGE = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[a-z0-9+/=\s]*$/i;
const CSS_URL = /url\s*\(\s*(['"]?)([^'")]*)\1\s*\)/gi;

type Tag = { name: string; attributes: Array<[string, string]>; closing: boolean };

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&(quot|apos|lt|gt|amp);/g, (_, name: string) =>
      ({ quot: '"', apos: "'", lt: "<", gt: ">", amp: "&" })[name]!,
    );
}

function cssProblem(css: string): string | null {
  const normalized = decodeEntities(css).replace(/\\/g, "");
  if (/@import/i.test(normalized)) return "SVG styles cannot import other files";
  if (/expression\s*\(|javascript:/i.test(normalized)) return "SVG styles cannot contain scripts";
  for (const match of normalized.matchAll(CSS_URL)) {
    const target = match[2]!.trim();
    if (!target.startsWith("#") && !SAFE_DATA_IMAGE.test(target)) {
      return "SVG styles can only reference shapes inside the file";
    }
  }
  return null;
}

// Quote-aware so a `>` inside an attribute value cannot end the tag early and
// hide the attributes after it.
function readTag(source: string, start: number): { tag: Tag; end: number } | null {
  let index = start + 1;
  const closing = source[index] === "/";
  if (closing) index++;
  const nameMatch = /^[A-Za-z_][\w:.-]*/.exec(source.slice(index));
  if (!nameMatch) return null;
  const name = nameMatch[0];
  index += name.length;

  const attributes: Array<[string, string]> = [];
  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) index++;
    const char = source[index];
    if (char === ">") return { tag: { name, attributes, closing }, end: index + 1 };
    if (char === "/" && source[index + 1] === ">") return { tag: { name, attributes, closing }, end: index + 2 };

    const attrMatch = /^[^\s=>/]+/.exec(source.slice(index));
    if (!attrMatch) return null;
    const attrName = attrMatch[0];
    index += attrName.length;
    while (/\s/.test(source[index] ?? "")) index++;

    let value = "";
    if (source[index] === "=") {
      index++;
      while (/\s/.test(source[index] ?? "")) index++;
      const quote = source[index];
      if (quote !== '"' && quote !== "'") return null;
      const close = source.indexOf(quote, index + 1);
      if (close === -1) return null;
      value = source.slice(index + 1, close);
      index = close + 1;
    }
    attributes.push([attrName, value]);
  }
  return null;
}

function elementProblem(name: string): string | null {
  const [prefix, local] = name.includes(":") ? name.split(":", 2) : [null, name];
  if (prefix && prefix.toLowerCase() !== "svg") {
    return INERT_NAMESPACES.has(prefix.toLowerCase()) ? null : `SVG element <${name}> is not allowed`;
  }
  return ALLOWED_ELEMENTS.has(local!.toLowerCase()) ? null : `SVG element <${name}> is not allowed`;
}

function attributeProblem(name: string, rawValue: string): string | null {
  const lower = name.toLowerCase();
  const value = decodeEntities(rawValue).trim();
  if (lower.startsWith("on")) return "SVG event handlers are not allowed";
  if (lower === "href" || lower.endsWith(":href") || lower === "src") {
    if (value.startsWith("#") || SAFE_DATA_IMAGE.test(value)) return null;
    return "SVG links can only point to shapes inside the file or embedded PNG/JPEG/WebP images";
  }
  if (/javascript:/i.test(value.replace(/\s/g, ""))) return "SVG attributes cannot contain scripts";
  if (lower === "style" || /url\s*\(/i.test(value)) return cssProblem(value);
  return null;
}

/** Returns why the SVG is unsafe or malformed, or null when it is a static drawing. */
export function findSvgProblem(source: string): string | null {
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) return "SVG files cannot declare a DOCTYPE or entities";

  let index = 0;
  let sawRoot = false;
  const open: string[] = [];

  while (index < source.length) {
    const next = source.indexOf("<", index);
    if (next === -1) break;
    const text = source.slice(index, next);
    if (open.at(-1)?.toLowerCase() === "style") {
      const problem = cssProblem(text);
      if (problem) return problem;
    }

    if (source.startsWith("<!--", next)) {
      const end = source.indexOf("-->", next + 4);
      if (end === -1) return "SVG has an unterminated comment";
      index = end + 3;
      continue;
    }
    if (source.startsWith("<![CDATA[", next)) {
      const end = source.indexOf("]]>", next + 9);
      if (end === -1) return "SVG has an unterminated CDATA section";
      if (open.at(-1)?.toLowerCase() !== "style") return "SVG CDATA is only allowed inside <style>";
      const problem = cssProblem(source.slice(next + 9, end));
      if (problem) return problem;
      index = end + 3;
      continue;
    }
    if (source.startsWith("<?", next)) {
      const end = source.indexOf("?>", next + 2);
      if (end === -1) return "SVG has an unterminated processing instruction";
      // `<?xml-stylesheet?>` would load an external stylesheet.
      if (!/^<\?xml\s/i.test(source.slice(next, end)) || sawRoot) {
        return "SVG processing instructions are not allowed";
      }
      index = end + 2;
      continue;
    }

    const parsed = readTag(source, next);
    if (!parsed) return "SVG markup could not be read";
    const { tag, end } = parsed;
    index = end;

    if (tag.closing) {
      if (open.pop() !== tag.name) return "SVG markup is not well-formed";
      continue;
    }
    if (!sawRoot) {
      if (tag.name.toLowerCase() !== "svg") return "The file is not an SVG image";
      sawRoot = true;
    } else if (open.length === 0) {
      return "SVG has content after the root element";
    }

    const problem =
      elementProblem(tag.name) ??
      tag.attributes.map(([name, value]) => attributeProblem(name, value)).find(Boolean) ??
      null;
    if (problem) return problem;

    const selfClosing = source[end - 2] === "/";
    if (!selfClosing) open.push(tag.name);
  }

  if (!sawRoot) return "The file is not an SVG image";
  if (open.length > 0) return "SVG markup is not well-formed";
  return null;
}

const LENGTH = /^\s*([0-9]*\.?[0-9]+)\s*(px)?\s*$/i;

// An SVG without a viewBox does not scale inside a 16–20 px <img>; it is
// cropped to its top-left corner. Derive one from plain width/height.
export function ensureSvgViewBox(source: string): string {
  const root = /<svg\b[^>]*>/i.exec(source);
  if (!root || /\sviewBox\s*=/i.test(root[0])) return source;
  const width = /\swidth\s*=\s*["']([^"']*)["']/i.exec(root[0])?.[1];
  const height = /\sheight\s*=\s*["']([^"']*)["']/i.exec(root[0])?.[1];
  const w = width ? LENGTH.exec(width)?.[1] : undefined;
  const h = height ? LENGTH.exec(height)?.[1] : undefined;
  if (!w || !h) return source;
  const tag = root[0].replace(/^<svg\b/i, `<svg viewBox="0 0 ${w} ${h}"`);
  return source.slice(0, root.index) + tag + source.slice(root.index + root[0].length);
}
