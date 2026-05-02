import { describe, expect, it } from "vitest"
import {
  classifyAsset,
  classifyRelease,
  getOtherDownloadsOrder,
  getPreferredOsOrder,
} from "./classify-asset"
import type { ReleaseAsset } from "./github/schemas"

describe("classifyAsset", () => {
  it("classifies .exe as Windows", () => {
    expect(classifyAsset("MyApp-Setup-1.2.3.exe")).toMatchObject({
      os: "windows",
      isSkippable: false,
    })
  })

  it("classifies .msi as Windows", () => {
    expect(classifyAsset("installer.msi").os).toBe("windows")
  })

  it("classifies windows in name as Windows", () => {
    expect(classifyAsset("tool_windows_amd64.zip")).toMatchObject({
      os: "windows",
      architecture: "x64",
    })
  })

  it("classifies .dmg as Mac", () => {
    expect(classifyAsset("MyApp-1.2.3.dmg").os).toBe("mac")
  })

  it("classifies darwin as Mac", () => {
    expect(classifyAsset("app.darwin-arm64.zip")).toMatchObject({
      os: "mac",
      architecture: "arm64",
    })
  })

  it("classifies macOS Apple Silicon", () => {
    expect(classifyAsset("program-mac-universal.dmg")).toMatchObject({
      os: "mac",
      architecture: "universal",
    })
  })

  it("classifies linux .deb", () => {
    expect(classifyAsset("app_1.0_amd64.deb").os).toBe("linux")
  })

  it("classifies AppImage as Linux", () => {
    expect(classifyAsset("MyApp-x86_64.AppImage")).toMatchObject({
      os: "linux",
      architecture: "x64",
    })
  })

  it("classifies linux tarball with arch", () => {
    expect(classifyAsset("redis-8.0.1-linux-x64.tar.gz")).toMatchObject({
      os: "linux",
      architecture: "x64",
    })
  })

  it("classifies .apk as Android", () => {
    expect(classifyAsset("app.apk").os).toBe("android")
  })

  it("classifies .ipa as iOS", () => {
    expect(classifyAsset("app.ipa").os).toBe("ios")
  })

  it("zip with no OS hint is unknown OS but not skippable", () => {
    expect(classifyAsset("bundle.zip")).toMatchObject({
      os: "unknown",
      isSkippable: false,
    })
  })

  it("skips checksums file", () => {
    expect(classifyAsset("checksums.txt").isSkippable).toBe(true)
  })

  it("skips .sha256 sidecar", () => {
    expect(classifyAsset("app.exe.sha256").isSkippable).toBe(true)
  })

  it("skips .asc signature", () => {
    expect(classifyAsset("app.tar.gz.asc").isSkippable).toBe(true)
  })

  it("skips .sig signature", () => {
    expect(classifyAsset("release.sig").isSkippable).toBe(true)
  })

  it("skips .aab Android bundle", () => {
    expect(classifyAsset("app-release.aab").isSkippable).toBe(true)
  })

  it("skips .asar.gz Electron internal bundle", () => {
    expect(classifyAsset("obsidian-1.12.7.asar.gz").isSkippable).toBe(true)
  })

  it("detects aarch64 as arm64", () => {
    expect(classifyAsset("tool-linux-aarch64.tar.gz").architecture).toBe("arm64")
  })

  it("detects 386 as x86", () => {
    expect(classifyAsset("app-windows-386.exe")).toMatchObject({
      os: "windows",
      architecture: "x86",
    })
  })

  it("flags CLI segment as cli", () => {
    expect(classifyAsset("MyTool.Cli.win-arm64.zip").isCli).toBe(true)
    expect(classifyAsset("mytool-cli-1.2.0.exe").isCli).toBe(true)
    expect(classifyAsset("tool_cli_linux.tar.gz").isCli).toBe(true)
  })

  it("does not flag substring 'cli' as cli", () => {
    expect(classifyAsset("cliquey.exe").isCli).toBe(false)
    expect(classifyAsset("oraclient-1.0.zip").isCli).toBe(false)
    expect(classifyAsset("metaclick.dmg").isCli).toBe(false)
  })
})

function makeAsset(name: string, id = Math.floor(Math.random() * 1e9)): ReleaseAsset {
  return {
    id,
    name,
    size: 1024,
    download_count: 0,
    browser_download_url: `https://example.test/${name}`,
  }
}

describe("classifyRelease — same-OS sibling ranking", () => {
  it("picks arm64 as primary on Mac, x64 becomes sibling", () => {
    const result = classifyRelease(
      [makeAsset("App-mac-x64.dmg", 1), makeAsset("App-mac-arm64.dmg", 2)],
      "mac"
    )
    if (result.mode !== "os-build") throw new Error("expected os-build")
    expect(result.primary?.asset.id).toBe(2)
    expect(result.sameOsSiblings.map((s) => s.asset.id)).toEqual([1])
    expect(result.others).toEqual([])
  })

  it("picks x64 as primary on Windows, arm64 becomes sibling", () => {
    const result = classifyRelease(
      [makeAsset("App-win-arm64.exe", 1), makeAsset("App-win-x64.exe", 2)],
      "windows"
    )
    if (result.mode !== "os-build") throw new Error("expected os-build")
    expect(result.primary?.asset.id).toBe(2)
    expect(result.sameOsSiblings.map((s) => s.asset.id)).toEqual([1])
  })

  it("unknown-arch same-OS items go to others, not siblings", () => {
    const result = classifyRelease(
      [
        makeAsset("App-mac-arm64.dmg", 1),
        makeAsset("App-mac.dmg", 2),
      ],
      "mac"
    )
    if (result.mode !== "os-build") throw new Error("expected os-build")
    expect(result.primary?.asset.id).toBe(1)
    expect(result.sameOsSiblings).toEqual([])
    expect(result.others.map((o) => o.asset.id)).toEqual([2])
  })

  it("known-arch siblings ranked, unknown-arch siblings flow to others", () => {
    const result = classifyRelease(
      [
        makeAsset("App-mac-arm64.dmg", 1),
        makeAsset("App-mac-universal.dmg", 2),
        makeAsset("App-mac-x64.dmg", 3),
        makeAsset("App-mac-x86.dmg", 4),
        makeAsset("App-mac-other.dmg", 5),
      ],
      "mac"
    )
    if (result.mode !== "os-build") throw new Error("expected os-build")
    expect(result.primary?.asset.id).toBe(1)
    expect(result.sameOsSiblings.map((s) => s.asset.id)).toEqual([2, 3, 4])
    expect(result.others.map((o) => o.asset.id)).toEqual([5])
  })
})

describe("classifyRelease — CLI exclusion", () => {
  it("drops CLI when GUI sibling exists at same OS+arch", () => {
    const result = classifyRelease(
      [
        makeAsset("App.win-x64.exe", 1),
        makeAsset("App.Cli.win-x64.zip", 2),
      ],
      "windows"
    )
    if (result.mode !== "os-build") throw new Error("expected os-build")
    expect(result.primary?.asset.id).toBe(1)
    expect(result.sameOsSiblings).toEqual([])
    expect(result.others).toEqual([])
  })

  it("keeps CLI when no GUI at same OS+arch", () => {
    const result = classifyRelease(
      [
        makeAsset("App.win-x64.exe", 1),
        makeAsset("App.Cli.win-arm64.zip", 2),
      ],
      "windows"
    )
    if (result.mode !== "os-build") throw new Error("expected os-build")
    expect(result.primary?.asset.id).toBe(1)
    expect(result.sameOsSiblings.map((s) => s.asset.id)).toEqual([2])
  })

  it("all-CLI release: bypass exclusion, keep all", () => {
    const result = classifyRelease(
      [
        makeAsset("tool-cli-x64.exe", 1),
        makeAsset("tool-cli-arm64.exe", 2),
      ],
      "windows"
    )
    if (result.mode !== "os-build") throw new Error("expected os-build")
    expect(result.primary?.asset.id).toBe(1)
    expect(result.sameOsSiblings.map((s) => s.asset.id)).toEqual([2])
  })
})

describe("classifyRelease — tarball exclusion", () => {
  it("drops .tar.gz when non-tarball Linux sibling at same arch exists", () => {
    const result = classifyRelease(
      [
        makeAsset("app_1.0_amd64.deb", 1),
        makeAsset("app-linux-x64.tar.gz", 2),
      ],
      "linux"
    )
    if (result.mode !== "os-build") throw new Error("expected os-build")
    expect(result.primary?.asset.id).toBe(1)
    expect(result.others).toEqual([])
  })

  it("drops macos .app.tar.gz when .dmg sibling at same arch exists", () => {
    const result = classifyRelease(
      [
        makeAsset("AppName_1.0.0_macos_aarch64.app.tar.gz", 1),
        makeAsset("AppName_1.0.0_macos_aarch64.dmg", 2),
        makeAsset("AppName_1.0.0_macos_x86_64.app.tar.gz", 3),
        makeAsset("AppName_1.0.0_macos_x86_64.dmg", 4),
      ],
      "mac"
    )
    if (result.mode !== "os-build") throw new Error("expected os-build")
    expect(result.primary?.asset.id).toBe(2)
    expect(result.sameOsSiblings.map((s) => s.asset.id)).toEqual([4])
    expect(result.others).toEqual([])
  })

  it("keeps .tar.gz when no non-tarball Linux sibling at same arch", () => {
    const result = classifyRelease(
      [
        makeAsset("app_1.0_amd64.deb", 1),
        makeAsset("app-linux-arm64.tar.gz", 2),
      ],
      "linux"
    )
    if (result.mode !== "os-build") throw new Error("expected os-build")
    expect(result.primary?.asset.id).toBe(1)
    expect(result.sameOsSiblings.map((s) => s.asset.id)).toEqual([2])
  })

  it("all-tarball release: bypass, keep all", () => {
    const result = classifyRelease(
      [
        makeAsset("app-linux-x64.tar.gz", 1),
        makeAsset("app-linux-arm64.tar.gz", 2),
      ],
      "linux"
    )
    if (result.mode !== "os-build") throw new Error("expected os-build")
    expect(result.primary?.asset.id).toBe(1)
    expect(result.sameOsSiblings.map((s) => s.asset.id)).toEqual([2])
  })

  it("does not drop .tar.gz when sibling is on different OS", () => {
    const result = classifyRelease(
      [
        makeAsset("app-windows-x64.exe", 1),
        makeAsset("app-linux-x64.tar.gz", 2),
      ],
      "linux"
    )
    if (result.mode !== "os-build") throw new Error("expected os-build")
    expect(result.primary?.asset.id).toBe(2)
    expect(result.others.map((o) => o.asset.id)).toEqual([1])
  })
})

describe("getPreferredOsOrder", () => {
  it("desktop puts Windows first", () => {
    expect(getPreferredOsOrder("desktop")[0]).toBe("windows")
  })

  it("mobile puts Android first, then iOS", () => {
    const order = getPreferredOsOrder("mobile")
    expect(order[0]).toBe("android")
    expect(order[1]).toBe("ios")
  })
})

describe("getOtherDownloadsOrder", () => {
  it("pins visitor OS first regardless of device class", () => {
    const order = getOtherDownloadsOrder("desktop", "linux")
    expect(order[0]).toBe("linux")
  })

  it("falls back to base order when visitor OS is unknown", () => {
    expect(getOtherDownloadsOrder("desktop", "unknown")).toEqual(
      getPreferredOsOrder("desktop")
    )
  })
})
