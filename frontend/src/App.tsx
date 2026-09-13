import { useEffect, useState } from "react";
import SideBar from "./components/SideBar";
import ModalRenderer from "./ModalRenderer";
import { useUserStore } from "./stores/useUserStore";
import { useModalStore } from "./stores/useModalStore";
import { useLLMStore } from "./stores/useLLMStore";
import { authService, llmService } from "./services";
import ChatPanel from "./components/ChatPanel";
import ToastRenderer from "./ToastRenderer";
import { useToastStore } from "./stores/useToastStore";

function App() {
    const { setProfile, clearProfile } = useUserStore();
    const theme = useUserStore((s) => s.profile?.theme);
    const { openModal } = useModalStore();
    const { setLLMs } = useLLMStore();
    const { showError } = useToastStore();
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        authService.me()
            .then((res) => {
                setProfile(res.user);
                llmService.getAll()
                    .then(setLLMs)
                    .catch((e) => showError(e instanceof Error ? e.message : "Failed to load LLMs."));
            })
            .catch(() => {
                clearProfile();
                setLLMs([]);
                openModal("auth");
            })
            .finally(() => {
                setAuthLoading(false);
            });
    }, []);

    useEffect(() => {
        if (theme) {
            document.documentElement.dataset.theme = theme.toLowerCase().replace(/\s+/g, "-");
        } else {
            delete document.documentElement.dataset.theme;
        }
    }, [theme]);

    if (authLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-3 border-ink-muted border-t-raised" />
            </div>
        );
    }

    return (
        <div className="flex">
            <SideBar />
            <ChatPanel />
            <ModalRenderer />
            <ToastRenderer />
        </div>
    );
}

export default App;
