"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRegistrationSchema = exports.moderateCommentSchema = exports.analyzeManifestoSchema = void 0;
exports.validateRequest = validateRequest;
exports.validateAuth = validateAuth;
exports.validateAdmin = validateAdmin;
exports.validateRateLimit = validateRateLimit;
exports.sanitizeHtml = sanitizeHtml;
exports.validateFile = validateFile;
const Joi = __importStar(require("joi"));
const functions = __importStar(require("firebase-functions"));
// Request validation schemas
exports.analyzeManifestoSchema = Joi.object({
    url: Joi.string().uri().required().messages({
        'string.uri': 'Invalid URL format',
        'any.required': 'URL is required'
    }),
    candidateName: Joi.string().min(1).max(100).required().messages({
        'string.min': 'Candidate name is required',
        'string.max': 'Candidate name must be less than 100 characters',
        'any.required': 'Candidate name is required'
    }),
    prefecture: Joi.string().min(1).max(50).required().messages({
        'string.min': 'Prefecture is required',
        'string.max': 'Prefecture must be less than 50 characters',
        'any.required': 'Prefecture is required'
    }),
    electionType: Joi.string().valid('prefectural', 'municipal', 'national', 'house-of-representatives', 'house-of-councilors', '参議院選挙').required().messages({
        'any.only': 'Invalid election type',
        'any.required': 'Election type is required'
    }),
    electionDate: Joi.string().isoDate().required().messages({
        'string.isoDate': 'Invalid date format. Use ISO date format (YYYY-MM-DD)',
        'any.required': 'Election date is required'
    }),
    aiModel: Joi.string().valid('gemini-2.5-pro', 'claude-4.0-sonnet', 'perplexity', 'auto').optional().default('auto'),
    analysisSettings: Joi.object({
        includeFinancialAnalysis: Joi.boolean().default(true),
        includeTechnicalAnalysis: Joi.boolean().default(true),
        includePoliticalAnalysis: Joi.boolean().default(true),
        includeTimelineAnalysis: Joi.boolean().default(true),
        detailLevel: Joi.string().valid('basic', 'detailed', 'comprehensive').default('detailed')
    }).optional()
});
exports.moderateCommentSchema = Joi.object({
    text: Joi.string().min(1).max(2000).required().messages({
        'string.min': 'Comment text is required',
        'string.max': 'Comment must be less than 2000 characters',
        'any.required': 'Comment text is required'
    }),
    userId: Joi.string().min(1).required().messages({
        'string.min': 'User ID is required',
        'any.required': 'User ID is required'
    }),
    candidateId: Joi.string().optional(),
    policyId: Joi.string().optional()
});
exports.userRegistrationSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required'
    }),
    displayName: Joi.string().min(1).max(50).required().messages({
        'string.min': 'Display name is required',
        'string.max': 'Display name must be less than 50 characters',
        'any.required': 'Display name is required'
    }),
    prefecture: Joi.string().max(50).optional(),
    isAdmin: Joi.boolean().default(false)
});
/**
 * Validate request data against schema
 */
function validateRequest(data, schema) {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        const errorMessage = error.details
            .map(detail => detail.message)
            .join(', ');
        functions.logger.warn('Validation error:', errorMessage);
        throw new functions.https.HttpsError('invalid-argument', `Validation failed: ${errorMessage}`);
    }
    return value;
}
/**
 * Validate authentication context
 */
function validateAuth(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
}
/**
 * Validate admin privileges
 */
function validateAdmin(context) {
    var _a;
    validateAuth(context);
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
        throw new functions.https.HttpsError('permission-denied', 'Admin privileges required');
    }
}
/**
 * Rate limiting validation (placeholder)
 */
function validateRateLimit(userId, operation) {
    // Note: This is a placeholder. In production, you would implement
    // actual rate limiting using Redis or Firestore
    // For now, we'll just log the operation
    functions.logger.info(`Rate limit check for user ${userId}, operation: ${operation}`);
}
/**
 * Sanitize HTML content
 */
function sanitizeHtml(html) {
    // Basic HTML sanitization - remove script tags and suspicious content
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
}
function validateFile(file, options) {
    if (!file) {
        throw new functions.https.HttpsError('invalid-argument', 'File is required');
    }
    if (file.size > options.maxSize) {
        throw new functions.https.HttpsError('invalid-argument', `File size exceeds limit of ${options.maxSize / 1024 / 1024}MB`);
    }
    if (!options.allowedTypes.includes(file.mimetype)) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid file type. Allowed types: ${options.allowedTypes.join(', ')}`);
    }
}
//# sourceMappingURL=requestValidator.js.map