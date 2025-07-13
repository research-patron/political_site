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
exports.setupAuthHandler = setupAuthHandler;
exports.grantAdminPrivileges = grantAdminPrivileges;
exports.revokeAdminPrivileges = revokeAdminPrivileges;
exports.verifyUserToken = verifyUserToken;
exports.isAdmin = isAdmin;
exports.isVerified = isVerified;
exports.getUserId = getUserId;
exports.updateLastLogin = updateLastLogin;
exports.checkUserRateLimit = checkUserRateLimit;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
/**
 * Set up custom claims for new users
 */
async function setupAuthHandler(user) {
    try {
        // Default claims for new users
        const customClaims = {
            admin: false,
            verified: false,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
        };
        // Check if this is the first user (make them admin)
        const listUsersResult = await admin.auth().listUsers(2);
        if (listUsersResult.users.length === 1) {
            customClaims.admin = true;
            customClaims.verified = true;
            functions.logger.info(`First user ${user.uid} granted admin privileges`);
        }
        // Set custom claims
        await admin.auth().setCustomUserClaims(user.uid, customClaims);
        // Create user document in Firestore
        await createUserDocument(user, customClaims);
        functions.logger.info(`User ${user.uid} setup completed with claims:`, customClaims);
    }
    catch (error) {
        functions.logger.error('Error setting up user:', error);
        throw new functions.https.HttpsError('internal', 'Failed to setup user account');
    }
}
/**
 * Create user document in Firestore
 */
async function createUserDocument(user, claims) {
    const userData = {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        emailVerified: user.emailVerified,
        disabled: user.disabled,
        admin: claims.admin,
        verified: claims.verified,
        prefecture: null,
        settings: {
            notifications: true,
            theme: 'light',
            language: 'ja'
        },
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        lastLoginAt: admin.firestore.Timestamp.now()
    };
    await admin.firestore()
        .collection('users')
        .doc(user.uid)
        .set(userData);
}
/**
 * Grant admin privileges to a user
 */
async function grantAdminPrivileges(uid) {
    try {
        // Get current claims
        const user = await admin.auth().getUser(uid);
        const currentClaims = user.customClaims || {};
        // Update claims
        const newClaims = Object.assign(Object.assign({}, currentClaims), { admin: true, verified: true, adminGrantedAt: new Date().toISOString() });
        await admin.auth().setCustomUserClaims(uid, newClaims);
        // Update Firestore document
        await admin.firestore()
            .collection('users')
            .doc(uid)
            .update({
            admin: true,
            verified: true,
            updatedAt: admin.firestore.Timestamp.now()
        });
        functions.logger.info(`Admin privileges granted to user ${uid}`);
    }
    catch (error) {
        functions.logger.error('Error granting admin privileges:', error);
        throw new functions.https.HttpsError('internal', 'Failed to grant admin privileges');
    }
}
/**
 * Revoke admin privileges from a user
 */
async function revokeAdminPrivileges(uid) {
    try {
        // Get current claims
        const user = await admin.auth().getUser(uid);
        const currentClaims = user.customClaims || {};
        // Update claims
        const newClaims = Object.assign(Object.assign({}, currentClaims), { admin: false, adminRevokedAt: new Date().toISOString() });
        await admin.auth().setCustomUserClaims(uid, newClaims);
        // Update Firestore document
        await admin.firestore()
            .collection('users')
            .doc(uid)
            .update({
            admin: false,
            updatedAt: admin.firestore.Timestamp.now()
        });
        functions.logger.info(`Admin privileges revoked from user ${uid}`);
    }
    catch (error) {
        functions.logger.error('Error revoking admin privileges:', error);
        throw new functions.https.HttpsError('internal', 'Failed to revoke admin privileges');
    }
}
/**
 * Verify user token and extract claims
 */
async function verifyUserToken(idToken) {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    }
    catch (error) {
        functions.logger.error('Error verifying token:', error);
        throw new functions.https.HttpsError('unauthenticated', 'Invalid authentication token');
    }
}
/**
 * Check if user has admin privileges
 */
function isAdmin(context) {
    var _a;
    return !!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin);
}
/**
 * Check if user is verified
 */
function isVerified(context) {
    var _a;
    return !!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.verified);
}
/**
 * Get user ID from context
 */
function getUserId(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    return context.auth.uid;
}
/**
 * Update user's last login time
 */
async function updateLastLogin(uid) {
    try {
        await admin.firestore()
            .collection('users')
            .doc(uid)
            .update({
            lastLoginAt: admin.firestore.Timestamp.now()
        });
    }
    catch (error) {
        functions.logger.warn('Failed to update last login time:', error);
        // Don't throw error - this is not critical
    }
}
/**
 * Check if user can perform operation based on rate limits
 */
async function checkUserRateLimit(uid, operation, maxOperations, timeWindowMs) {
    try {
        const now = Date.now();
        const windowStart = now - timeWindowMs;
        // Query recent operations from Firestore
        const operationsQuery = await admin.firestore()
            .collection('userOperations')
            .where('uid', '==', uid)
            .where('operation', '==', operation)
            .where('timestamp', '>', windowStart)
            .count()
            .get();
        const recentOperations = operationsQuery.data().count;
        if (recentOperations >= maxOperations) {
            functions.logger.warn(`Rate limit exceeded for user ${uid}, operation: ${operation}`);
            return false;
        }
        // Log this operation
        await admin.firestore()
            .collection('userOperations')
            .add({
            uid,
            operation,
            timestamp: now,
            createdAt: admin.firestore.Timestamp.now()
        });
        return true;
    }
    catch (error) {
        functions.logger.error('Error checking rate limit:', error);
        // Allow operation if rate limit check fails
        return true;
    }
}
//# sourceMappingURL=auth.js.map