import { useState } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

type LogInViewProps = {
    onChangeState: () => void;
    onSubmit: (data: { email: string; password: string }) => void;
};

function LogInView({ onChangeState, onSubmit }: LogInViewProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
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
            </div>

            <div className="flex relative justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onChangeState}
                    aria-label="Switch to registration form"
                    className="absolute left-0 px-5 py-2.5 cursor-pointer bg-raised/50 text-ink-muted rounded-lg hover:bg-hover/50 transition-all duration-200 font-medium border border-line/50 hover:border-line-strong"
                >
                    Register
                </button>
                <button
                    type="submit"
                    onClick={() => onSubmit({ email, password })}
                    disabled={!email.trim() || !password}
                    aria-label="Login"
                    className="px-5 py-2.5 cursor-pointer bg-linear-to-r from-line to-line-strong text-ink rounded-lg hover:from-line-strong hover:to-line-active transition-all duration-200 font-medium shadow-lg shadow-surface/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-line disabled:hover:to-line-strong"
                >
                    Log In
                </button>
            </div>
        </>
    );
}

export default LogInView;