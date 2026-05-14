"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Settings } from "lucide-react";

export function TopNav() {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Manage",
      href: "/manage",
      icon: Settings,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight mr-8">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span>StatTrader</span>
        </div>
        
        <nav className="flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-foreground/80 ${
                pathname === item.href ? "text-foreground" : "text-foreground/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {item.title}
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
