"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSchema = exports.UpdateUserSchema = exports.CreateUserSchema = exports.UserSchema = exports.UserRole = void 0;
const zod_1 = require("zod");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["USER"] = "USER";
    UserRole["VIEWER"] = "VIEWER";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1),
    role: zod_1.z.nativeEnum(UserRole),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    lastLoginAt: zod_1.z.date().nullable()
});
exports.CreateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1),
    password: zod_1.z.string().min(8),
    role: zod_1.z.nativeEnum(UserRole).default(UserRole.USER)
});
exports.UpdateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    role: zod_1.z.nativeEnum(UserRole).optional()
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
