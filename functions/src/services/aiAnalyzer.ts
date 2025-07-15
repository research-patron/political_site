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

  /**
   * 政策分析用のプロンプト生成
   */
  protected generateAnalysisPrompt(policyText: string, analysisType: string): string {
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

/**
 * Gemini AI分析サービス (2025最新仕様)
 */
export class GeminiAnalyzer extends BaseAIAnalyzer {
  private client: any;

  async initialize(): Promise<void> {
    await this.initializeApiKey('gemini-api-key');
    
    // Import Google GenAI SDK
    const { GoogleGenAI } = await import('@google/genai');
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async analyze(policyText: string, analysisType: string): Promise<any> {
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

    } catch (error) {
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

/**
 * Claude AI分析サービス (2025最新仕様)
 */
export class ClaudeAnalyzer extends BaseAIAnalyzer {
  private client: any;

  async initialize(): Promise<void> {
    await this.initializeApiKey('claude-api-key');
    
    // Import Anthropic SDK
    const Anthropic = await import('@anthropic-ai/sdk');
    this.client = new Anthropic.default({
      apiKey: this.apiKey,
    });
  }

  async analyze(policyText: string, analysisType: string): Promise<any> {
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

    } catch (error) {
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

/**
 * Perplexity AI分析サービス (2025最新仕様 - リアルタイム検索付き)
 */
export class PerplexityAnalyzer extends BaseAIAnalyzer {
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  async initialize(): Promise<void> {
    await this.initializeApiKey('perplexity-api-key');
  }

  async analyze(policyText: string, analysisType: string): Promise<any> {
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
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        },
        searchBased: true // リアルタイム検索を使用した分析
      };

    } catch (error) {
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