import { onRequest, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { AIAnalyzerFactory } from './services/aiAnalyzer';
import { URLScraper } from './scrapers/urlScraper';

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
 * URL スクレイピング用Cloud Function (2025最新実装)
 */
export const scrapeUrl = onRequest({
  cors: true,
  timeoutSeconds: 120,
  memory: '1GiB'
}, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { url } = req.body;
    
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // URLの妥当性チェック
    if (!URLScraper.isValidURL(url) || !URLScraper.isAllowedDomain(url)) {
      res.status(400).json({ error: 'Invalid or blocked URL' });
      return;
    }

    console.log(`Scraping URL: ${url}`);

    // スクレイピング実行
    const scrapedContent = await URLScraper.scrapeURL(url);
    
    res.status(200).json({
      success: true,
      content: scrapedContent.content,
      title: scrapedContent.title,
      extractedPolicies: scrapedContent.extractedPolicies,
      candidateInfo: scrapedContent.candidateInfo,
      metadata: scrapedContent.metadata,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('URL scraping error:', error);
    res.status(500).json({
      error: 'Scraping failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * AI政策分析用Cloud Function (2025最新実装)
 */
export const analyzePolicies = onRequest({
  cors: true,
  timeoutSeconds: 300,
  memory: '1GiB'
}, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { content, analysisType = 'policy-evaluation', analyzer = 'gemini' } = req.body;

    // 入力バリデーション
    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    if (!['gemini', 'claude', 'perplexity'].includes(analyzer)) {
      res.status(400).json({ error: 'Invalid analyzer type' });
      return;
    }

    console.log(`Starting policy analysis with ${analyzer}`);

    // AI分析サービス選択
    const aiService = AIAnalyzerFactory.createAnalyzer(analyzer);
    
    // 分析実行
    const analysisResult = await aiService.analyze(content, analysisType);
    
    if (analysisResult.status === 'error') {
      res.status(500).json({
        error: 'Analysis failed',
        details: analysisResult.error,
        analyzer
      });
      return;
    }

    // 結果を整形
    const policies = analysisResult.result ? [analysisResult.result] : [];
    
    // 候補者名を推定（コンテンツから）
    const candidateName = extractCandidateName(content);

    res.status(200).json({
      success: true,
      analyzer,
      model: analysisResult.model,
      candidateName,
      policies,
      summary: analysisResult.result?.summary || '政策分析が完了しました',
      timestamp: new Date().toISOString(),
      usage: analysisResult.usage,
      searchBased: analysisResult.searchBased || false
    });

  } catch (error) {
    console.error('Policy analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 旧API（下位互換性維持）
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
    
    // 分析実行
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

/**
 * コンテンツから候補者名を抽出するヘルパー関数
 */
function extractCandidateName(content: string): string | undefined {
  const namePatterns = [
    /([^\s]+\s+[^\s]+).*候補/,
    /([^\s]+\s+[^\s]+).*議員/,
    /([^\s]+\s+[^\s]+).*代表/
  ];
  
  for (const pattern of namePatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return undefined;
}