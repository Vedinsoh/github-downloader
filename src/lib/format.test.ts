import { describe, expect, it } from "vitest";
import { formatBytes, middleTruncate } from "./format";

describe("formatBytes", () => {
  it("bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
  });
  it("kilobytes", () => {
    expect(formatBytes(2048)).toBe("2.0 KB");
  });
  it("megabytes", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
  it("gigabytes", () => {
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe("2.00 GB");
  });
});

describe("middleTruncate", () => {
  it("short string passes through as suffix", () => {
    expect(middleTruncate("short.zip")).toEqual({ prefix: "", suffix: "short.zip" });
  });

  it("string equal to suffix length passes through", () => {
    const s = "a".repeat(16);
    expect(middleTruncate(s)).toEqual({ prefix: "", suffix: s });
  });

  it("long string splits at last 16 chars", () => {
    const result = middleTruncate("AppName.linux-musl-x64.zip");
    expect(result.suffix).toBe("nux-musl-x64.zip");
    expect(result.suffix.length).toBe(16);
    expect(result.prefix + result.suffix).toBe("AppName.linux-musl-x64.zip");
  });

  it("preserves arm64.AppImage suffix", () => {
    const result = middleTruncate("Obsidian-1.12.7-arm64.AppImage");
    expect(result.suffix).toBe("7-arm64.AppImage");
    expect(result.suffix.length).toBe(16);
    expect(result.prefix + result.suffix).toBe("Obsidian-1.12.7-arm64.AppImage");
  });

  it("custom suffix length", () => {
    const result = middleTruncate("abcdefghij", 4);
    expect(result).toEqual({ prefix: "abcdef", suffix: "ghij" });
  });
});
