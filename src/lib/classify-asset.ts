export type Os = "windows" | "mac" | "linux" | "android" | "ios" | "unknown"
export type Architecture = "arm64" | "x64" | "x86" | "universal" | "unknown"

export type ClassifiedAsset = {
  os: Os
  architecture: Architecture
  isSkippable: boolean
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
  ".pem",
  ".sbom",
]

const SKIP_NAME_PATTERNS = [
  /checksums?/i,
  /sha(?:256|512|1)sums?/i,
  /signatures?/i,
]

export function classifyAsset(filename: string): ClassifiedAsset {
  const name = filename.toLowerCase()

  if (SKIP_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return { os: "unknown", architecture: "unknown", isSkippable: true }
  }
  if (SKIP_NAME_PATTERNS.some((re) => re.test(name))) {
    return { os: "unknown", architecture: "unknown", isSkippable: true }
  }

  const architecture = detectArchitecture(name)
  const os = detectOs(name)

  return { os, architecture, isSkippable: false }
}

function detectOs(name: string): Os {
  if (
    name.endsWith(".exe") ||
    name.endsWith(".msi") ||
    /(?:^|[-_./])(?:win(?:dows)?|win32|win64)(?:[-_.0-9]|$)/.test(name)
  ) {
    return "windows"
  }

  if (
    name.endsWith(".dmg") ||
    name.endsWith(".pkg") ||
    /(?:^|[-_./])(?:mac(?:os)?|darwin|osx|apple)(?:[-_.0-9]|$)/.test(name)
  ) {
    return "mac"
  }

  if (name.endsWith(".apk") || name.endsWith(".aab")) {
    return "android"
  }

  if (name.endsWith(".ipa")) {
    return "ios"
  }

  if (
    name.endsWith(".deb") ||
    name.endsWith(".rpm") ||
    name.endsWith(".appimage") ||
    name.endsWith(".snap") ||
    name.endsWith(".flatpak") ||
    /(?:^|[-_./])(?:linux|ubuntu|debian|fedora|arch|alpine)(?:[-_.0-9]|$)/.test(
      name
    )
  ) {
    return "linux"
  }

  return "unknown"
}

function detectArchitecture(name: string): Architecture {
  if (/(?:^|[-_./])(?:arm64|aarch64|apple[-_]?silicon)(?:[-_.0-9]|$)/.test(name))
    return "arm64"
  if (/(?:^|[-_./])(?:universal|fat)(?:[-_.0-9]|$)/.test(name))
    return "universal"
  if (/(?:^|[-_./])(?:x64|amd64|x86[-_]?64|64[-_]?bit)(?:[-_.0-9]|$)/.test(name))
    return "x64"
  if (/(?:^|[-_./])(?:i?386|x86|32[-_]?bit)(?:[-_.0-9]|$)/.test(name))
    return "x86"
  return "unknown"
}

export const OS_LABELS: Record<Os, string> = {
  windows: "Windows",
  mac: "Mac",
  linux: "Linux",
  android: "Android",
  ios: "iOS",
  unknown: "Other",
}

export const ARCHITECTURE_LABELS: Record<Architecture, string> = {
  arm64: "ARM 64-bit",
  x64: "Intel / 64-bit",
  x86: "32-bit",
  universal: "Universal",
  unknown: "",
}
