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
exports.AIAnalyzer = void 0;
const functions = __importStar(require("firebase-functions"));
class AIAnalyzer {
    constructor(modelName, apiKey) {
        this.modelName = modelName;
        this.apiKey = apiKey;
    }
    /**
     * Create analysis prompt for policy evaluation
     */
    createAnalysisPrompt(candidateName, prefecture, electionType, content) {
        const systemPrompt = `あなたは政治政策分析の専門家です。候補者の公約や政策を客観的に分析し、実現可能性を評価してください。

分析の観点：
1. 技術的実現性（40%）: 政策実施に必要な技術的要件、既存制度の活用可能性
2. 政治的実現性（35%）: 政治的合意形成の可能性、利害関係者の反応
3. 財政的実現性（25%）: 必要予算、財源確保の現実性
4. 実施期間評価: 実際の実施に要する期間の見積もり

各評価は0-100点のスコアと詳細な分析レポートを提供してください。
レポートは500文字程度で、具体的な根拠と参考資料を含めてください。`;
        const userPrompt = `
候補者名: ${candidateName}
選挙区: ${prefecture}
選挙種別: ${electionType}

以下のコンテンツから候補者の主要政策を抽出し、それぞれについて多次元評価を行ってください：

${content}

回答形式：
各政策について以下のJSON形式で分析結果を返してください：

{
  "policies": [
    {
      "title": "政策名",
      "category": "economy|education|agriculture|healthcare|environment|labor|social",
      "description": "政策の簡潔な説明（100文字以内）",
      "feasibilityScore": 0-100の総合実現可能性スコア,
      "impact": "high|medium|low",
      "detailedEvaluation": {
        "technical": {
          "score": 0-100,
          "summary": "技術的実現性の要約（50文字以内）",
          "report": "詳細分析レポート（500文字程度）",
          "references": ["参考資料1", "参考資料2"],
          "searchKeywords": ["検索キーワード1", "検索キーワード2"]
        },
        "political": {
          "score": 0-100,
          "summary": "政治的実現性の要約（50文字以内）",
          "report": "詳細分析レポート（500文字程度）",
          "references": ["参考資料1", "参考資料2"],
          "searchKeywords": ["検索キーワード1", "検索キーワード2"]
        },
        "financial": {
          "score": 0-100,
          "summary": "財政的実現性の要約（50文字以内）",
          "report": "詳細分析レポート（500文字程度）",
          "references": ["参考資料1", "参考資料2"],
          "searchKeywords": ["検索キーワード1", "検索キーワード2"]
        },
        "timeline": {
          "score": 0-100,
          "summary": "実施期間の要約（50文字以内）",
          "report": "詳細分析レポート（500文字程度）",
          "references": ["参考資料1", "参考資料2"],
          "searchKeywords": ["検索キーワード1", "検索キーワード2"]
        }
      }
    }
  ]
}`;
        return {
            systemPrompt,
            userPrompt,
            candidateName,
            prefecture,
            electionType,
            content
        };
    }
    /**
     * Parse AI response and validate structure
     */
    parseAnalysisResponse(response, metadata) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in AI response');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            if (!parsed.policies || !Array.isArray(parsed.policies)) {
                throw new Error('Invalid response structure: policies array missing');
            }
            // Validate each policy
            const validatedPolicies = parsed.policies.map((policy, index) => {
                return this.validatePolicyStructure(policy, index);
            });
            return {
                candidateId: this.generateCandidateId(metadata.candidateName, metadata.prefecture),
                candidateName: metadata.candidateName,
                policies: validatedPolicies,
                analysisMetadata: {
                    aiModel: this.modelName,
                    analyzedAt: new Date().toISOString(),
                    processingTime: metadata.processingTime || 0,
                    contentLength: metadata.contentLength || 0,
                    sourceUrl: metadata.sourceUrl || ''
                }
            };
        }
        catch (error) {
            functions.logger.error('Error parsing AI response:', error);
            throw new functions.https.HttpsError('internal', `Failed to parse AI analysis response: ${error.message}`);
        }
    }
    /**
     * Validate policy structure
     */
    validatePolicyStructure(policy, index) {
        const requiredFields = ['title', 'category', 'description', 'feasibilityScore', 'impact', 'detailedEvaluation'];
        for (const field of requiredFields) {
            if (!(field in policy)) {
                throw new Error(`Policy ${index}: Missing required field '${field}'`);
            }
        }
        // Validate feasibilityScore
        if (typeof policy.feasibilityScore !== 'number' || policy.feasibilityScore < 0 || policy.feasibilityScore > 100) {
            policy.feasibilityScore = 50; // Default fallback
        }
        // Validate impact
        if (!['high', 'medium', 'low'].includes(policy.impact)) {
            policy.impact = 'medium'; // Default fallback
        }
        // Validate category
        const validCategories = ['economy', 'education', 'agriculture', 'healthcare', 'environment', 'labor', 'social'];
        if (!validCategories.includes(policy.category)) {
            policy.category = 'economy'; // Default fallback
        }
        // Validate detailed evaluation
        const evaluationAspects = ['technical', 'political', 'financial', 'timeline'];
        for (const aspect of evaluationAspects) {
            if (!(aspect in policy.detailedEvaluation)) {
                policy.detailedEvaluation[aspect] = this.createDefaultEvaluation();
            }
            else {
                policy.detailedEvaluation[aspect] = this.validateEvaluationDetail(policy.detailedEvaluation[aspect]);
            }
        }
        return policy;
    }
    /**
     * Create default evaluation detail
     */
    createDefaultEvaluation() {
        return {
            score: 50,
            summary: '分析データが不十分です',
            report: '詳細な分析を行うためにより多くの情報が必要です。',
            references: [],
            searchKeywords: []
        };
    }
    /**
     * Validate evaluation detail structure
     */
    validateEvaluationDetail(detail) {
        return {
            score: typeof detail.score === 'number' ? Math.max(0, Math.min(100, detail.score)) : 50,
            summary: typeof detail.summary === 'string' ? detail.summary.substring(0, 100) : '要約がありません',
            report: typeof detail.report === 'string' ? detail.report.substring(0, 1000) : 'レポートがありません',
            references: Array.isArray(detail.references) ? detail.references.slice(0, 5) : [],
            searchKeywords: Array.isArray(detail.searchKeywords) ? detail.searchKeywords.slice(0, 10) : []
        };
    }
    /**
     * Generate candidate ID from name and prefecture
     */
    generateCandidateId(name, prefecture) {
        const cleanName = name.replace(/[^a-zA-Z0-9ひらがなカタカナ漢字]/g, '');
        const cleanPrefecture = prefecture.replace(/[^a-zA-Z0-9ひらがなカタカナ漢字]/g, '');
        return `${cleanPrefecture}-${cleanName}`.toLowerCase();
    }
    /**
     * Check if API key is configured
     */
    checkApiKey() {
        if (!this.apiKey || this.apiKey === 'your-api-key' || this.apiKey.trim() === '') {
            throw new functions.https.HttpsError('failed-precondition', `${this.modelName} API key is not configured`);
        }
    }
}
exports.AIAnalyzer = AIAnalyzer;
//# sourceMappingURL=aiAnalyzer.js.map