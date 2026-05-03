import { links } from "@/lib/constants/links";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/api/", "/og", "/*?page=", "/*?beta=", "/*/v/"],
      },
    ],
    host: links.app.url,
  };
}
