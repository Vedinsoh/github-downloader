import { describe, expect, it } from "vitest"
import { classifyRelease } from "./classify-asset"
import type { ReleaseAsset } from "./github/schemas"

function asset(name: string, id = 1, size = 1000): ReleaseAsset {
  return {
    id,
    name,
    size,
    download_count: 0,
    browser_download_url: `https://example.com/${name}`,
  }
}

describe("classifyRelease", () => {
  it("single archive with no OS hint is archive-primary", () => {
    const result = classifyRelease([asset("mod-v1.2.zip")], "windows")
    expect(result.mode).toBe("archive-primary")
    if (result.mode === "archive-primary") {
      expect(result.archives).toHaveLength(1)
      expect(result.archives[0].asset.name).toBe("mod-v1.2.zip")
    }
  })

  it("multiple archives preserve API order", () => {
    const result = classifyRelease(
      [
        asset("Mod-Full.zip", 1),
        asset("Mod-Lite.zip", 2),
        asset("Mod-Textures.zip", 3),
      ],
      "windows"
    )
    expect(result.mode).toBe("archive-primary")
    if (result.mode === "archive-primary") {
      expect(result.archives.map((a) => a.asset.name)).toEqual([
        "Mod-Full.zip",
        "Mod-Lite.zip",
        "Mod-Textures.zip",
      ])
    }
  })

  it("ignores skippable assets when deciding archive-primary", () => {
    const result = classifyRelease(
      [
        asset("mod.zip", 1),
        asset("mod.zip.sha256", 2),
        asset("signatures.txt", 3),
      ],
      "windows"
    )
    expect(result.mode).toBe("archive-primary")
    if (result.mode === "archive-primary") {
      expect(result.archives).toHaveLength(1)
      expect(result.archives[0].asset.name).toBe("mod.zip")
    }
  })

  it("zip with OS hint is os-build, not archive-primary", () => {
    const result = classifyRelease([asset("app-windows-x64.zip")], "windows")
    expect(result.mode).toBe("os-build")
    if (result.mode === "os-build") {
      expect(result.primary?.info.os).toBe("windows")
    }
  })

  it("tar.gz with no OS hint is archive-primary", () => {
    const result = classifyRelease([asset("app-1.0.tar.gz")], "linux")
    expect(result.mode).toBe("archive-primary")
  })

  it("mixed archive plus OS-classified asset is os-build", () => {
    const result = classifyRelease(
      [asset("mod.zip", 1), asset("installer.exe", 2)],
      "windows"
    )
    expect(result.mode).toBe("os-build")
    if (result.mode === "os-build") {
      expect(result.primary?.asset.name).toBe("installer.exe")
      expect(result.others.map((o) => o.asset.name)).toEqual(["mod.zip"])
    }
  })

  it("zero assets is empty", () => {
    expect(classifyRelease([], "windows").mode).toBe("empty")
  })

  it("only-skippable assets is empty", () => {
    const result = classifyRelease(
      [asset("checksums.txt", 1), asset("release.sig", 2)],
      "windows"
    )
    expect(result.mode).toBe("empty")
  })

  it("os-build with no matching visitor OS leaves primary null", () => {
    const result = classifyRelease([asset("app-linux-x64.tar.gz")], "windows")
    expect(result.mode).toBe("os-build")
    if (result.mode === "os-build") {
      expect(result.primary).toBeNull()
      expect(result.others).toHaveLength(1)
    }
  })
})
