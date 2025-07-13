import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Basic health check endpoint
export const healthCheck = functions
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
export const setUserClaims = functions
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
    } catch (error) {
      functions.logger.error('Error setting up user:', error);
    }
  });

// Simple data migration function
export const migrateYamagataDataFunction = functions
  .region('asia-northeast1')
  .runWith({ memory: '1GB', timeoutSeconds: 300 })
  .https.onCall(async (data, context) => {
    // Check admin privileges
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin privileges required'
      );
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
      const candidateData = {
        ...candidate,
        electionDate: admin.firestore.Timestamp.fromDate(candidate.electionDate),
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        migratedAt: admin.firestore.Timestamp.now(),
        createdBy: context.auth!.uid
      };
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
export const checkMigrationStatusFunction = functions
  .region('asia-northeast1')
  .runWith({ memory: '512MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin privileges required'
      );
    }

    const db = admin.firestore();
    const candidatesQuery = await db.collection('candidates')
      .where('prefecture', '==', '山形県')
      .where('electionType', '==', '参議院選挙')
      .get();

    const candidates = candidatesQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      candidatesFound: candidates.length,
      candidates: candidates,
      isMigrationNeeded: candidates.length === 0
    };
  });