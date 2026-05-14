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
      <div className="container grid grid-cols-3 h-16 items-center px-4 md:px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight justify-self-start">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline-block">StatTrader</span>
        </div>
        
        {/* Center: Navigation */}
        <nav className="flex items-center gap-6 text-sm font-medium justify-self-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-foreground/80 ${pathname === item.href ? "text-foreground" : "text-foreground/60"
                }`}
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {item.title}
              </div>
            </Link>
          ))}
        </nav>

        {/* Right: Empty space to balance the grid */}
        <div className="justify-self-end"></div>
      </div>
    </header>
  );
}
