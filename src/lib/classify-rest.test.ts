import { describe, expect, it } from "vitest";
import { classifyRest } from "./classify-rest";

describe("classifyRest", () => {
  it("empty rest returns no version", () => {
    expect(classifyRest([])).toEqual({});
  });

  it("bare /releases returns no version", () => {
    expect(classifyRest(["releases"])).toEqual({});
  });

  it("/releases/tag/{x} returns version", () => {
    expect(classifyRest(["releases", "tag", "v1.2.3"])).toEqual({
      version: "v1.2.3",
    });
  });

  it("/releases/tag/{x} ignores trailing junk", () => {
    expect(classifyRest(["releases", "tag", "v1.2.3", "extra"])).toEqual({
      version: "v1.2.3",
    });
  });

  it("/releases/download/{x}/{file} returns version", () => {
    expect(classifyRest(["releases", "download", "v1.2.3", "foo.zip"])).toEqual({
      version: "v1.2.3",
    });
  });

  it("/releases/latest is not a version", () => {
    expect(classifyRest(["releases", "latest"])).toEqual({});
  });

  it("/v/{x} returns version", () => {
    expect(classifyRest(["v", "v1.2.3"])).toEqual({ version: "v1.2.3" });
  });

  it("/v/{x}/extra returns version", () => {
    expect(classifyRest(["v", "v1.2.3", "extra"])).toEqual({
      version: "v1.2.3",
    });
  });

  it("bare /v returns no version", () => {
    expect(classifyRest(["v"])).toEqual({});
  });

  it("matches keywords case-insensitively", () => {
    expect(classifyRest(["Releases", "Tag", "v1"])).toEqual({ version: "v1" });
    expect(classifyRest(["RELEASES", "DOWNLOAD", "v1", "x.zip"])).toEqual({
      version: "v1",
    });
    expect(classifyRest(["V", "v1"])).toEqual({ version: "v1" });
  });

  it("preserves version casing", () => {
    expect(classifyRest(["releases", "tag", "V1.0.0"])).toEqual({
      version: "V1.0.0",
    });
  });

  it("malformed version (control char) returns no version", () => {
    expect(classifyRest(["releases", "tag", "bad\x00tag"])).toEqual({});
  });

  it("empty version segment returns no version", () => {
    expect(classifyRest(["releases", "tag", ""])).toEqual({});
  });

  it("/tree/{ref} is not a version", () => {
    expect(classifyRest(["tree", "main"])).toEqual({});
  });

  it("/issues is not a version", () => {
    expect(classifyRest(["issues"])).toEqual({});
  });

  it("/blob/{ref}/path is not a version", () => {
    expect(classifyRest(["blob", "main", "README.md"])).toEqual({});
  });
});
