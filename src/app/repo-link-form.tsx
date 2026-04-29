"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { submitRepoLink, type FormState } from "./actions"

const initial: FormState = {}

export function RepoLinkForm() {
  const [state, formAction, pending] = useActionState(submitRepoLink, initial)

  return (
    <form action={formAction} className="w-full space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="link"
          type="text"
          autoComplete="off"
          autoFocus
          required
          placeholder="https://github.com/user/repo"
          className="h-12 flex-1 text-base"
          aria-label="GitHub repository link"
          aria-invalid={state.error ? true : undefined}
        />
        <Button
          type="submit"
          disabled={pending}
          className="h-12 bg-blue-600 px-6 text-base text-white hover:bg-blue-700"
        >
          {pending ? "Looking…" : "Find downloads"}
        </Button>
      </div>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
    </form>
  )
}
