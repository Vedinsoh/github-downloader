"use client"

import { useActionState, useCallback, useRef, useState } from "react"
import { parseRepoInput } from "@/lib/parse-input"
import { submitRepoLink, type FormState } from "./actions"

const initial: FormState = {}

export type UseRepoLinkFormReturn = {
  formAction: (payload: FormData) => void
  pending: boolean
  error: string | undefined
  isInvalid: boolean
  hasSubmitted: boolean
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  onSubmit: () => void
  formRef: React.RefObject<HTMLFormElement | null>
}

export function useRepoLinkForm(): UseRepoLinkFormReturn {
  const [state, formAction, pending] = useActionState(submitRepoLink, initial)
  const [value, setValue] = useState("")
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [liveError, setLiveError] = useState<string | undefined>(undefined)
  const [suppressed, setSuppressed] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const validate = useCallback((raw: string) => {
    if (!raw.trim()) return undefined
    const result = parseRepoInput(raw)
    return result.ok ? undefined : result.error
  }, [])

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
      setValue(next)
      if (!next.trim()) {
        setLiveError(undefined)
        setSuppressed(true)
        return
      }
      setSuppressed(false)
      if (hasSubmitted) {
        setLiveError(validate(next))
      }
    },
    [hasSubmitted, validate]
  )

  const onBlur = useCallback(() => {
    setSuppressed(true)
  }, [])

  const onSubmit = useCallback(() => {
    setHasSubmitted(true)
    setSuppressed(false)
    setLiveError(validate(value))
  }, [validate, value])

  const rawError = liveError ?? state.error
  const error = suppressed ? undefined : rawError
  const isInvalid = Boolean(error)

  return {
    formAction,
    pending,
    error,
    isInvalid,
    hasSubmitted,
    value,
    onChange,
    onBlur,
    onSubmit,
    formRef,
  }
}
