import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------- Page header ------------------------------ */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* --------------------------------- Surface -------------------------------- */

export function Panel({
  title,
  description,
  actions,
  className,
  children,
}: {
  title?: string | undefined;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {title ? (
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* -------------------------------- KPI card -------------------------------- */

export function KpiCard({
  label,
  value,
  hint,
  trend,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: number;
  tone?: "neutral" | "positive" | "warning" | "critical";
}) {
  const toneClass = {
    neutral: "text-foreground",
    positive: "text-success",
    warning: "text-warning",
    critical: "text-danger",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={cn("text-2xl font-semibold tabular-nums", toneClass)}>{value}</span>
        {trend !== undefined ? <Trend value={trend} /> : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Trend({ value, suffix = "" }: { value: number; suffix?: string }) {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const tone = value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", tone)}>
      <Icon className="size-3.5" />
      {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

/* ------------------------------ Status badge ------------------------------ */

type BadgeTone = "neutral" | "positive" | "warning" | "critical" | "info";

export function StatusBadge({
  children,
  tone = "neutral",
  dot = true,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
}) {
  const styles: Record<BadgeTone, string> = {
    neutral: "bg-muted text-muted-foreground",
    positive: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    critical: "bg-danger-soft text-danger",
    info: "bg-primary-soft text-primary",
  };
  const dots: Record<BadgeTone, string> = {
    neutral: "bg-muted-foreground",
    positive: "bg-success",
    warning: "bg-warning",
    critical: "bg-danger",
    info: "bg-primary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        styles[tone],
      )}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", dots[tone])} /> : null}
      {children}
    </span>
  );
}

export function employeeStatusTone(status: string): BadgeTone {
  if (status === "seguimiento_prioritario") return "critical";
  if (status === "seguimiento_recomendado") return "warning";
  return "positive";
}

export function indicatorStatusTone(status: string): BadgeTone {
  if (status === "cumplido") return "positive";
  if (status === "en_riesgo") return "warning";
  return "critical";
}

/* ------------------------------ Progress bar ------------------------------ */

export function ProgressBar({
  value,
  tone = "info",
  className,
}: {
  value: number;
  tone?: BadgeTone;
  className?: string;
}) {
  const bar: Record<BadgeTone, string> = {
    neutral: "bg-muted-foreground",
    positive: "bg-success",
    warning: "bg-warning",
    critical: "bg-danger",
    info: "bg-primary",
  };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", bar[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* --------------------------------- Avatar --------------------------------- */

export function InitialsAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const sizes = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-base",
  }[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary",
        sizes,
      )}
    >
      {letters}
    </span>
  );
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-12 text-center">
      {Icon ? (
        <span className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
      ) : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* -------------------------------- Alert card ------------------------------ */

export function AlertCard({
  title,
  description,
  tone = "warning",
  action,
}: {
  title: string;
  description?: string;
  tone?: BadgeTone;
  action?: ReactNode;
}) {
  const border: Record<BadgeTone, string> = {
    neutral: "border-l-muted-foreground",
    positive: "border-l-success",
    warning: "border-l-warning",
    critical: "border-l-danger",
    info: "border-l-primary",
  };
  return (
    <div className={cn("rounded-lg border border-l-2 border-border bg-card p-4", border[tone])}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
    </div>
  );
}

/* --------------------------------- Timeline ------------------------------- */

export function Timeline({ children }: { children: ReactNode }) {
  return <ol className="relative space-y-6 border-l border-border pl-6">{children}</ol>;
}

export function TimelineItem({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <li className="relative">
      <span className="absolute -left-[1.9rem] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
      <div className="flex flex-wrap items-baseline gap-x-3">
        <p className="text-sm font-medium">{title}</p>
        {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
      </div>
      {children ? <div className="mt-2">{children}</div> : null}
    </li>
  );
}

/* ------------------------------ Placeholder ------------------------------- */

export function ModulePlaceholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-8">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-20 text-center">
        <p className="text-sm font-medium">Este módulo se construirá en la siguiente fase.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          La arquitectura y la base de datos ya están preparadas para incorporarlo sin rehacer nada.
        </p>
      </div>
    </div>
  );
}
