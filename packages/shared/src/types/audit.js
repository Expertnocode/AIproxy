"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAuditLogSchema = exports.AuditLogSchema = exports.AuditEventType = void 0;
const zod_1 = require("zod");
var AuditEventType;
(function (AuditEventType) {
    AuditEventType["PROXY_REQUEST"] = "PROXY_REQUEST";
    AuditEventType["PII_DETECTED"] = "PII_DETECTED";
    AuditEventType["RULE_TRIGGERED"] = "RULE_TRIGGERED";
    AuditEventType["USER_LOGIN"] = "USER_LOGIN";
    AuditEventType["USER_LOGOUT"] = "USER_LOGOUT";
    AuditEventType["CONFIG_CHANGED"] = "CONFIG_CHANGED";
    AuditEventType["ERROR_OCCURRED"] = "ERROR_OCCURRED";
})(AuditEventType || (exports.AuditEventType = AuditEventType = {}));
exports.AuditLogSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    eventType: zod_1.z.nativeEnum(AuditEventType),
    userId: zod_1.z.string().cuid().nullable(),
    requestId: zod_1.z.string().uuid(),
    timestamp: zod_1.z.date(),
    metadata: zod_1.z.record(zod_1.z.any()),
    ipAddress: zod_1.z.string().ip().optional(),
    userAgent: zod_1.z.string().optional()
});
exports.CreateAuditLogSchema = zod_1.z.object({
    eventType: zod_1.z.nativeEnum(AuditEventType),
    userId: zod_1.z.string().cuid().nullable(),
    requestId: zod_1.z.string().uuid(),
    metadata: zod_1.z.record(zod_1.z.any()),
    ipAddress: zod_1.z.string().ip().optional(),
    userAgent: zod_1.z.string().optional()
});
