import { useEffect, useState } from "react";
import { FiChevronDown, FiMonitor } from "react-icons/fi";
import { useToastStore } from "../../../../stores/useToastStore";
import { useUserStore } from "../../../../stores/useUserStore";
import { authService } from "../../../../services/authService";

const THEME_OPTIONS = ["Catppuccin", "Nord", "Gruvbox", "Dracula", "Tokyo Night", "Rose Pine", "Solarized Dark"];

type GeneralViewProps = {
    formId: string;
    onDirtyChange: (dirty: boolean) => void;
    onSaved: () => void;
};

function GeneralView({ formId, onDirtyChange, onSaved }: GeneralViewProps) {
    const { setProfile, profile } = useUserStore();
    const { showError } = useToastStore();
    const [theme, setTheme] = useState(profile?.theme ?? THEME_OPTIONS[0]);

    const isUnchanged = theme === (profile?.theme ?? THEME_OPTIONS[0]);
    const canSave = !isUnchanged;

    useEffect(() => {
        onDirtyChange(canSave);
    }, [canSave, onDirtyChange]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSave) return;

        authService.update({ theme })
            .then((res) => {
                setProfile(res.user);
                onSaved();
            })
            .catch((e) => {
                showError(e instanceof Error ? e.message : "Failed to update account information.");
            });
    };

    const inputCls = "w-full bg-surface/50 text-ink pl-10 pr-4 py-2.5 rounded-lg border border-line focus:outline-none focus:border-line-active focus:ring-2 focus:ring-line-active/20 transition-all placeholder:text-ink-faint";
    const labelCls = "block text-ink-muted text-sm font-medium";

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <label htmlFor="theme" className={labelCls}>Theme</label>
                <div className="relative">
                    <FiMonitor className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" size={18} />
                    <select
                        id="theme"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className={`${inputCls} appearance-none pr-10`}
                    >
                        {THEME_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" size={16} />
                </div>
            </div>
        </form>
    );
}

export default GeneralView;
