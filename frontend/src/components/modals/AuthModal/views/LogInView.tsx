import { useState } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { FormInput } from "../../../ui/FormField";
import Button from "../../../ui/Button";

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
            <FormInput
                id="email"
                label="Email"
                icon={FiMail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
            />

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

            <div className="flex relative justify-end gap-3 pt-4">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onChangeState}
                    aria-label="Switch to registration form"
                    className="absolute left-0"
                >
                    Register
                </Button>
                <Button
                    type="submit"
                    onClick={() => onSubmit({ email, password })}
                    disabled={!email.trim() || !password}
                    aria-label="Login"
                >
                    Log In
                </Button>
            </div>
        </>
    );
}

export default LogInView;
