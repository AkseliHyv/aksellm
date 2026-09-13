import { useState } from "react";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiCircle } from "react-icons/fi";
import { cn } from "../../../../lib/cn";
import { FormInput } from "../../../ui/FormField";
import Button from "../../../ui/Button";

type RegisterViewProps = {
    onChangeState: () => void;
    onSubmit: (data: { username: string; email: string; password: string }) => void;
};

function Requirement({ met, children }: { met: boolean; children: React.ReactNode }) {
    return (
        <div className={cn("flex items-center gap-2", met ? "text-success" : "text-ink-faint")}>
            {met ? <FiCheck size={12} /> : <FiCircle size={10} />}
            <span>{children}</span>
        </div>
    );
}

function RegisterView({ onChangeState, onSubmit }: RegisterViewProps) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const usernameLengthOk = username.length >= 3 && username.length <= 20;
    const usernameCharsOk = /^[a-zA-Z0-9_]+$/.test(username);
    const passwordLengthOk = password.length >= 8;
    const passwordUpperOk = /[A-Z]/.test(password);
    const passwordLowerOk = /[a-z]/.test(password);
    const passwordDigitOk = /[0-9]/.test(password);
    const passwordSpecialOk = /[^A-Za-z0-9]/.test(password);

    const isFormValid =
        username.trim() &&
        usernameLengthOk &&
        usernameCharsOk &&
        email.trim() &&
        password &&
        password === confirmPassword &&
        passwordLengthOk &&
        passwordUpperOk &&
        passwordLowerOk &&
        passwordDigitOk &&
        passwordSpecialOk;

    return (
        <>
            <div className="space-y-2">
                <FormInput
                    id="username"
                    label="Username"
                    icon={FiUser}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                />
                {username && (
                    <div className="space-y-1 text-xs">
                        <Requirement met={usernameLengthOk}>3-20 characters</Requirement>
                        <Requirement met={usernameCharsOk}>Only letters, numbers, and underscores</Requirement>
                    </div>
                )}
            </div>

            <FormInput
                id="email"
                label="Email"
                icon={FiMail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
            />

            <div className="space-y-2">
                <FormInput
                    id="password"
                    label="Password"
                    icon={FiLock}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    rightElement={
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-ink-subtle hover:text-ink-muted transition-colors cursor-pointer"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    }
                />
                {password && (
                    <div className="space-y-1 text-xs">
                        <Requirement met={passwordLengthOk}>At least 8 characters</Requirement>
                        <Requirement met={passwordUpperOk}>One uppercase letter</Requirement>
                        <Requirement met={passwordLowerOk}>One lowercase letter</Requirement>
                        <Requirement met={passwordDigitOk}>One number</Requirement>
                        <Requirement met={passwordSpecialOk}>One special character</Requirement>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <FormInput
                    id="confirmPassword"
                    label="Confirm Password"
                    icon={FiLock}
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                />
                {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-danger">Passwords do not match</p>
                )}
            </div>

            <div className="relative flex justify-end gap-3 pt-4">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onChangeState}
                    aria-label="Switch to login form"
                    className="absolute left-0"
                >
                    Log In
                </Button>
                <Button
                    type="submit"
                    onClick={() => onSubmit({ username, email, password })}
                    disabled={!isFormValid}
                    aria-label="Register"
                >
                    Create Account
                </Button>
            </div>
        </>
    );
}

export default RegisterView;
