import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type AppLogoProps = {
  href?: string;
  variant?: "full" | "mark";
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const dimensions = {
  full: {
    sm: { width: 160, height: 36 },
    md: { width: 206, height: 46 },
    lg: { width: 248, height: 56 },
  },
  mark: {
    sm: { width: 36, height: 36 },
    md: { width: 44, height: 44 },
    lg: { width: 52, height: 52 },
  },
} as const;

export function AppLogo({
  href,
  variant = "full",
  size = "md",
  className,
  priority = false,
}: AppLogoProps) {
  const { width, height } = dimensions[variant][size];
  const image = (
    <Image
      src={variant === "mark" ? "/margem-app-mark.svg" : "/margem-app-logo.svg"}
      alt="MARGEM APP"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto max-w-full", className)}
    />
  );

  if (!href) {
    return image;
  }

  return (
    <Link href={href} className="inline-flex max-w-full items-center">
      {image}
    </Link>
  );
}
