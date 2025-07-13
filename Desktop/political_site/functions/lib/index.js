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
exports.checkMigrationStatusFunction = exports.migrateYamagataDataFunction = exports.setUserClaims = exports.healthCheck = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
// Basic health check endpoint
exports.healthCheck = functions
    .region('asia-northeast1')
    .https.onRequest((req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        region: 'asia-northeast1',
        services: {
            auth: 'enabled',
            firestore: 'enabled',
            storage: 'enabled',
            functions: 'enabled'
        }
    });
});
// Auth trigger for setting custom claims
exports.setUserClaims = functions
    .region('asia-northeast1')
    .auth.user().onCreate(async (user) => {
    try {
        // Default claims for new users
        const customClaims = {
            admin: false,
            verified: false,
            createdAt: new Date().toISOString()
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
        const userData = {
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            emailVerified: user.emailVerified,
            disabled: user.disabled,
            admin: customClaims.admin,
            verified: customClaims.verified,
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
        functions.logger.info(`User ${user.uid} setup completed`);
    }
    catch (error) {
        functions.logger.error('Error setting up user:', error);
    }
});
// Simple data migration function
exports.migrateYamagataDataFunction = functions
    .region('asia-northeast1')
    .runWith({ memory: '1GB', timeoutSeconds: 300 })
    .https.onCall(async (data, context) => {
    var _a;
    // Check admin privileges
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
        throw new functions.https.HttpsError('permission-denied', 'Admin privileges required');
    }
    functions.logger.info('Starting Yamagata data migration');
    const yamagataData = [
        {
            id: 'haga',
            name: '芳賀道也',
            age: 67,
            party: '無所属',
            status: 'incumbent',
            prefecture: '山形県',
            electionType: '参議院選挙',
            electionDate: new Date('2025-07-01'),
            slogan: '人に優しい政治にズームイン',
            achievements: ['元山形放送アナウンサー', '参議院議員1期', '地域活性化プロジェクト推進'],
            color: '#3B82F6'
        },
        {
            id: 'yoshinaga',
            name: '吉永美子',
            age: 60,
            party: '立憲民主党',
            status: 'newcomer',
            prefecture: '山形県',
            electionType: '参議院選挙',
            electionDate: new Date('2025-07-01'),
            slogan: 'くらしを守る 憲法を守る 民主主義を守る',
            achievements: ['労働組合活動家', '市民活動家', '女性の権利活動'],
            color: '#10B981'
        }
    ];
    const db = admin.firestore();
    const batch = db.batch();
    yamagataData.forEach(candidate => {
        const candidateRef = db.collection('candidates').doc(candidate.id);
        const candidateData = Object.assign(Object.assign({}, candidate), { electionDate: admin.firestore.Timestamp.fromDate(candidate.electionDate), createdAt: admin.firestore.Timestamp.now(), updatedAt: admin.firestore.Timestamp.now(), migratedAt: admin.firestore.Timestamp.now(), createdBy: context.auth.uid });
        batch.set(candidateRef, candidateData);
    });
    await batch.commit();
    functions.logger.info('Yamagata data migration completed');
    return {
        success: true,
        message: `Migration completed. ${yamagataData.length} candidates migrated.`,
        candidatesCount: yamagataData.length
    };
});
// Check migration status
exports.checkMigrationStatusFunction = functions
    .region('asia-northeast1')
    .runWith({ memory: '512MB', timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    var _a;
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
        throw new functions.https.HttpsError('permission-denied', 'Admin privileges required');
    }
    const db = admin.firestore();
    const candidatesQuery = await db.collection('candidates')
        .where('prefecture', '==', '山形県')
        .where('electionType', '==', '参議院選挙')
        .get();
    const candidates = candidatesQuery.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    return {
        candidatesFound: candidates.length,
        candidates: candidates,
        isMigrationNeeded: candidates.length === 0
    };
});
//# sourceMappingURL=index.js.map