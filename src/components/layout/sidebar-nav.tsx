"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, LayoutDashboard, Package, Package2, ScrollText } from "lucide-react";

import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/ingredients", label: "Ingredientes", icon: Package2 },
  { href: "/recipes", label: "Receitas", icon: ScrollText },
  { href: "/pricing", label: "Precificação", icon: Calculator },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors lg:gap-3 lg:px-4 lg:py-3",
              isActive
                ? "bg-foreground text-background"
                : "text-slate-600 hover:bg-[color:var(--card-muted)] hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
