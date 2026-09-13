import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
};

const base = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium cursor-pointer transition-all duration-200 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const variants: Record<ButtonVariant, string> = {
    primary: "bg-linear-to-r from-accent to-accent-strong text-app-deep shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:brightness-110",
    secondary: "bg-raised/50 text-ink-muted border border-line/50 hover:bg-hover/50 hover:border-line-strong",
    danger: "bg-linear-to-r from-danger-solid to-danger-deep text-ink shadow-lg shadow-danger-deep/30 hover:brightness-110",
    ghost: "text-ink-subtle hover:text-ink hover:bg-hover/50",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", className, ...props }, ref) => (
        <button ref={ref} className={cn(base, variants[variant], className)} {...props} />
    )
);

Button.displayName = "Button";

export default Button;
