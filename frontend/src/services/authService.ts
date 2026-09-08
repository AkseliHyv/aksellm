import request from "./api";
import type { UserProfile } from "../domain";

type LoginDto = {
    email: string;
    password: string;
};

type RegisterDto = {
    username: string;
    email: string;
    password: string;
};

type AuthResponseDto = {
    user: UserProfile;
    message?: string;
};

type UpdateUserDto = {
    displayName?: string;
    emailAddress?: string;
};

export const authService = {
    register: (data: RegisterDto) =>
        request<AuthResponseDto>("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    login: (data: LoginDto) =>
        request<AuthResponseDto>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    me: () =>
        request<AuthResponseDto>("/api/auth/me"),

    logout: () =>
        request<void>("/api/auth/logout", { method: "POST" }),

    update: (data: UpdateUserDto) =>
        request<AuthResponseDto>("/api/auth/update", {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
};