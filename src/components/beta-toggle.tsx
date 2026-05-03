"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export function BetaToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const checked = searchParams.get("beta") === "show";

  function onCheckedChange(next: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("beta", "show");
    } else {
      params.delete("beta");
    }
    // Drop ?page when toggling betas — older paginated state is no longer correct.
    params.delete("page");
    const qs = params.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="beta-toggle"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={isPending}
      />
      <Label htmlFor="beta-toggle">Show beta versions</Label>
    </div>
  );
}
