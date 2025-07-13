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
exports.deleteUserAccount = exports.updateUserProfile = exports.processAdminRequest = exports.getAdminRequests = exports.getUserList = exports.revokeAdminPrivileges = exports.grantAdminPrivileges = exports.requestAdminPrivileges = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("./auth");
/**
 * Request admin privileges (user can request to become admin)
 */
const requestAdminPrivileges = async (data, context) => {
    try {
        (0, auth_1.validateAuth)(context);
        const userId = (0, auth_1.getUserId)(context);
        const user = await admin.auth().getUser(userId);
        // Create admin request in Firestore
        const adminRequestsRef = admin.firestore().collection('adminRequests');
        const requestData = {
            userId: userId,
            userEmail: user.email,
            userDisplayName: user.displayName,
            requestedAt: admin.firestore.Timestamp.now(),
            status: 'pending',
            processedAt: null,
            processedBy: null,
            reason: data.reason || 'No reason provided'
        };
        await adminRequestsRef.add(requestData);
        functions.logger.info(`Admin privileges requested by user ${userId}`);
        return {
            success: true,
            message: '管理者権限の申請を受け付けました。承認までしばらくお待ちください。'
        };
    }
    catch (error) {
        functions.logger.error('Error requesting admin privileges:', error);
        throw new functions.https.HttpsError('internal', 'Failed to request admin privileges');
    }
};
exports.requestAdminPrivileges = requestAdminPrivileges;
/**
 * Grant admin privileges to a user (admin only)
 */
const grantAdminPrivileges = async (data, context) => {
    try {
        (0, auth_1.validateAdmin)(context);
        const { targetUid } = data;
        const currentUserId = (0, auth_1.getUserId)(context);
        if (!targetUid) {
            throw new functions.https.HttpsError('invalid-argument', 'Target user ID is required');
        }
        // Get current claims
        const targetUser = await admin.auth().getUser(targetUid);
        const currentClaims = targetUser.customClaims || {};
        // Update claims
        const newClaims = Object.assign(Object.assign({}, currentClaims), { admin: true, verified: true, adminGrantedAt: new Date().toISOString(), adminGrantedBy: currentUserId });
        await admin.auth().setCustomUserClaims(targetUid, newClaims);
        // Update Firestore document
        await admin.firestore()
            .collection('users')
            .doc(targetUid)
            .update({
            admin: true,
            verified: true,
            updatedAt: admin.firestore.Timestamp.now()
        });
        // Update any pending admin requests
        const adminRequestsRef = admin.firestore().collection('adminRequests');
        const pendingRequests = await adminRequestsRef
            .where('userId', '==', targetUid)
            .where('status', '==', 'pending')
            .get();
        const batch = admin.firestore().batch();
        pendingRequests.docs.forEach(doc => {
            batch.update(doc.ref, {
                status: 'approved',
                processedAt: admin.firestore.Timestamp.now(),
                processedBy: currentUserId
            });
        });
        await batch.commit();
        functions.logger.info(`Admin privileges granted to user ${targetUid} by ${currentUserId}`);
        return {
            success: true,
            message: 'ユーザーに管理者権限を付与しました。'
        };
    }
    catch (error) {
        functions.logger.error('Error granting admin privileges:', error);
        throw new functions.https.HttpsError('internal', 'Failed to grant admin privileges');
    }
};
exports.grantAdminPrivileges = grantAdminPrivileges;
/**
 * Revoke admin privileges from a user (admin only)
 */
const revokeAdminPrivileges = async (data, context) => {
    try {
        (0, auth_1.validateAdmin)(context);
        const { targetUid } = data;
        const currentUserId = (0, auth_1.getUserId)(context);
        if (!targetUid) {
            throw new functions.https.HttpsError('invalid-argument', 'Target user ID is required');
        }
        // Prevent self-revocation
        if (targetUid === currentUserId) {
            throw new functions.https.HttpsError('invalid-argument', 'Cannot revoke your own admin privileges');
        }
        // Get current claims
        const targetUser = await admin.auth().getUser(targetUid);
        const currentClaims = targetUser.customClaims || {};
        // Update claims
        const newClaims = Object.assign(Object.assign({}, currentClaims), { admin: false, adminRevokedAt: new Date().toISOString(), adminRevokedBy: currentUserId });
        await admin.auth().setCustomUserClaims(targetUid, newClaims);
        // Update Firestore document
        await admin.firestore()
            .collection('users')
            .doc(targetUid)
            .update({
            admin: false,
            updatedAt: admin.firestore.Timestamp.now()
        });
        functions.logger.info(`Admin privileges revoked from user ${targetUid} by ${currentUserId}`);
        return {
            success: true,
            message: 'ユーザーから管理者権限を取り消しました。'
        };
    }
    catch (error) {
        functions.logger.error('Error revoking admin privileges:', error);
        throw new functions.https.HttpsError('internal', 'Failed to revoke admin privileges');
    }
};
exports.revokeAdminPrivileges = revokeAdminPrivileges;
/**
 * Get list of users (admin only)
 */
const getUserList = async (data, context) => {
    var _a, _b, _c, _d;
    try {
        (0, auth_1.validateAdmin)(context);
        const limit = Math.min(data.limit || 20, 100); // Max 100 users per request
        // Get users from Firebase Auth
        const listUsersResult = await admin.auth().listUsers(limit, data.nextPageToken);
        // Get user profiles from Firestore
        const userProfiles = [];
        for (const userRecord of listUsersResult.users) {
            try {
                const userDoc = await admin.firestore()
                    .collection('users')
                    .doc(userRecord.uid)
                    .get();
                const userData = userDoc.exists() ? userDoc.data() : {};
                userProfiles.push({
                    uid: userRecord.uid,
                    email: userRecord.email,
                    displayName: userRecord.displayName,
                    photoURL: userRecord.photoURL,
                    emailVerified: userRecord.emailVerified,
                    disabled: userRecord.disabled,
                    admin: ((_a = userRecord.customClaims) === null || _a === void 0 ? void 0 : _a.admin) || false,
                    verified: ((_b = userRecord.customClaims) === null || _b === void 0 ? void 0 : _b.verified) || false,
                    prefecture: (userData === null || userData === void 0 ? void 0 : userData.prefecture) || null,
                    createdAt: userRecord.metadata.creationTime,
                    lastSignInTime: userRecord.metadata.lastSignInTime,
                    lastLoginAt: (userData === null || userData === void 0 ? void 0 : userData.lastLoginAt) || null
                });
            }
            catch (error) {
                functions.logger.warn(`Error getting profile for user ${userRecord.uid}:`, error);
                // Include user record even if profile fetch fails
                userProfiles.push({
                    uid: userRecord.uid,
                    email: userRecord.email,
                    displayName: userRecord.displayName,
                    photoURL: userRecord.photoURL,
                    emailVerified: userRecord.emailVerified,
                    disabled: userRecord.disabled,
                    admin: ((_c = userRecord.customClaims) === null || _c === void 0 ? void 0 : _c.admin) || false,
                    verified: ((_d = userRecord.customClaims) === null || _d === void 0 ? void 0 : _d.verified) || false,
                    prefecture: null,
                    createdAt: userRecord.metadata.creationTime,
                    lastSignInTime: userRecord.metadata.lastSignInTime,
                    lastLoginAt: null
                });
            }
        }
        return {
            users: userProfiles,
            nextPageToken: listUsersResult.pageToken || null,
            totalCount: userProfiles.length
        };
    }
    catch (error) {
        functions.logger.error('Error getting user list:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get user list');
    }
};
exports.getUserList = getUserList;
/**
 * Get admin requests (admin only)
 */
const getAdminRequests = async (data, context) => {
    try {
        (0, auth_1.validateAdmin)(context);
        const limit = Math.min(data.limit || 20, 100);
        const status = data.status || 'pending';
        let query = admin.firestore()
            .collection('adminRequests')
            .orderBy('requestedAt', 'desc')
            .limit(limit);
        if (status !== 'all') {
            query = query.where('status', '==', status);
        }
        const snapshot = await query.get();
        const requests = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return requests;
    }
    catch (error) {
        functions.logger.error('Error getting admin requests:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get admin requests');
    }
};
exports.getAdminRequests = getAdminRequests;
/**
 * Process admin request (approve/deny) - admin only
 */
const processAdminRequest = async (data, context) => {
    try {
        (0, auth_1.validateAdmin)(context);
        const { requestId, action, reason } = data;
        const currentUserId = (0, auth_1.getUserId)(context);
        if (!requestId || !action) {
            throw new functions.https.HttpsError('invalid-argument', 'Request ID and action are required');
        }
        const requestRef = admin.firestore().collection('adminRequests').doc(requestId);
        const requestDoc = await requestRef.get();
        if (!requestDoc.exists()) {
            throw new functions.https.HttpsError('not-found', 'Admin request not found');
        }
        const requestData = requestDoc.data();
        if (requestData.status !== 'pending') {
            throw new functions.https.HttpsError('failed-precondition', 'Request has already been processed');
        }
        // Update request status
        await requestRef.update({
            status: action === 'approve' ? 'approved' : 'denied',
            processedAt: admin.firestore.Timestamp.now(),
            processedBy: currentUserId,
            processReason: reason || null
        });
        let message = '';
        if (action === 'approve') {
            // Grant admin privileges
            try {
                await (0, exports.grantAdminPrivileges)({ targetUid: requestData.userId }, context);
                message = '管理者権限申請を承認し、権限を付与しました。';
            }
            catch (error) {
                // If granting fails, update request status back to pending
                await requestRef.update({
                    status: 'pending',
                    processedAt: null,
                    processedBy: null,
                    processReason: null
                });
                throw error;
            }
        }
        else {
            message = '管理者権限申請を却下しました。';
        }
        functions.logger.info(`Admin request ${requestId} ${action}d by ${currentUserId}`);
        return {
            success: true,
            message
        };
    }
    catch (error) {
        functions.logger.error('Error processing admin request:', error);
        throw new functions.https.HttpsError('internal', 'Failed to process admin request');
    }
};
exports.processAdminRequest = processAdminRequest;
/**
 * Update user profile (users can update their own profile)
 */
const updateUserProfile = async (data, context) => {
    try {
        (0, auth_1.validateAuth)(context);
        const userId = (0, auth_1.getUserId)(context);
        const updateData = {
            updatedAt: admin.firestore.Timestamp.now()
        };
        if (data.displayName !== undefined) {
            updateData.displayName = data.displayName;
            // Also update Firebase Auth profile
            await admin.auth().updateUser(userId, {
                displayName: data.displayName
            });
        }
        if (data.prefecture !== undefined) {
            updateData.prefecture = data.prefecture;
        }
        if (data.settings !== undefined) {
            updateData.settings = data.settings;
        }
        await admin.firestore()
            .collection('users')
            .doc(userId)
            .update(updateData);
        functions.logger.info(`User profile updated for ${userId}`);
        return {
            success: true,
            message: 'プロフィールを更新しました。'
        };
    }
    catch (error) {
        functions.logger.error('Error updating user profile:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update user profile');
    }
};
exports.updateUserProfile = updateUserProfile;
/**
 * Delete user account (users can delete their own account, admins can delete any account)
 */
const deleteUserAccount = async (data, context) => {
    try {
        (0, auth_1.validateAuth)(context);
        const currentUserId = (0, auth_1.getUserId)(context);
        const targetUid = data.targetUid || currentUserId;
        // If deleting another user's account, require admin privileges
        if (targetUid !== currentUserId) {
            (0, auth_1.validateAdmin)(context);
        }
        // Delete user data from Firestore
        const batch = admin.firestore().batch();
        // Delete user profile
        batch.delete(admin.firestore().collection('users').doc(targetUid));
        // Delete user's comments
        const commentsQuery = await admin.firestore()
            .collection('comments')
            .where('userId', '==', targetUid)
            .get();
        commentsQuery.docs.forEach(doc => {
            batch.update(doc.ref, {
                text: '[削除されたユーザーのコメント]',
                userName: '[削除されたユーザー]',
                status: 'deleted'
            });
        });
        // Delete user's admin requests
        const adminRequestsQuery = await admin.firestore()
            .collection('adminRequests')
            .where('userId', '==', targetUid)
            .get();
        adminRequestsQuery.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        // Delete user from Firebase Auth
        await admin.auth().deleteUser(targetUid);
        functions.logger.info(`User account deleted: ${targetUid} by ${currentUserId}`);
        return {
            success: true,
            message: 'アカウントを削除しました。'
        };
    }
    catch (error) {
        functions.logger.error('Error deleting user account:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete user account');
    }
};
exports.deleteUserAccount = deleteUserAccount;
//# sourceMappingURL=userManagement.js.map