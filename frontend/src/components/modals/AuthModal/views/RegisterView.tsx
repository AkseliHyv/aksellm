import { useState } from "react";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

type RegisterViewProps = {
    onChangeState: () => void;
    onSubmit: (data: { username: string; email: string; password: string }) => void;
};

function RegisterView({ onChangeState, onSubmit }: RegisterViewProps) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const isFormValid =
        username.trim() &&
        username.length >= 3 &&
        username.length <= 20 &&
        /^[a-zA-Z0-9_]+$/.test(username) &&
        email.trim() &&
        password &&
        password === confirmPassword &&
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password);

    return (
        <>
            <div className="space-y-2">
                <label htmlFor="username" className="block text-ink-muted text-sm font-medium">Username</label>
                <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-surface/50 text-ink pl-10 pr-4 py-2.5 rounded-lg border border-line focus:outline-none focus:border-line-active focus:ring-2 focus:ring-line-active/20 transition-all placeholder:text-ink-faint"
                        placeholder="Enter username"
                    />
                </div>
                {username && (
                    <div className="space-y-1 text-xs mt-2">
                        <div className={`flex items-center gap-2 ${username.length >= 3 && username.length <= 20 ? "text-success" : "text-ink-faint"}`}>
                            <span>{username.length >= 3 && username.length <= 20 ? "✓" : "○"}</span>
                            <span>3-20 characters</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/^[a-zA-Z0-9_]+$/.test(username) ? "text-success" : "text-ink-faint"}`}>
                            <span>{/^[a-zA-Z0-9_]+$/.test(username) ? "✓" : "○"}</span>
                            <span>Only letters, numbers, and underscores</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="email" className="block text-ink-muted text-sm font-medium">Email</label>
                <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-surface/50 text-ink pl-10 pr-4 py-2.5 rounded-lg border border-line focus:outline-none focus:border-line-active focus:ring-2 focus:ring-line-active/20 transition-all placeholder:text-ink-faint"
                        placeholder="Enter email"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="password" className="block text-ink-muted text-sm font-medium">Password</label>
                <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                    <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-surface/50 text-ink pl-10 pr-12 py-2.5 rounded-lg border border-line focus:outline-none focus:border-line-active focus:ring-2 focus:ring-line-active/20 transition-all placeholder:text-ink-faint"
                        placeholder="Enter password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink-muted transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                </div>
                {password && (
                    <div className="space-y-1 text-xs mt-2">
                        <div className={`flex items-center gap-2 ${password.length >= 8 ? "text-success" : "text-ink-faint"}`}>
                            <span>{password.length >= 8 ? "✓" : "○"}</span>
                            <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? "text-success" : "text-ink-faint"}`}>
                            <span>{/[A-Z]/.test(password) ? "✓" : "○"}</span>
                            <span>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[a-z]/.test(password) ? "text-success" : "text-ink-faint"}`}>
                            <span>{/[a-z]/.test(password) ? "✓" : "○"}</span>
                            <span>One lowercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? "text-success" : "text-ink-faint"}`}>
                            <span>{/[0-9]/.test(password) ? "✓" : "○"}</span>
                            <span>One number</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(password) ? "text-success" : "text-ink-faint"}`}>
                            <span>{/[^A-Za-z0-9]/.test(password) ? "✓" : "○"}</span>
                            <span>One special character</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-ink-muted text-sm font-medium">Confirm Password</label>
                <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                    <input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-surface/50 text-ink pl-10 pr-4 py-2.5 rounded-lg border border-line focus:outline-none focus:border-line-active focus:ring-2 focus:ring-line-active/20 transition-all placeholder:text-ink-faint"
                        placeholder="Re-enter password"
                    />
                </div>
                {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-danger mt-1">Passwords do not match</p>
                )}
            </div>

            <div className="relative flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onChangeState}
                    aria-label="Switch to login form"
                    className="absolute left-0 px-5 py-2.5 cursor-pointer bg-raised/50 text-ink-muted rounded-lg hover:bg-hover/50 transition-all duration-200 font-medium border border-line/50 hover:border-line-strong"
                >
                    Log In
                </button>
                <button
                    type="submit"
                    onClick={() => onSubmit({ username, email, password })}
                    disabled={!isFormValid}
                    aria-label="Register"
                    className="px-5 py-2.5 cursor-pointer bg-linear-to-r from-line to-line-strong text-ink rounded-lg hover:from-line-strong hover:to-line-active transition-all duration-200 font-medium shadow-lg shadow-surface/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-line disabled:hover:to-line-strong"
                >
                    Create Account
                </button>
            </div>
        </>
    );
}

export default RegisterView;