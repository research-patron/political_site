"use strict";
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
}
exports.BaseAIAnalyzer = BaseAIAnalyzer;
/**
 * Gemini AI分析サービス
 */
class GeminiAnalyzer extends BaseAIAnalyzer {
    async initialize() {
        await this.initializeApiKey('gemini-api-key');
    }
    async analyze(policyText, analysisType) {
        if (!this.apiKey) {
            await this.initialize();
        }
        // TODO: Gemini API実装
        // Placeholder実装
        console.log('Gemini analysis for:', analysisType);
        return {
            analyzer: 'gemini',
            status: 'placeholder',
            message: 'Gemini API integration pending'
        };
    }
}
exports.GeminiAnalyzer = GeminiAnalyzer;
/**
 * Claude AI分析サービス
 */
class ClaudeAnalyzer extends BaseAIAnalyzer {
    async initialize() {
        await this.initializeApiKey('claude-api-key');
    }
    async analyze(policyText, analysisType) {
        if (!this.apiKey) {
            await this.initialize();
        }
        // TODO: Claude API実装
        // Placeholder実装
        console.log('Claude analysis for:', analysisType);
        return {
            analyzer: 'claude',
            status: 'placeholder',
            message: 'Claude API integration pending'
        };
    }
}
exports.ClaudeAnalyzer = ClaudeAnalyzer;
/**
 * Perplexity AI分析サービス
 */
class PerplexityAnalyzer extends BaseAIAnalyzer {
    async initialize() {
        await this.initializeApiKey('perplexity-api-key');
    }
    async analyze(policyText, analysisType) {
        if (!this.apiKey) {
            await this.initialize();
        }
        // TODO: Perplexity API実装
        // Placeholder実装
        console.log('Perplexity analysis for:', analysisType);
        return {
            analyzer: 'perplexity',
            status: 'placeholder',
            message: 'Perplexity API integration pending'
        };
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