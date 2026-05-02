"use client"

import { useParams } from "next/navigation"
import { Loader2, Search } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useRepoLinkForm } from "@/app/use-repo-link-form"

export function NavbarRepoInput() {
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

  const params = useParams<{ owner?: string; repo?: string }>()
  const currentRepo =
    params?.owner && params?.repo ? `${params.owner}/${params.repo}` : null
  const placeholder = `https://github.com/${currentRepo ?? "user/repo"}`

  const hasValue = value.length > 0

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      className="hidden w-full flex-1 md:flex md:max-w-2xl md:min-w-[16rem]"
    >
      <Tooltip open={Boolean(error)}>
        <TooltipTrigger asChild>
          <div className="group relative w-full">
            <input
              name="link"
              type="text"
              autoComplete="off"
              placeholder={placeholder}
              aria-label="Go to a GitHub repository"
              aria-invalid={isInvalid ? true : undefined}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              data-has-value={hasValue || undefined}
              data-invalid={isInvalid || undefined}
              className={cn(
                "h-9 w-full rounded-lg border px-3 pr-9 text-sm outline-none transition-all duration-150",
                "border-border/40 bg-transparent placeholder:text-muted-foreground/50",
                "hover:border-border hover:bg-background hover:placeholder:text-muted-foreground",
                "focus:border-border focus:bg-background focus:placeholder:text-muted-foreground",
                "data-has-value:border-border data-has-value:bg-background data-has-value:placeholder:text-muted-foreground",
                "data-invalid:border-destructive data-invalid:bg-background"
              )}
            />
            <button
              type="submit"
              tabIndex={-1}
              disabled={pending}
              aria-label="Search"
              className={cn(
                "absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground/50 transition-opacity duration-150",
                "group-hover:text-muted-foreground group-focus-within:text-muted-foreground",
                hasValue && "text-muted-foreground",
                isInvalid && "text-destructive"
              )}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </button>
          </div>
        </TooltipTrigger>
        {error ? (
          <TooltipContent side="bottom" className="bg-destructive text-destructive-foreground">
            {error}
          </TooltipContent>
        ) : null}
      </Tooltip>
    </form>
  )
}
