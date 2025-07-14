"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.getAvailableAnalyzers = exports.analyzePolicy = exports.helloWorld = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const app_1 = require("firebase-admin/app");
const aiAnalyzer_1 = require("./services/aiAnalyzer");
// Global settings
(0, v2_1.setGlobalOptions)({
    region: 'asia-northeast1', // Tokyo region
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: '512MiB'
});
// Initialize Firebase Admin
(0, app_1.initializeApp)();
/**
 * Hello World function for testing
 */
exports.helloWorld = (0, https_1.onRequest)(async (req, res) => {
    res.json({
        message: 'Political Site Platform Functions are running!',
        timestamp: new Date().toISOString(),
        region: 'asia-northeast1'
    });
});
/**
 * AI分析用Cloud Function（基盤）
 * TODO: 実際のAI分析ロジック実装
 */
exports.analyzePolicy = (0, https_1.onCall)({
    cors: true,
    enforceAppCheck: false, // 開発中はfalse、本番ではtrue
}, async (request) => {
    try {
        const { policyText, analysisType, aiProvider = 'gemini' } = request.data;
        // 入力バリデーション
        if (!policyText || !analysisType) {
            throw new Error('policyText and analysisType are required');
        }
        console.log(`Starting ${analysisType} analysis with ${aiProvider}`);
        // AI分析サービス選択
        const analyzer = aiAnalyzer_1.AIAnalyzerFactory.createAnalyzer(aiProvider);
        // 分析実行（現在はplaceholder）
        const result = await analyzer.analyze(policyText, analysisType);
        return {
            success: true,
            result,
            analysisType,
            aiProvider,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Policy analysis failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
});
/**
 * 利用可能なAI分析サービス一覧取得
 */
exports.getAvailableAnalyzers = (0, https_1.onCall)(async () => {
    try {
        const available = await aiAnalyzer_1.AIAnalyzerFactory.getAvailableAnalyzers();
        return {
            success: true,
            analyzers: available,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Failed to get available analyzers:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            analyzers: [],
            timestamp: new Date().toISOString()
        };
    }
});
/**
 * Health Check function
 */
exports.healthCheck = (0, https_1.onRequest)(async (req, res) => {
    try {
        // Secret Manager接続テスト
        const availableAnalyzers = await aiAnalyzer_1.AIAnalyzerFactory.getAvailableAnalyzers();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                secretManager: 'connected',
                firebaseAdmin: 'connected',
                availableAnalyzers: availableAnalyzers.length
            }
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
//# sourceMappingURL=index.js.map