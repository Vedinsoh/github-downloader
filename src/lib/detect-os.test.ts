import { describe, expect, it } from "vitest";
import { detectDeviceClassFromUserAgent, detectOsFromUserAgent } from "./detect-os";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const ANDROID_PHONE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/604.1";
const WINDOWS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

describe("detectOsFromUserAgent", () => {
  it("returns unknown for null/empty UA", () => {
    expect(detectOsFromUserAgent(null)).toBe("unknown");
    expect(detectOsFromUserAgent("")).toBe("unknown");
  });

  it("detects iOS on iPhone", () => {
    expect(detectOsFromUserAgent(IPHONE_UA)).toBe("ios");
  });

  it("detects Android on Pixel", () => {
    expect(detectOsFromUserAgent(ANDROID_PHONE_UA)).toBe("android");
  });

  it("detects Windows", () => {
    expect(detectOsFromUserAgent(WINDOWS_UA)).toBe("windows");
  });

  it("detects Mac", () => {
    expect(detectOsFromUserAgent(MAC_UA)).toBe("mac");
  });
});

describe("detectDeviceClassFromUserAgent", () => {
  it("returns desktop for null UA", () => {
    expect(detectDeviceClassFromUserAgent(null)).toBe("desktop");
  });

  it("classifies iPhone as mobile", () => {
    expect(detectDeviceClassFromUserAgent(IPHONE_UA)).toBe("mobile");
  });

  it("classifies Android phone as mobile", () => {
    expect(detectDeviceClassFromUserAgent(ANDROID_PHONE_UA)).toBe("mobile");
  });

  it("classifies iPad as desktop (treats tablets as desktop)", () => {
    expect(detectDeviceClassFromUserAgent(IPAD_UA)).toBe("desktop");
  });

  it("classifies Windows desktop as desktop", () => {
    expect(detectDeviceClassFromUserAgent(WINDOWS_UA)).toBe("desktop");
  });

  it("classifies Mac as desktop", () => {
    expect(detectDeviceClassFromUserAgent(MAC_UA)).toBe("desktop");
  });
});
