import { FiX } from "react-icons/fi";
import { cn } from "../../lib/cn";

type ModalHeaderProps = {
    title: string;
    onClose?: () => void;
    className?: string;
};

function ModalHeader({ title, onClose, className }: ModalHeaderProps) {
    return (
        <div className={cn("relative p-6 pb-4 border-b border-line/50 flex items-center justify-between", className)}>
            <div>
                <h2 className="text-xl font-bold text-ink">{title}</h2>
                <div className="h-0.5 w-20 bg-linear-to-r from-accent to-transparent mt-2 rounded-full" />
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-hover/50 transition-all duration-200 text-ink-subtle hover:text-ink cursor-pointer"
                    aria-label="Close"
                >
                    <FiX size={20} />
                </button>
            )}
        </div>
    );
}

export default ModalHeader;
