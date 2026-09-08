import { twMerge } from "tailwind-merge";
import clsx from "clsx";

type AvatarProps = {
    username?: string | null;
    size?: "sm" | "md" | "lg";
};

const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
};

const colors = [
    "bg-violet-600",
    "bg-blue-600",
    "bg-emerald-600",
    "bg-rose-600",
    "bg-amber-600",
    "bg-cyan-600",
    "bg-pink-600",
    "bg-indigo-600",
];

const DEFAULT_USERNAME = "Guest";

function getColor(username: string) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function Avatar({ username, size = "sm" }: AvatarProps) {
    const resolvedUsername = username || DEFAULT_USERNAME;

    return (
        <div
            className={twMerge(
                clsx(
                    sizes[size],
                    getColor(resolvedUsername),
                    "rounded-full ring-2 ring-line group-hover:ring-line-strong",
                    "flex items-center justify-center",
                    "font-semibold text-ink transition-all shrink-0"
                )
            )}
        >
            {resolvedUsername.slice(0, 2).toUpperCase()}
        </div>
    );
}

export default Avatar;