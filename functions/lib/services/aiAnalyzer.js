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
exports.AIAnalyzerFactory = exports.PerplexityAnalyzer = exports.ClaudeAnalyzer = exports.GeminiAnalyzer = exports.BaseAIAnalyzer = void 0;
const secretManager_1 = require("../utils/secretManager");
/**
 * AI分析サービスの基底クラス
 * 各AI API（Gemini, Claude, Perplexity）の共通インターフェース
 */
class BaseAIAnalyzer {
    /**
     * API Keyを安全に取得
     */
    async initializeApiKey(secretName) {
        try {
            this.apiKey = await secretManager_1.secretManager.getSecret(secretName);
        }
        catch (error) {
            console.error(`Failed to initialize API key for ${secretName}:`, error);
            throw new Error(`AI service initialization failed: ${secretName}`);
        }
    }
    /**
     * 政策分析用のプロンプト生成
     */
    generateAnalysisPrompt(policyText, analysisType) {
        const basePrompt = `
あなたは政治政策の専門分析者です。以下の政策内容を4つの観点から詳細に評価してください：

## 分析対象
${policyText}

## 評価観点
1. **技術的実現可能性** (0-100点)
   - 現在の技術レベルでの実現可能性
   - 必要な技術的インフラ
   - 技術的課題と解決策

2. **政治的実現可能性** (0-100点)
   - 政治的合意の形成しやすさ
   - 利害関係者の調整
   - 法的・制度的な障壁

3. **財政的実現可能性** (0-100点)
   - 必要な予算規模の推定
   - 財源確保の方法
   - 費用対効果

4. **時間軸での実現可能性** (0-100点)
   - 短期・中期・長期での実現可能性
   - 段階的実施の可能性
   - タイムライン設定の妥当性

## 出力形式
JSON形式で以下の構造で回答してください：
{
  "summary": "政策の概要と総合評価（200文字以内）",
  "technicalScore": 数値,
  "politicalScore": 数値,
  "financialScore": 数値,
  "timelineScore": 数値,
  "overallScore": 平均スコア,
  "category": "政策カテゴリ（経済政策/社会保障/教育/環境/外交・安全保障/その他）",
  "impact": "high/medium/low",
  "timeframe": "短期（1-2年）/中期（3-5年）/長期（5年以上）",
  "details": {
    "technical": "技術的分析詳細",
    "political": "政治的分析詳細", 
    "financial": "財政的分析詳細",
    "timeline": "時間軸分析詳細"
  },
  "recommendations": ["改善提案1", "改善提案2", "改善提案3"]
}
`;
        return basePrompt;
    }
}
exports.BaseAIAnalyzer = BaseAIAnalyzer;
/**
 * Gemini AI分析サービス (2025最新仕様)
 */
class GeminiAnalyzer extends BaseAIAnalyzer {
    async initialize() {
        await this.initializeApiKey('gemini-api-key');
        // Import Google GenAI SDK
        const { GoogleGenAI } = await Promise.resolve().then(() => __importStar(require('@google/genai')));
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
    async analyze(policyText, analysisType) {
        if (!this.client) {
            await this.initialize();
        }
        try {
            const prompt = this.generateAnalysisPrompt(policyText, analysisType);
            const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash-preview' });
            const response = await model.generateContent({
                contents: [{
                        role: 'user',
                        parts: [{
                                text: prompt
                            }]
                    }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 32,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            });
            const analysisText = response.response.text();
            // JSONレスポンスをパース
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from Gemini');
            }
            const analysisResult = JSON.parse(jsonMatch[0]);
            return {
                analyzer: 'gemini',
                model: 'gemini-2.5-flash-preview',
                status: 'success',
                timestamp: new Date().toISOString(),
                result: analysisResult,
                rawResponse: analysisText
            };
        }
        catch (error) {
            console.error('Gemini analysis error:', error);
            return {
                analyzer: 'gemini',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
}
exports.GeminiAnalyzer = GeminiAnalyzer;
/**
 * Claude AI分析サービス (2025最新仕様)
 */
class ClaudeAnalyzer extends BaseAIAnalyzer {
    async initialize() {
        await this.initializeApiKey('claude-api-key');
        // Import Anthropic SDK
        const Anthropic = await Promise.resolve().then(() => __importStar(require('@anthropic-ai/sdk')));
        this.client = new Anthropic.default({
            apiKey: this.apiKey,
        });
    }
    async analyze(policyText, analysisType) {
        if (!this.client) {
            await this.initialize();
        }
        try {
            const prompt = this.generateAnalysisPrompt(policyText, analysisType);
            const response = await this.client.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2048,
                temperature: 0.3,
                messages: [{
                        role: 'user',
                        content: prompt
                    }]
            });
            const analysisText = response.content[0].text;
            // JSONレスポンスをパース
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from Claude');
            }
            const analysisResult = JSON.parse(jsonMatch[0]);
            return {
                analyzer: 'claude',
                model: 'claude-sonnet-4-20250514',
                status: 'success',
                timestamp: new Date().toISOString(),
                result: analysisResult,
                rawResponse: analysisText,
                usage: {
                    inputTokens: response.usage.input_tokens,
                    outputTokens: response.usage.output_tokens
                }
            };
        }
        catch (error) {
            console.error('Claude analysis error:', error);
            return {
                analyzer: 'claude',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
}
exports.ClaudeAnalyzer = ClaudeAnalyzer;
/**
 * Perplexity AI分析サービス (2025最新仕様 - リアルタイム検索付き)
 */
class PerplexityAnalyzer extends BaseAIAnalyzer {
    constructor() {
        super(...arguments);
        this.baseUrl = 'https://api.perplexity.ai/chat/completions';
    }
    async initialize() {
        await this.initializeApiKey('perplexity-api-key');
    }
    async analyze(policyText, analysisType) {
        var _a, _b, _c;
        if (!this.apiKey) {
            await this.initialize();
        }
        try {
            // Perplexityは政策の最新情報も含めた分析を実行
            const enhancedPrompt = `
${this.generateAnalysisPrompt(policyText, analysisType)}

## 追加指示（Perplexity専用）
- 類似した政策の最新事例や成功・失敗例を検索して参考にしてください
- 最新の関連法案や政策動向も考慮してください
- 国内外の実施事例があれば具体的に引用してください
- 分析結果に検索で得られた最新情報のソースも含めてください
`;
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{
                            role: 'user',
                            content: enhancedPrompt
                        }],
                    temperature: 0.3,
                    max_tokens: 2048,
                    top_p: 0.95,
                    stream: false
                })
            });
            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const analysisText = data.choices[0].message.content;
            // JSONレスポンスをパース
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from Perplexity');
            }
            const analysisResult = JSON.parse(jsonMatch[0]);
            return {
                analyzer: 'perplexity',
                model: 'sonar-pro',
                status: 'success',
                timestamp: new Date().toISOString(),
                result: analysisResult,
                rawResponse: analysisText,
                usage: {
                    promptTokens: (_a = data.usage) === null || _a === void 0 ? void 0 : _a.prompt_tokens,
                    completionTokens: (_b = data.usage) === null || _b === void 0 ? void 0 : _b.completion_tokens,
                    totalTokens: (_c = data.usage) === null || _c === void 0 ? void 0 : _c.total_tokens
                },
                searchBased: true // リアルタイム検索を使用した分析
            };
        }
        catch (error) {
            console.error('Perplexity analysis error:', error);
            return {
                analyzer: 'perplexity',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
}
exports.PerplexityAnalyzer = PerplexityAnalyzer;
/**
 * AI分析ファクトリークラス
 * 設定に基づいて適切なAI分析サービスを提供
 */
class AIAnalyzerFactory {
    static createAnalyzer(type) {
        switch (type) {
            case 'gemini':
                return new GeminiAnalyzer();
            case 'claude':
                return new ClaudeAnalyzer();
            case 'perplexity':
                return new PerplexityAnalyzer();
            default:
                throw new Error(`Unsupported AI analyzer type: ${type}`);
        }
    }
    /**
     * 利用可能なAI分析サービスを取得
     */
    static async getAvailableAnalyzers() {
        const secrets = await secretManager_1.secretManager.getAISecrets();
        const available = [];
        if (secrets.geminiApiKey)
            available.push('gemini');
        if (secrets.claudeApiKey)
            available.push('claude');
        if (secrets.perplexityApiKey)
            available.push('perplexity');
        return available;
    }
}
exports.AIAnalyzerFactory = AIAnalyzerFactory;
//# sourceMappingURL=aiAnalyzer.js.map