"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import { usePathname } from "next/navigation";

const governedResearchRoutePrefixes = ["/participant", "/admin"] as const;

export function isAnalyticsExcludedPath(pathname: string) {
  return governedResearchRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function GovernedAnalytics() {
  const pathname = usePathname();
  if (isAnalyticsExcludedPath(pathname)) return null;
  return <><GoogleAnalytics gaId="G-3J05MQ5HQJ" /><Analytics /></>;
}
