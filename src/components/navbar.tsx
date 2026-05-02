
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FaGithub } from 'react-icons/fa'
import { links } from '@/lib/constants/links'
import { NavbarRepoInput } from '@/components/navbar-repo-input'

// Simple logo component for the navbar
const Logo = (props: React.SVGAttributes<SVGElement>) => {
  return (
    <svg
      aria-label="Logo"
      role="img"
      fill="none"
      height="1em"
      viewBox="0 0 324 323"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect fill="currentColor" height="323" rx="161.5" width="323" x="0.5" />
      <circle cx="162" cy="161.5" fill="white" r="60" className="dark:fill-black" />
    </svg>
  )
}

const Title = () => (
  <div className="hidden text-xl lg:inline-block">
    github
    <span className="font-extrabold bg-linear-to-r from-fuchsia-700 to-red-400 bg-clip-text text-transparent">
    dl
    </span>
    .com
  </div>
)

// Types
export interface NavbarNavLink {
  href: string
  label: string
  active?: boolean
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode
  logoHref?: string
  navigationLinks?: NavbarNavLink[]
  signInText?: string
  signInHref?: string
  ctaText?: string
  ctaHref?: string
  onSignInClick?: () => void
  onCtaClick?: () => void
}


export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      className,
      logo = <Logo />,
      logoHref = "/",
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLElement>(null)
    const pathname = usePathname()
    const showRepoInput = pathname !== "/"

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLElement | null) => {
        containerRef.current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref],
    )

    return (
      <nav
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4 md:px-6 **:no-underline",
          className,
        )}
        ref={combinedRef}
        {...props}
      >
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center gap-6">
          {/* Left side */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Main nav */}
            <div className="flex items-center gap-6">
              <Link
                href={logoHref}
                className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors"
              >
                <div className="text-2xl">{logo}</div>
                <Title />
              </Link>
            </div>
          </div>
          {/* Middle: repo input (hidden on /) */}
          <div className="flex flex-1 justify-center">
            {showRepoInput ? <NavbarRepoInput /> : null}
          </div>
          {/* Right side */}
          <div className="flex shrink-0 items-center gap-3">
            <Button asChild size="sm" variant="secondary">
              <a
                href={links.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm"
              >
                <FaGithub className="size-4 mr-1" />
                <span className="hidden sm:inline">Star on GitHub</span>
                <span className="sm:hidden">Star</span>
              </a>
            </Button>
          </div>
        </div>
      </nav>
    )
  },
)

Navbar.displayName = "Navbar"

export { Logo }
