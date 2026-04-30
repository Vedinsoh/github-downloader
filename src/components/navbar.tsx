
"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { FaGithub } from 'react-icons/fa'
import { links } from '@/lib/constants/links'

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

const Title = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <div className="hidden text-xl sm:inline-block">
    github
    <span className="font-extrabold bg-linear-to-r from-fuchsia-700 to-red-400 bg-clip-text text-transparent">
    dl
    </span>
    .com
  </div>
)

// Hamburger icon component
const HamburgerIcon = ({ className, ...props }: React.SVGAttributes<SVGElement>) => (
  <svg
    aria-label="Menu"
    className={cn("pointer-events-none", className)}
    fill="none"
    height={16}
    role="img"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      className="origin-center -translate-y-1.75 transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-315"
      d="M4 12L20 12"
    />
    <path
      className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
      d="M4 12H20"
    />
    <path
      className="origin-center translate-y-1.75 transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-135"
      d="M4 12H20"
    />
  </svg>
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

// Default navigation links
const defaultNavigationLinks: NavbarNavLink[] = [
  { href: "/", label: "Home" },
]

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      className,
      logo = <Logo />,
      logoHref = "/",
      navigationLinks = defaultNavigationLinks,
      ...props
    },
    ref,
  ) => {
    const [isMobile, setIsMobile] = useState(false)
    const containerRef = useRef<HTMLElement>(null)

    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth
          setIsMobile(width < 768) // 768px is md breakpoint
        }
      }

      checkWidth()

      const resizeObserver = new ResizeObserver(checkWidth)
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current)
      }

      return () => {
        resizeObserver.disconnect()
      }
    }, [])

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
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                    size="icon"
                    variant="ghost"
                  >
                    <HamburgerIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-48 p-2">
                  <NavigationMenu className="max-w-none">
                    <NavigationMenuList className="flex-col items-start gap-1">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem className="w-full" key={index}>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer no-underline",
                              link.active
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground/80",
                            )}
                            onClick={e => e.preventDefault()}
                          >
                            {link.label}
                          </button>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </PopoverContent>
              </Popover>
            )}
            {/* Main nav */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors cursor-pointer"
                onClick={e => e.preventDefault()}
              >
                <div className="text-2xl">{logo}</div>
                <Title />
              </button>
              {/* Navigation menu */}
              {!isMobile && (
                <NavigationMenu className="flex">
                  <NavigationMenuList className="gap-1">
                    {navigationLinks.map((link, index) => (
                      <NavigationMenuItem key={index}>
                        <button
                          type="button"
                          className={cn(
                            "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer no-underline",
                            link.active
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground/80 hover:text-foreground",
                          )}
                          onClick={e => e.preventDefault()}
                        >
                          {link.label}
                        </button>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              )}
            </div>
          </div>
          {/* Right side */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
            >
            <a
              href={links.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-muted-foreground"
            >
              <FaGithub className="size-4 mr-1" />
              Star on GitHub
          </a>
            </Button>
          </div>
        </div>
      </nav>
    )
  },
)

Navbar.displayName = "Navbar"

export { Logo, HamburgerIcon }
