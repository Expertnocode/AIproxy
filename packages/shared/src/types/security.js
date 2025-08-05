"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSecurityRuleSchema = exports.CreateSecurityRuleSchema = exports.SecurityRuleSchema = exports.PIIType = exports.RuleAction = void 0;
const zod_1 = require("zod");
var RuleAction;
(function (RuleAction) {
    RuleAction["BLOCK"] = "BLOCK";
    RuleAction["ANONYMIZE"] = "ANONYMIZE";
    RuleAction["REDACT"] = "REDACT";
    RuleAction["WARN"] = "WARN";
    RuleAction["ALLOW"] = "ALLOW";
})(RuleAction || (exports.RuleAction = RuleAction = {}));
var PIIType;
(function (PIIType) {
    PIIType["EMAIL"] = "EMAIL";
    PIIType["PHONE"] = "PHONE";
    PIIType["CREDIT_CARD"] = "CREDIT_CARD";
    PIIType["SSN"] = "SSN";
    PIIType["IP_ADDRESS"] = "IP_ADDRESS";
    PIIType["PERSON"] = "PERSON";
    PIIType["LOCATION"] = "LOCATION";
    PIIType["ORGANIZATION"] = "ORGANIZATION";
    PIIType["DATE_TIME"] = "DATE_TIME";
    PIIType["URL"] = "URL";
    PIIType["CUSTOM"] = "CUSTOM";
})(PIIType || (exports.PIIType = PIIType = {}));
exports.SecurityRuleSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    pattern: zod_1.z.string().min(1),
    action: zod_1.z.nativeEnum(RuleAction),
    enabled: zod_1.z.boolean().default(true),
    priority: zod_1.z.number().int().default(0),
    userId: zod_1.z.string().cuid(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.CreateSecurityRuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    pattern: zod_1.z.string().min(1),
    action: zod_1.z.nativeEnum(RuleAction),
    enabled: zod_1.z.boolean().default(true),
    priority: zod_1.z.number().int().default(0)
});
exports.UpdateSecurityRuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    pattern: zod_1.z.string().min(1).optional(),
    action: zod_1.z.nativeEnum(RuleAction).optional(),
    enabled: zod_1.z.boolean().optional(),
    priority: zod_1.z.number().int().optional()
});
