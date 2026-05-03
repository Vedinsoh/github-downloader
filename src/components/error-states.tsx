import Link from "next/link"
import { Button } from "./ui/button"

export function NotFoundState({ message }: { message: string }) {
  return (
    <div className="space-y-4 py-10 text-center">
      <p className="text-lg">{message}</p>
      <Link href="/">
        <Button variant="outline">Back to homepage</Button>
      </Link>
    </div>
  )
}

export function BusyState() {
  return (
    <div className="space-y-4 py-10 text-center">
      <p className="text-lg">We&rsquo;re temporarily busy.</p>
      <p className="text-sm text-muted-foreground">
        Please try again in a few minutes.
      </p>
    </div>
  )
}

export function NoReleasesState() {
  return (
    <div className="space-y-4 py-10 text-center">
      <p className="text-lg">No downloads available.</p>
    </div>
  )
}

export function VersionNotFoundState({
  ownerRepo,
}: {
  ownerRepo: string
}) {
  return (
    <div className="space-y-4 py-10 text-center">
      <p className="text-lg">This version isn&rsquo;t available.</p>
      <p className="text-sm text-muted-foreground">
        It may have been removed or renamed.
      </p>
      <Link href={`/${ownerRepo}`}>
        <Button variant="outline">See all versions of {ownerRepo}</Button>
      </Link>
    </div>
  )
}
