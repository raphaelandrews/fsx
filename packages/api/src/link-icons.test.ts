import { describe, expect, test } from "bun:test";

import { DEFAULT_LINK_ICON, iconForLinkLabel, isKnownLinkIcon, LINK_ICON_PRESETS, resolveLinkIcon } from "./link-icons";

describe("link icon allowlist", () => {
  test("accepts presets and generated event icons", () => {
    for (const preset of LINK_ICON_PRESETS) expect(isKnownLinkIcon(preset.svg)).toBe(true);
    for (const label of ["Regulamento", "Formulário", "Resultados", "Calendário", "Outro"]) {
      expect(isKnownLinkIcon(iconForLinkLabel(label))).toBe(true);
    }
  });

  test("never renders unknown markup", () => {
    const payload = '<svg onload="alert(1)"></svg>';
    expect(isKnownLinkIcon(payload)).toBe(false);
    expect(resolveLinkIcon(payload)).toBe(DEFAULT_LINK_ICON);
    expect(resolveLinkIcon('<img src=x onerror="alert(1)">')).toBe(DEFAULT_LINK_ICON);
  });
});
