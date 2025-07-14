import { secretManager } from '../utils/secretManager';

/**
 * AI分析サービスの基底クラス
 * 各AI API（Gemini, Claude, Perplexity）の共通インターフェース
 */
export abstract class BaseAIAnalyzer {
  protected apiKey?: string;

  abstract analyze(policyText: string, analysisType: string): Promise<any>;
  
  /**
   * API Keyを安全に取得
   */
  protected async initializeApiKey(secretName: string): Promise<void> {
    try {
      this.apiKey = await secretManager.getSecret(secretName);
    } catch (error) {
      console.error(`Failed to initialize API key for ${secretName}:`, error);
      throw new Error(`AI service initialization failed: ${secretName}`);
    }
  }
}

/**
 * Gemini AI分析サービス
 */
export class GeminiAnalyzer extends BaseAIAnalyzer {
  async initialize(): Promise<void> {
    await this.initializeApiKey('gemini-api-key');
  }

  async analyze(policyText: string, analysisType: string): Promise<any> {
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

/**
 * Claude AI分析サービス  
 */
export class ClaudeAnalyzer extends BaseAIAnalyzer {
  async initialize(): Promise<void> {
    await this.initializeApiKey('claude-api-key');
  }

  async analyze(policyText: string, analysisType: string): Promise<any> {
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

/**
 * Perplexity AI分析サービス
 */
export class PerplexityAnalyzer extends BaseAIAnalyzer {
  async initialize(): Promise<void> {
    await this.initializeApiKey('perplexity-api-key');
  }

  async analyze(policyText: string, analysisType: string): Promise<any> {
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

/**
 * AI分析ファクトリークラス
 * 設定に基づいて適切なAI分析サービスを提供
 */
export class AIAnalyzerFactory {
  static createAnalyzer(type: 'gemini' | 'claude' | 'perplexity'): BaseAIAnalyzer {
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
  static async getAvailableAnalyzers(): Promise<string[]> {
    const secrets = await secretManager.getAISecrets();
    const available: string[] = [];

    if (secrets.geminiApiKey) available.push('gemini');
    if (secrets.claudeApiKey) available.push('claude');
    if (secrets.perplexityApiKey) available.push('perplexity');

    return available;
  }
}