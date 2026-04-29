import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/api/", "/og", "/*?page=", "/*/v/"],
      },
    ],
    host: "https://githubdl.com",
  }
}
