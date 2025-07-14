import { onRequest, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { AIAnalyzerFactory } from './services/aiAnalyzer';

// Global settings
setGlobalOptions({
  region: 'asia-northeast1', // Tokyo region
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: '512MiB'
});

// Initialize Firebase Admin
initializeApp();

/**
 * Hello World function for testing
 */
export const helloWorld = onRequest(async (req, res) => {
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
export const analyzePolicy = onCall<{
  policyText: string;
  analysisType: 'technical' | 'political' | 'financial' | 'timeline';
  aiProvider?: 'gemini' | 'claude' | 'perplexity';
}>({
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
    const analyzer = AIAnalyzerFactory.createAnalyzer(aiProvider);
    
    // 分析実行（現在はplaceholder）
    const result = await analyzer.analyze(policyText, analysisType);

    return {
      success: true,
      result,
      analysisType,
      aiProvider,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
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
export const getAvailableAnalyzers = onCall(async () => {
  try {
    const available = await AIAnalyzerFactory.getAvailableAnalyzers();
    
    return {
      success: true,
      analyzers: available,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
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
export const healthCheck = onRequest(async (req, res) => {
  try {
    // Secret Manager接続テスト
    const availableAnalyzers = await AIAnalyzerFactory.getAvailableAnalyzers();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        secretManager: 'connected',
        firebaseAdmin: 'connected',
        availableAnalyzers: availableAnalyzers.length
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});