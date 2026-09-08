import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";


type ModalProps = {
    isOpen: boolean;
    onClose?: () => void;
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
};

const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
};

function Modal({ isOpen, onClose, size = "md", children }: ModalProps) {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current?.();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 flex justify-center items-center z-50">
            <div
                className="absolute inset-0 bg-backdrop opacity-80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div
                className={twMerge(
                    clsx(
                        "relative bg-linear-to-b from-raised via-raised to-surface w-full mx-4 rounded-xl shadow-2xl border border-line/50 overflow-hidden",
                        sizes[size]
                    )
                )}
            >
                <div className="absolute inset-0 bg-linear-to-br from-line/10 to-transparent pointer-events-none" />

                {children}
            </div>
        </div>,
        document.body
    );
}

export default Modal;