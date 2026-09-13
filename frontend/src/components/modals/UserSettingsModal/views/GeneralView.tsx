import { useEffect, useState } from "react";
import { FiMonitor } from "react-icons/fi";
import { useToastStore } from "../../../../stores/useToastStore";
import { useUserStore } from "../../../../stores/useUserStore";
import { authService } from "../../../../services/authService";
import { FormSelect } from "../../../ui/FormField";
import { THEME_OPTIONS } from "../../../../domain";
import { applyTheme } from "../../../../lib/theme";

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

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        return () => {
            applyTheme(useUserStore.getState().profile?.theme);
        };
    }, []);

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

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
            <FormSelect
                id="theme"
                label="Theme"
                icon={FiMonitor}
                options={THEME_OPTIONS}
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
            />
        </form>
    );
}

export default GeneralView;
