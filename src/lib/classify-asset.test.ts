import { describe, expect, it } from "vitest"
import { classifyAsset } from "./classify-asset"

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

  it("detects aarch64 as arm64", () => {
    expect(classifyAsset("tool-linux-aarch64.tar.gz").architecture).toBe("arm64")
  })

  it("detects 386 as x86", () => {
    expect(classifyAsset("app-windows-386.exe")).toMatchObject({
      os: "windows",
      architecture: "x86",
    })
  })
})
