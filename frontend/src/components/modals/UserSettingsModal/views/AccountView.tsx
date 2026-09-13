import { useEffect, useState } from "react";
import { FiUser } from "react-icons/fi";
import { useUserStore } from "../../../../stores/useUserStore";
import Avatar from "../../../ui/Avatar";
import { authService } from "../../../../services";
import { useToastStore } from "../../../../stores/useToastStore";

type AccountViewProps = {
    formId: string;
    onDirtyChange: (dirty: boolean) => void;
    onSaved: () => void;
};

function AccountView({ formId, onDirtyChange, onSaved }: AccountViewProps) {
    const { setProfile, profile } = useUserStore();
    const { showError } = useToastStore();
    const [username, setUsername] = useState(profile?.username ?? "");

    const isUnchanged = username.trim() === (profile?.username ?? "");
    const canSave = username.trim().length > 0 && !isUnchanged;

    useEffect(() => {
        onDirtyChange(canSave);
    }, [canSave, onDirtyChange]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSave) return;

        authService.update({ displayName: username })
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
            <div className="flex items-center gap-4">
                <Avatar username={username || profile?.username} size="lg" />
                <div className="min-w-0">
                    <p className="text-ink-subtle text-sm">Signed in as</p>
                    <p className="text-ink truncate">{profile?.email}</p>
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="username" className={labelCls}>Username</label>
                <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={inputCls}
                        placeholder="Enter a username"
                    />
                </div>
            </div>
        </form>
    );
}

export default AccountView;
