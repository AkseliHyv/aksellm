import clsx from "clsx";
import { twMerge } from "tailwind-merge";

type MessageProps = {
    role: string;
    content: string;
    createdAt: string;
};

function Message({ role, content, createdAt }: MessageProps) {
    if (role === "system") return null;

    return (
        <div
            className={twMerge(
                clsx(
                    "flex w-full mt-4",
                    role === "user" ? "justify-end" : "justify-start"
                )
            )}
        >
            <div className="flex flex-col max-w-200 wrap-anywhere">
                <div
                    className={twMerge(
                        clsx(
                            "w-fit px-3 py-2 rounded-lg",
                            role === "user"
                                ? "bg-hover/70 self-end"
                                : "bg-raised self-start"
                        )
                    )}
                >
                    {content}
                </div>

                {role === "user" && (
                    <span className="text-xs text-ink-faint mt-1 self-end">
                        {new Date(createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                )}
            </div>
        </div>
    );
}

export default Message;
