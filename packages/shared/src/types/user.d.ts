import { z } from 'zod';
export declare enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER",
    VIEWER = "VIEWER"
}
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    lastLoginAt: z.ZodNullable<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
}, {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
}>;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodNativeEnum<typeof UserRole>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    role: UserRole;
    password: string;
}, {
    email: string;
    name: string;
    password: string;
    role?: UserRole | undefined;
}>;
export declare const UpdateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    role?: UserRole | undefined;
}, {
    name?: string | undefined;
    role?: UserRole | undefined;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type User = z.infer<typeof UserSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export interface AuthResponse {
    user: User;
    token: string;
    expiresAt: string;
}
