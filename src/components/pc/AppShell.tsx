import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarCheck,
  CircleUserRound,
  Compass,
  Home,
  ListChecks,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const MAIN_NAV = [
  { to: "/", label: "Inicio", icon: Home, exact: true },
  { to: "/personas", label: "Personas", icon: Users },
  { to: "/uno-a-uno", label: "1:1", icon: CalendarCheck },
  { to: "/seguimientos", label: "Seguimientos", icon: ListChecks },
  { to: "/desarrollo", label: "Desarrollo", icon: Compass },
  { to: "/people-insights", label: "People Insights", icon: BarChart3 },
] as const;

const FOOTER_NAV = [
  { to: "/configuracion", label: "Configuración", icon: Settings },
  { to: "/perfil", label: "Perfil", icon: CircleUserRound },
] as const;

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className={cn("size-4", active && "text-primary")} />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 md:flex">
        <div className="flex items-center gap-2 px-2 pb-6">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">People Hub</p>
            <p className="text-[11px] text-muted-foreground">People &amp; Culture</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {MAIN_NAV.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(item.to, "exact" in item)} />
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-sidebar-border pt-3">
          {FOOTER_NAV.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(item.to)} />
          ))}
        </div>
      </aside>

      <div className="md:pl-60">
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-sidebar px-3 py-2 md:hidden">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium",
                isActive(item.to, "exact" in item)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-[1200px] px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
