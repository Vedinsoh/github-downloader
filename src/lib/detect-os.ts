import { UAParser } from "ua-parser-js";
import type { DeviceClass, Os } from "./classify-asset";

export function detectOsFromUserAgent(ua: string | null | undefined): Os {
  if (!ua) return "unknown";
  const parsed = new UAParser(ua).getOS();
  const name = (parsed.name ?? "").toLowerCase();

  if (name.includes("windows")) return "windows";
  if (name.includes("mac") || name === "macos" || name === "ios") {
    return name === "ios" ? "ios" : "mac";
  }
  if (name.includes("android")) return "android";
  if (
    name.includes("linux") ||
    name.includes("ubuntu") ||
    name.includes("debian") ||
    name.includes("fedora") ||
    name.includes("arch")
  ) {
    return "linux";
  }
  return "unknown";
}

export function detectDeviceClassFromUserAgent(ua: string | null | undefined): DeviceClass {
  if (!ua) return "desktop";
  const parsed = new UAParser(ua).getDevice();
  return parsed.type === "mobile" ? "mobile" : "desktop";
}
