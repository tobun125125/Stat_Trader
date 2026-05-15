"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Settings, ClipboardList } from "lucide-react";

export function TopNav() {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      title: "History",
      href: "/history",
      icon: ClipboardList,
    },
    {
      title: "Manage",
      href: "/manage",
      icon: Settings,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <span className="hidden sm:inline-block">StatTrader</span>
        </div>
        
        {/* Center: Navigation */}
        <nav className="flex items-center gap-1 sm:gap-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-foreground/80 px-2.5 py-1.5 sm:px-0 sm:py-0 rounded-md ${
                (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))
                  ? "text-foreground bg-muted/50 sm:bg-transparent" : "text-foreground/60"
                }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.title}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Right: Empty space to balance */}
        <div className="w-[28px] sm:w-[120px]"></div>
      </div>
    </header>
  );
}
