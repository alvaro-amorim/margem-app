"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  LayoutDashboard,
  Package,
  Package2,
  ScrollText,
  ShieldUser,
} from "lucide-react";

import { cn } from "@/lib/utils";

const baseNavigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/ingredients", label: "Ingredientes", icon: Package2 },
  { href: "/recipes", label: "Receitas", icon: ScrollText },
  { href: "/pricing", label: "Precificacao", icon: Calculator },
];

type SidebarNavProps = {
  showAdmin?: boolean;
};

export function SidebarNav({ showAdmin = false }: SidebarNavProps) {
  const pathname = usePathname();
  const navigationItems = showAdmin
    ? [...baseNavigationItems, { href: "/admin", label: "Admin", icon: ShieldUser }]
    : baseNavigationItems;

  return (
    <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:flex lg:flex-col">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-center text-xs font-medium transition-colors sm:text-sm lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-left",
              isActive
                ? "bg-foreground text-background"
                : "text-slate-600 hover:bg-[color:var(--card-muted)] hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
