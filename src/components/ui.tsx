import React, { useEffect, useRef, useState } from "react";
import { X, CheckCircle2, AlertTriangle, Info, XCircle, Inbox } from "lucide-react";
import { useStore } from "../lib/store";
import { STATUS_META } from "../lib/types";
import type { TicketStatus } from "../lib/types";

export const cn = (...cls: (string | false | null | undefined)[]) =>
  cls.filter(Boolean).join(" ");

/* ---------- Button ---------- */

type BtnVariant = "primary" | "outline" | "ghost" | "danger" | "soft" | "dark";

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: BtnVariant;
    size?: "xs" | "sm" | "md";
    loading?: boolean;
  }
> = ({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 select-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-prim active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";
  const sizes = {
    xs: "text-xs px-2.5 h-7",
    sm: "text-[13px] px-3 h-8.5",
    md: "text-sm px-4 h-10",
  };
  const variants: Record<BtnVariant, string> = {
    primary: "bg-prim text-white hover:bg-prim2 shadow-sm shadow-prim/25",
    outline: "border border-line bg-card text-ink hover:border-prim/50 hover:text-prim",
    ghost: "text-mute hover:text-ink hover:bg-card2",
    danger: "bg-rose-600 text-white hover:bg-rose-500 shadow-sm shadow-rose-600/25",
    soft: "bg-primsoft text-primink hover:brightness-95 dark:hover:brightness-110",
    dark: "bg-pine text-mint hover:bg-pine3",
  };
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

export const IconBtn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
> = ({ label, className, children, ...rest }) => (
  <button
    aria-label={label}
    title={label}
    className={cn(
      "inline-flex items-center justify-center w-9 h-9 rounded-lg text-mute hover:text-ink hover:bg-card2 transition-colors active:scale-95",
      className
    )}
    {...rest}
  >
    {children}
  </button>
);

/* ---------- Badges ---------- */

export const StatusBadge: React.FC<{ status: TicketStatus; size?: "xs" | "sm" }> = ({
  status,
  size = "sm",
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      size === "sm" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]",
      STATUS_META[status].badge
    )}
  >
    <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_META[status].dot)} />
    {STATUS_META[status].label}
  </span>
);

export const Pill: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", className)}>
    {children}
  </span>
);

/* ---------- Card ---------- */

export const Card: React.FC<
  Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & { title?: React.ReactNode; action?: React.ReactNode }
> = ({ title, action, className, children, ...rest }) => (
  <div
    className={cn(
      "bg-card border border-line rounded-xl card-shadow transition-colors duration-300",
      className
    )}
    {...rest}
  >
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h3 className="font-display font-semibold text-[15px]">{title}</h3>
        {action}
      </div>
    )}
    {children}
  </div>
);

/* ---------- Form ---------- */

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode; className?: string }> = ({
  label,
  hint,
  children,
  className,
}) => (
  <label className={cn("block", className)}>
    <span className="block text-xs font-semibold text-mute mb-1.5 uppercase tracking-wide">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-faint mt-1">{hint}</span>}
  </label>
);

export const inputCls =
  "w-full h-10 px-3 rounded-lg border border-line bg-card2 text-sm text-ink placeholder:text-faint transition-all focus:outline-none focus:border-prim focus:ring-2 focus:ring-prim/20";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...rest }) => (
  <input className={cn(inputCls, className)} {...rest} />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...rest }) => (
  <textarea className={cn(inputCls, "h-auto py-2.5 min-h-20 resize-y", className)} {...rest} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, children, ...rest }) => (
  <select className={cn(inputCls, "appearance-none pr-8 bg-no-repeat bg-[right_0.6rem_center] cursor-pointer", className)}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2393a69b' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    }}
    {...rest}
  >
    {children}
  </select>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative w-10 h-5.5 rounded-full transition-colors duration-200 shrink-0",
      checked ? "bg-prim" : "bg-line"
    )}
  >
    <span
      className={cn(
        "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200",
        checked ? "translate-x-5" : "translate-x-0.5"
      )}
    />
  </button>
);

/* ---------- Segmented ---------- */

export const Segmented: React.FC<{
  options: { value: string; label: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  size?: "sm" | "md";
}> = ({ options, value, onChange, size = "sm" }) => (
  <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-card2 border border-line">
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={cn(
          "rounded-md font-medium transition-all duration-200",
          size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
          value === o.value
            ? "bg-card text-ink shadow-sm"
            : "text-mute hover:text-ink"
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

/* ---------- Modal ---------- */

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  width?: string;
  footer?: React.ReactNode;
}> = ({ open, onClose, title, children, width = "max-w-lg", footer }) => {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pine/60 backdrop-blur-[3px] anim-fade-in" onClick={onClose} />
      <div className={cn("relative w-full bg-card border border-line rounded-xl card-shadow anim-pop", width)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line2">
          <h3 className="font-display font-semibold">{title}</h3>
          <IconBtn label="Tutup" onClick={onClose}>
            <X size={17} />
          </IconBtn>
        </div>
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line2 bg-card2 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
};

/* ---------- Empty state ---------- */

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}> = ({ icon, title, desc, action }) => (
  <div className="flex flex-col items-center justify-center py-14 px-6 text-center anim-fade-in">
    <div className="w-14 h-14 rounded-2xl bg-card2 border border-line flex items-center justify-center text-faint mb-4">
      {icon ?? <Inbox size={24} />}
    </div>
    <p className="font-display font-semibold text-[15px]">{title}</p>
    {desc && <p className="text-[13px] text-mute mt-1.5 max-w-sm leading-relaxed">{desc}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* ---------- Avatar ---------- */

export const Avatar: React.FC<{ name: string; color: string; size?: number; className?: string }> = ({
  name,
  color,
  size = 36,
  className,
}) => {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full font-display font-semibold text-white shrink-0", className)}
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
};

/* ---------- Reveal (scroll) ---------- */

export const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children,
  className,
  delay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

/* ---------- Toast host ---------- */

export const ToastHost: React.FC = () => {
  const { toasts, dismissToast } = useStore();
  const icons = {
    success: <CheckCircle2 size={17} className="text-emerald-500" />,
    error: <XCircle size={17} className="text-rose-500" />,
    warn: <AlertTriangle size={17} className="text-amber-500" />,
    info: <Info size={17} className="text-sky-500" />,
  };
  const borders = {
    success: "border-l-emerald-500",
    error: "border-l-rose-500",
    warn: "border-l-amber-500",
    info: "border-l-sky-500",
  };
  return (
    <div className="fixed top-4 right-4 z-[90] flex flex-col gap-2 w-[min(92vw,360px)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "anim-slide-right bg-card border border-line border-l-4 rounded-lg card-shadow px-3.5 py-3 flex items-start gap-2.5",
            borders[t.type]
          )}
        >
          <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-snug">{t.title}</p>
            {t.body && <p className="text-xs text-mute mt-0.5 leading-snug">{t.body}</p>}
          </div>
          <button onClick={() => dismissToast(t.id)} className="text-faint hover:text-ink transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

/* ---------- misc ---------- */

export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="px-1.5 py-0.5 rounded border border-line bg-card2 text-[11px] font-mono text-mute">
    {children}
  </kbd>
);

export const CopyBtn: React.FC<{ text: string; label?: string }> = ({ text, label = "Salin" }) => {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className="text-xs font-medium text-prim hover:text-prim2 transition-colors"
    >
      {ok ? "✓ Tersalin" : label}
    </button>
  );
};
