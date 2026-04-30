import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { RepoLinkForm } from "./repo-link-form"
import { SiteFooter } from "@/components/site-footer"

export default function HomePage() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          The{" "}
          <span className="font-extrabold bg-linear-to-r from-fuchsia-700 to-red-400 bg-clip-text text-transparent">
          easiest
          </span>{" "}
          way to download GitHub files.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Paste any GitHub project link below.
        </p>
        <div className="mt-10">
          <RepoLinkForm />
        </div>
        <Card className="mt-16 md:mx-16 ring-2 ring-fuchsia-400/50">
          <CardHeader className='text-lg font-extrabold'>
            Pro tip!
          </CardHeader>
          <CardContent className='text-muted-foreground'>
            <p>
              Simply add &quot;dl&quot; right after &quot;github&quot; in any GitHub link. For example:{" "}
              <span className='text-white'>
                https://github
                <span className="font-extrabold bg-linear-to-r from-fuchsia-700 to-red-400 bg-clip-text text-transparent">
                dl
                </span>
                .com/user/repo
              </span>
            </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  )
}
