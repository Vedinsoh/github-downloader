import { RepoLinkForm } from "./repo-link-form"
import { SiteFooter } from "@/components/site-footer"

export default function HomePage() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Get the program. Skip the GitHub maze.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Paste any repository link below.
        </p>
        <div className="mt-10">
          <RepoLinkForm />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
