import { create } from "zustand";

type Toast = {
    id: number;
    message: string;
};

type ToastStore = {
    toasts: Toast[];
    showError: (message: string) => void;
    dismissToast: (id: number) => void;
};

let nextId = 0;

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    showError: (message) => {
        const id = nextId++;
        set((state) => ({ toasts: [...state.toasts, { id, message }] }));
    },
    dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));