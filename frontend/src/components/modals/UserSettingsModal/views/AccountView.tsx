import { useEffect, useState } from "react";
import { FiUser } from "react-icons/fi";
import { useUserStore } from "../../../../stores/useUserStore";
import Avatar from "../../../ui/Avatar";
import { FormInput } from "../../../ui/FormField";
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

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4">
                <Avatar username={username || profile?.username} size="lg" />
                <div className="min-w-0">
                    <p className="text-ink-subtle text-sm">Signed in as</p>
                    <p className="text-ink truncate">{profile?.email}</p>
                </div>
            </div>

            <FormInput
                id="username"
                label="Username"
                icon={FiUser}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a username"
            />
        </form>
    );
}

export default AccountView;
