import { useEffect } from "react";
import { FiAlertCircle, FiX } from "react-icons/fi";
import { useToastStore } from "./stores/useToastStore";

const AUTO_DISMISS_MS = 5000;

function ToastItem({ id, message }: { id: number; message: string }) {
    const dismissToast = useToastStore((s) => s.dismissToast);

    useEffect(() => {
        const timeout = setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
        return () => clearTimeout(timeout);
    }, [id, dismissToast]);

    return (
        <div className="flex items-start gap-3 bg-raised border border-danger-solid/30 rounded-lg shadow-lg shadow-black/30 px-4 py-3 w-80 animate-in fade-in slide-in-from-top-2">
            <FiAlertCircle className="text-danger mt-0.5 shrink-0" size={18} />
            <p className="text-sm text-ink-muted flex-1">{message}</p>
            <button
                onClick={() => dismissToast(id)}
                className="text-ink-faint hover:text-ink transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss"
            >
                <FiX size={16} />
            </button>
        </div>
    );
}

function ToastRenderer() {
    const toasts = useToastStore((s) => s.toasts);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-100 flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} id={toast.id} message={toast.message} />
            ))}
        </div>
    );
}

export default ToastRenderer;