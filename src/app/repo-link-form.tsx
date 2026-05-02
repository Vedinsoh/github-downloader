"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRepoLinkForm } from "./use-repo-link-form"

export function RepoLinkForm() {
  const {
    formAction,
    pending,
    error,
    isInvalid,
    value,
    onChange,
    onBlur,
    onSubmit,
    formRef,
  } = useRepoLinkForm()

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      className="relative w-full"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="link"
          type="text"
          autoComplete="off"
          autoFocus
          placeholder="https://github.com/user/repo"
          className="h-12 flex-1 text-base"
          aria-label="GitHub repository link"
          aria-invalid={isInvalid ? true : undefined}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
        <Button
          type="submit"
          disabled={pending}
          className="h-12 bg-blue-600 px-6 text-base text-white hover:bg-blue-700"
        >
          {pending ? "Looking…" : "Find downloads"}
        </Button>
      </div>
      <p
        role="alert"
        aria-live="polite"
        className="absolute top-full left-0 mt-2 text-sm text-red-600 dark:text-red-400"
      >
        {error ?? ""}
      </p>
    </form>
  )
}
