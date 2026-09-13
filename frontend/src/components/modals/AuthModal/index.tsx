import { useState, type FormEvent } from "react";
import Modal from "../../ui/Modal";
import ModalHeader from "../../ui/ModalHeader";
import LogInView from "./views/LogInView";
import RegisterView from "./views/RegisterView";
import { useModalStore } from "../../../stores/useModalStore";
import { useUserStore } from "../../../stores/useUserStore";
import { authService, llmService } from "../../../services";
import { useLLMStore } from "../../../stores/useLLMStore";

function AuthModal() {
    const { activeModal, closeModal } = useModalStore();
    const { setProfile } = useUserStore();
    const { setLLMs } = useLLMStore();
    const [view, setView] = useState<"login" | "register">("login");
    const [error, setError] = useState<string | null>(null);

    const handleLoginSubmit = (data: { email: string; password: string }) => {
        setError(null);
        authService.login(data)
            .then((res) => {
                setProfile(res.user);
                return llmService.getAll();
            })
            .then((llms) => {
                setLLMs(llms);
                closeModal();
            })
            .catch((e) => {
                setError(e instanceof Error ? e.message : "Login failed");
            });
    };

    const handleRegisterSubmit = (data: { username: string; email: string; password: string }) => {
        setError(null);
        authService.register(data)
            .then((res) => {
                setProfile(res.user);
                setLLMs([]);
                closeModal();
            })
            .catch((e) => {
                setError(e instanceof Error ? e.message : "Registration failed");
            });
    };

    return (
        <Modal isOpen={activeModal === "auth"} size="md">
            <ModalHeader title={view === "login" ? "Log In" : "Create an Account"} />

            <form onSubmit={(e: FormEvent) => e.preventDefault()} className="relative p-6 space-y-5">
                {error && (
                    <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-2 animate-fade-in">
                        {error}
                    </p>
                )}
                {view === "login" ? (
                    <LogInView onSubmit={handleLoginSubmit} onChangeState={() => { setView("register"); setError(null); }} />
                ) : (
                    <RegisterView onSubmit={handleRegisterSubmit} onChangeState={() => { setView("login"); setError(null); }} />
                )}
            </form>
        </Modal>
    );
}

export default AuthModal;
