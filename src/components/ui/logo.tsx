import React from "react";

export function Logo(props: React.SVGAttributes<SVGElement>) {
  return (
    <svg
      aria-label="GitHub Downloader logo"
      role="img"
      height="1em"
      viewBox="0 0 200 200"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <mask id="githubdl-logo-mask">
          <rect width="200" height="200" fill="white" />
          <circle cx="66" cy="55" r="16" fill="black" />
          <circle cx="134" cy="55" r="16" fill="black" />
          <path
            d="M66 67 C66 91 100 83 100 91"
            stroke="black"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M134 67 C134 91 100 83 100 91"
            stroke="black"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="100" cy="102" r="16" fill="black" />
          <path d="M94 114 L94 139 L76 139 L100 164 L124 139 L106 139 L106 114 Z" fill="black" />
        </mask>
      </defs>
      <circle cx="100" cy="100" r="92" fill="currentColor" mask="url(#githubdl-logo-mask)" />
    </svg>
  );
}
