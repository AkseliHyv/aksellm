import { cn } from "../../lib/cn";

type MessageProps = {
    role: string;
    content: string;
    createdAt: string;
};

function Message({ role, content, createdAt }: MessageProps) {
    if (role === "system") return null;

    return (
        <div className={cn("flex w-full mt-4 animate-fade-in", role === "user" ? "justify-end" : "justify-start")}>
            <div className="flex flex-col max-w-200 wrap-anywhere">
                <div
                    className={cn(
                        "w-fit px-3 py-2 rounded-lg",
                        role === "user"
                            ? "bg-linear-to-br from-accent/90 to-accent-strong/90 text-app-deep self-end shadow-md shadow-accent/10"
                            : "bg-raised self-start"
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
