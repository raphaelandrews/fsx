import { describe, expect, test } from "bun:test";

import { avatarImage, coverImage } from "./media-image";

describe("avatarImage", () => {
  test("serves density variants of an uploaded image when transformations are on", () => {
    const image = avatarImage("/api/media/players/a.jpg", 32, true);
    expect(image.src).toBe("/cdn-cgi/image/width=64,quality=82,format=auto/api/media/players/a.jpg");
    expect(image.srcSet).toContain("width=32,quality=82,format=auto/api/media/players/a.jpg 1x");
    expect(image.srcSet).toContain("width=96,quality=82,format=auto/api/media/players/a.jpg 3x");
  });

  test("leaves the original alone when off, for external URLs, and when missing", () => {
    expect(avatarImage("/api/media/players/a.jpg", 32, false)).toEqual({ src: "/api/media/players/a.jpg" });
    expect(avatarImage("https://example.com/a.jpg", 32, true)).toEqual({ src: "https://example.com/a.jpg" });
    expect(avatarImage(null, 32, true)).toEqual({ src: undefined });
  });
});

describe("coverImage", () => {
  test("lists width variants with the sizes hint", () => {
    const image = coverImage("/api/media/posts/p.png", "100vw", [400, 800], true);
    expect(image.srcSet).toBe(
      "/cdn-cgi/image/width=400,quality=82,format=auto/api/media/posts/p.png 400w, /cdn-cgi/image/width=800,quality=82,format=auto/api/media/posts/p.png 800w",
    );
    expect(image.sizes).toBe("100vw");
    expect(coverImage("/api/media/posts/p.png", "100vw", [400], false)).toEqual({ src: "/api/media/posts/p.png" });
  });
});
