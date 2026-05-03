import { Box } from "lucide-react";
import { IconType } from "react-icons";
import { FaAndroid, FaApple, FaLinux, FaWindows } from "react-icons/fa";
import type { ReleaseAsset } from "./github/schemas";

export type Os = "windows" | "mac" | "linux" | "android" | "ios" | "unknown";
export type Architecture = "arm64" | "x64" | "x86" | "universal" | "unknown";
export type DeviceClass = "desktop" | "mobile";

export type ClassifiedAsset = {
  os: Os;
  architecture: Architecture;
  isSkippable: boolean;
  isCli: boolean;
};

export type ReleaseItem = { asset: ReleaseAsset; info: ClassifiedAsset };

export type ClassifiedRelease =
  | { mode: "empty" }
  | { mode: "archive-primary"; archives: ReleaseItem[] }
  | {
      mode: "os-build";
      primary: ReleaseItem | null;
      sameOsSiblings: ReleaseItem[];
      others: ReleaseItem[];
    };

const SIBLING_CHIP_LIMIT = 3;

export const ARCHIVE_EXTENSIONS = [
  ".tar.gz",
  ".tar.xz",
  ".tar.bz2",
  ".tgz",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
];

const TARBALL_EXTENSIONS = [".tar.gz", ".tar.xz", ".tar.bz2", ".tgz"];

function isArchive(name: string): boolean {
  return ARCHIVE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function isTarball(name: string): boolean {
  const lower = name.toLowerCase();
  return TARBALL_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

const ARCH_RANK: Record<Os, Architecture[]> = {
  mac: ["arm64", "universal", "x64", "x86", "unknown"],
  windows: ["x64", "arm64", "x86", "universal", "unknown"],
  linux: ["x64", "arm64", "x86", "universal", "unknown"],
  android: ["arm64", "x64", "x86", "universal", "unknown"],
  ios: ["arm64", "universal", "x64", "x86", "unknown"],
  unknown: ["universal", "x64", "arm64", "x86", "unknown"],
};

function archRank(os: Os, arch: Architecture): number {
  const rank = ARCH_RANK[os].indexOf(arch);
  return rank === -1 ? ARCH_RANK[os].length : rank;
}

function sortByArchPopularity(os: Os) {
  return (a: ReleaseItem, b: ReleaseItem) =>
    archRank(os, a.info.architecture) - archRank(os, b.info.architecture);
}

export function classifyRelease(assets: ReleaseAsset[], visitorOs: Os): ClassifiedRelease {
  const all: ReleaseItem[] = assets
    .map((asset) => ({ asset, info: classifyAsset(asset.name) }))
    .filter((e) => !e.info.isSkippable);

  const items = applyTarballExclusion(applyCliExclusion(all));

  if (items.length === 0) {
    return { mode: "empty" };
  }

  const archivePrimary = items.every(
    (e) => e.info.os === "unknown" && isArchive(e.asset.name.toLowerCase()),
  );

  if (archivePrimary) {
    return { mode: "archive-primary", archives: items };
  }

  const sameOsAll = items
    .filter((e) => e.info.os === visitorOs)
    .sort(sortByArchPopularity(visitorOs));

  const otherOs = items.filter((e) => e.info.os !== visitorOs);

  const primary = sameOsAll[0] ?? null;
  const sameOsRest = primary ? sameOsAll.slice(1) : [];

  const archKnownSiblings = sameOsRest.filter((e) => e.info.architecture !== "unknown");
  const archUnknownSameOs = sameOsRest.filter((e) => e.info.architecture === "unknown");

  const sameOsSiblings = archKnownSiblings.slice(0, SIBLING_CHIP_LIMIT);
  const siblingOverflow = archKnownSiblings.slice(SIBLING_CHIP_LIMIT);

  const others = [...siblingOverflow, ...archUnknownSameOs, ...otherOs];

  return {
    mode: "os-build",
    primary,
    sameOsSiblings,
    others,
  };
}

function applyCliExclusion(items: ReleaseItem[]): ReleaseItem[] {
  const hasNonCli = items.some((e) => !e.info.isCli);
  if (!hasNonCli) return items;

  return items.filter((e) => {
    if (!e.info.isCli) return true;
    const hasGuiSibling = items.some(
      (s) =>
        !s.info.isCli && s.info.os === e.info.os && s.info.architecture === e.info.architecture,
    );
    return !hasGuiSibling;
  });
}

function applyTarballExclusion(items: ReleaseItem[]): ReleaseItem[] {
  const hasNonTarball = items.some((e) => !isTarball(e.asset.name));
  if (!hasNonTarball) return items;

  return items.filter((e) => {
    if (!isTarball(e.asset.name)) return true;
    const hasNonTarballSibling = items.some(
      (s) =>
        !isTarball(s.asset.name) &&
        s.info.os === e.info.os &&
        s.info.architecture === e.info.architecture,
    );
    return !hasNonTarballSibling;
  });
}

const SKIP_EXTENSIONS = [
  ".sig",
  ".asc",
  ".sha256",
  ".sha512",
  ".sha1",
  ".md5",
  ".txt",
  ".json",
  ".yml",
  ".pem",
  ".sbom",
  ".aab",
  ".asar.gz",
  ".blockmap",
];

const SKIP_NAME_PATTERNS = [/checksums?/i, /sha(?:256|512|1)sums?/i, /signatures?/i];

const CLI_PATTERN = /(?:^|[-_./])cli(?:[-_./0-9]|$)/i;

export function classifyAsset(filename: string): ClassifiedAsset {
  const name = filename.toLowerCase();

  if (SKIP_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return { os: "unknown", architecture: "unknown", isSkippable: true, isCli: false };
  }
  if (SKIP_NAME_PATTERNS.some((re) => re.test(name))) {
    return { os: "unknown", architecture: "unknown", isSkippable: true, isCli: false };
  }

  const architecture = detectArchitecture(name);
  const os = detectOs(name);
  const isCli = CLI_PATTERN.test(name);

  return { os, architecture, isSkippable: false, isCli };
}

function detectOs(name: string): Os {
  if (
    name.endsWith(".exe") ||
    name.endsWith(".msi") ||
    /(?:^|[-_./])(?:win(?:dows)?|win32|win64)(?:[-_.0-9]|$)/.test(name)
  ) {
    return "windows";
  }

  if (
    name.endsWith(".dmg") ||
    name.endsWith(".pkg") ||
    /(?:^|[-_./])(?:mac(?:os)?|darwin|osx|apple)(?:[-_.0-9]|$)/.test(name)
  ) {
    return "mac";
  }

  if (name.endsWith(".apk")) {
    return "android";
  }

  if (name.endsWith(".ipa")) {
    return "ios";
  }

  if (
    name.endsWith(".deb") ||
    name.endsWith(".rpm") ||
    name.endsWith(".appimage") ||
    name.endsWith(".snap") ||
    name.endsWith(".flatpak") ||
    /(?:^|[-_./])(?:linux|ubuntu|debian|fedora|arch|alpine)(?:[-_.0-9]|$)/.test(name)
  ) {
    return "linux";
  }

  return "unknown";
}

function detectArchitecture(name: string): Architecture {
  if (/(?:^|[-_./])(?:arm64|aarch64|apple[-_]?silicon)(?:[-_.0-9]|$)/.test(name)) return "arm64";
  if (/(?:^|[-_./])(?:universal|fat)(?:[-_.0-9]|$)/.test(name)) return "universal";
  if (/(?:^|[-_./])(?:x64|amd64|x86[-_]?64|64[-_]?bit)(?:[-_.0-9]|$)/.test(name)) return "x64";
  if (/(?:^|[-_./])(?:i?386|x86|32[-_]?bit)(?:[-_.0-9]|$)/.test(name)) return "x86";
  return "unknown";
}

export const OS_LABELS: Record<Os, string> = {
  windows: "Windows",
  mac: "Mac",
  linux: "Linux",
  android: "Android",
  ios: "iOS",
  unknown: "Other",
};

export const OS_ICONS: Record<Os, IconType> = {
  windows: FaWindows,
  mac: FaApple,
  linux: FaLinux,
  android: FaAndroid,
  ios: FaApple,
  unknown: Box,
};

export const ARCHITECTURE_LABELS: Record<Architecture, string> = {
  arm64: "ARM 64-bit",
  x64: "64-bit",
  x86: "32-bit",
  universal: "Universal",
  unknown: "",
};

export function getArchitectureLabel(os: Os, arch: Architecture): string {
  if (os === "mac") {
    if (arch === "arm64") return "Apple Silicon";
    if (arch === "x64") return "Intel";
  }
  return ARCHITECTURE_LABELS[arch];
}

const DESKTOP_OS_ORDER: Os[] = ["windows", "mac", "linux", "android", "ios", "unknown"];
const MOBILE_OS_ORDER: Os[] = ["android", "ios", "windows", "mac", "linux", "unknown"];

export function getPreferredOsOrder(deviceClass: DeviceClass): Os[] {
  return deviceClass === "mobile" ? MOBILE_OS_ORDER : DESKTOP_OS_ORDER;
}

export function getOtherDownloadsOrder(deviceClass: DeviceClass, visitorOs: Os): Os[] {
  const base = getPreferredOsOrder(deviceClass);
  if (visitorOs === "unknown") return base;
  return [visitorOs, ...base.filter((os) => os !== visitorOs)];
}

export function sortItemsByArch(items: ReleaseItem[], os: Os): ReleaseItem[] {
  return [...items].sort(sortByArchPopularity(os));
}
