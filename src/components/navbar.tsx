"use client";

import * as React from "react";
import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FaGithub } from "react-icons/fa";
import { links } from "@/lib/constants/links";
import { NavbarRepoInput } from "@/components/navbar-repo-input";
import { Logo } from "./ui/logo";

const Title = () => (
  <div className="hidden text-xl lg:inline-block">
    github
    <span className="bg-linear-to-r from-fuchsia-700 to-red-400 bg-clip-text font-extrabold text-transparent">
      dl
    </span>
    .com
  </div>
);

// Types
export interface NavbarNavLink {
  href: string;
  label: string;
  active?: boolean;
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  logoHref?: string;
  navigationLinks?: NavbarNavLink[];
  signInText?: string;
  signInHref?: string;
  ctaText?: string;
  ctaHref?: string;
  onSignInClick?: () => void;
  onCtaClick?: () => void;
  showSearch?: boolean;
}

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ className, logo = <Logo />, logoHref = "/", showSearch = true, ...props }, ref) => {
    const containerRef = useRef<HTMLElement>(null);

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    return (
      <nav
        className={cn(
          "bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b px-4 backdrop-blur **:no-underline md:px-6",
          className,
        )}
        ref={combinedRef}
        {...props}
      >
        <div className="relative container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-6">
          {/* Left side */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Main nav */}
            <div className="flex items-center gap-6">
              <Link
                href={logoHref}
                className="text-primary hover:text-primary/90 flex items-center space-x-2 transition-colors"
              >
                <div className="text-2xl">{logo}</div>
                <Title />
              </Link>
            </div>
          </div>
          {/* Middle: repo input — in-flow on md/lg (avoids overlap), absolutely viewport-centered on xl+ to match main content width */}
          {showSearch ? (
            <div
              className={cn(
                "hidden items-center",
                "md:flex md:min-w-0 md:flex-1 md:justify-center",
                "xl:pointer-events-none xl:absolute xl:inset-x-0 xl:top-1/2 xl:mx-auto xl:w-full xl:max-w-3xl xl:flex-none xl:-translate-y-1/2 xl:px-6",
              )}
            >
              <div className="w-full max-w-2xl xl:pointer-events-auto xl:max-w-none">
                <NavbarRepoInput />
              </div>
            </div>
          ) : null}
          {/* Right side */}
          <div className="flex shrink-0 items-center gap-3">
            <Button asChild size="sm" variant="secondary">
              <a
                href={links.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm"
              >
                <FaGithub className="mr-1 size-4" />
                <span className="hidden sm:inline">Star on GitHub</span>
                <span className="sm:hidden">Star</span>
              </a>
            </Button>
          </div>
        </div>
      </nav>
    );
  },
);

Navbar.displayName = "Navbar";

export { Logo };
