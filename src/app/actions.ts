"use server"

import { redirect } from "next/navigation"
import { parseRepoInput } from "@/lib/parse-input"

export type FormState = { error?: string }

export async function submitRepoLink(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = String(formData.get("link") ?? "")
  const result = parseRepoInput(raw)
  if (!result.ok) return { error: result.error }
  const target = result.version
    ? `/${result.owner}/${result.repo}/v/${encodeURIComponent(result.version)}`
    : `/${result.owner}/${result.repo}`
  redirect(target)
}
