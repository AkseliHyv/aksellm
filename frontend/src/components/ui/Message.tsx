import Markdown from "react-markdown";
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
            <div className="flex flex-col min-w-0 max-w-200 wrap-anywhere">
                <div
                    className={cn(
                        "w-fit max-w-full px-3 py-2 rounded-lg",
                        role === "user"
                            ? "bg-linear-to-br from-accent/90 to-accent-strong/90 text-app-deep self-end shadow-md shadow-accent/10 whitespace-pre-wrap"
                            : "bg-raised self-start"
                    )}
                >
                    {role === "user" ? (
                        content
                    ) : (
                        <div className="prose prose-sm sm:prose-base prose-invert max-w-none">
                            <Markdown>{content}</Markdown>
                        </div>
                    )}
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