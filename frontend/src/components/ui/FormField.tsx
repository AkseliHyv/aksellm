import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";
import type { IconType } from "react-icons";
import { FiChevronDown } from "react-icons/fi";
import { cn } from "../../lib/cn";

const fieldCls = "w-full bg-surface/50 text-ink pl-10 pr-4 py-2.5 rounded-lg border border-line focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-ink-faint";
export const labelCls = "block text-ink-muted text-sm font-medium";

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    icon: IconType;
    rightElement?: ReactNode;
};

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, icon: Icon, rightElement, className, id, ...props }, ref) => (
        <div className="space-y-2">
            <label htmlFor={id} className={labelCls}>{label}</label>
            <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                <input
                    ref={ref}
                    id={id}
                    className={cn(fieldCls, rightElement && "pr-12", className)}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
                )}
            </div>
        </div>
    )
);
FormInput.displayName = "FormInput";

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    icon: IconType;
    options: readonly string[];
};

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
    ({ label, icon: Icon, options, className, id, ...props }, ref) => (
        <div className="space-y-2">
            <label htmlFor={id} className={labelCls}>{label}</label>
            <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint z-10 pointer-events-none" size={18} />
                <select
                    ref={ref}
                    id={id}
                    className={cn(fieldCls, "pr-10 appearance-none cursor-pointer", className)}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option} value={option} className="bg-raised">{option}</option>
                    ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none" size={16} />
            </div>
        </div>
    )
);
FormSelect.displayName = "FormSelect";
