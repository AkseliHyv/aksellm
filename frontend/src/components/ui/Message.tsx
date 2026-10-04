import Markdown from "react-markdown";
import { cn } from "../../lib/cn";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { useRef, useState, type ComponentPropsWithoutRef } from "react";

type MessageProps = {
    role: string;
    content: string;
    createdAt: string;
};

function normalizeMath(text: string): string {
    return text
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);
}

function CodeBlock({ children, node: _node, ...props }: ComponentPropsWithoutRef<"pre"> & { node?: unknown }) {
    const preRef = useRef<HTMLPreElement>(null);
    const [copied, setCopied] = useState(false);

    async function copy() {
        await navigator.clipboard.writeText(preRef.current?.textContent ?? "");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div className="relative group">
            <button
                onClick={copy}
                className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                {copied ? "Copied" : "Copy"}
            </button>
            <pre ref={preRef} {...props}>
                {children}
            </pre>
        </div>
    );
}

function Table({ node: _node, ...props }: ComponentPropsWithoutRef<"table"> & { node?: unknown }) {
    return (
        <div className="overflow-x-auto">
            <table {...props} />
        </div>
    );
}

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
                    ) : content === "" ? (
                        <div className="w-4 h-4 my-1 animate-spin rounded-full border-2 border-ink-muted border-t-transparent" />
                    ) : (
                        <div className="prose prose-sm sm:prose-base prose-invert max-w-none">
                            <Markdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                                components={{ pre: CodeBlock, table: Table }}
                            >
                                {normalizeMath(content)}
                            </Markdown>
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