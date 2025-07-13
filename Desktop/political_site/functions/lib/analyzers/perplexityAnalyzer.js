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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerplexityAnalyzer = void 0;
const axios_1 = __importDefault(require("axios"));
const functions = __importStar(require("firebase-functions"));
const aiAnalyzer_1 = require("./aiAnalyzer");
class PerplexityAnalyzer extends aiAnalyzer_1.AIAnalyzer {
    constructor(apiKey) {
        super('perplexity-sonar', apiKey);
        this.baseURL = 'https://api.perplexity.ai';
        this.checkApiKey();
    }
    async analyzeContent(prompt) {
        var _a, _b, _c;
        const startTime = Date.now();
        try {
            functions.logger.info(`Starting Perplexity analysis for candidate: ${prompt.candidateName}`);
            // Prepare the request for Perplexity API
            const response = await axios_1.default.post(`${this.baseURL}/chat/completions`, {
                model: 'llama-3.1-sonar-large-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: prompt.systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt.userPrompt
                    }
                ],
                max_tokens: 8192,
                temperature: 0.3,
                top_p: 0.9,
                search_domain_filter: ['perplexity.ai'],
                return_citations: true,
                search_recency_filter: 'year'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60 seconds timeout
            });
            const responseData = response.data;
            if (!responseData.choices || responseData.choices.length === 0) {
                throw new Error('No response from Perplexity API');
            }
            const responseText = responseData.choices[0].message.content;
            if (!responseText || responseText.trim().length === 0) {
                throw new Error('Empty response from Perplexity API');
            }
            functions.logger.info(`Perplexity analysis completed. Response length: ${responseText.length}`);
            // Parse and validate the response
            const analysisResult = this.parseAnalysisResponse(responseText, {
                candidateName: prompt.candidateName,
                prefecture: prompt.prefecture,
                processingTime: Date.now() - startTime,
                contentLength: prompt.content.length,
                sourceUrl: '',
                citations: responseData.citations || []
            });
            // Add web search citations to references if available
            if (responseData.citations && responseData.citations.length > 0) {
                analysisResult.policies.forEach(policy => {
                    Object.values(policy.detailedEvaluation).forEach(evaluation => {
                        if (evaluation.references.length === 0) {
                            evaluation.references = responseData.citations.slice(0, 3);
                        }
                    });
                });
            }
            functions.logger.info(`Perplexity analysis successful for ${prompt.candidateName}. Found ${analysisResult.policies.length} policies`);
            return analysisResult;
        }
        catch (error) {
            functions.logger.error('Perplexity analysis error:', error);
            if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                throw new functions.https.HttpsError('failed-precondition', 'Perplexity API key is invalid or not configured');
            }
            if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 429) {
                throw new functions.https.HttpsError('resource-exhausted', 'Perplexity API rate limit exceeded. Please try again later.');
            }
            if (((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) === 400) {
                throw new functions.https.HttpsError('invalid-argument', 'Invalid request to Perplexity API');
            }
            if (error.code === 'ECONNABORTED') {
                throw new functions.https.HttpsError('deadline-exceeded', 'Perplexity API request timed out');
            }
            throw new functions.https.HttpsError('internal', `Perplexity analysis failed: ${error.message}`);
        }
    }
    /**
     * Test Perplexity API connection
     */
    async testConnection() {
        var _a;
        try {
            const response = await axios_1.default.post(`${this.baseURL}/chat/completions`, {
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                    {
                        role: 'user',
                        content: 'Hello, test connection'
                    }
                ],
                max_tokens: 10
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            return response.status === 200 && ((_a = response.data.choices) === null || _a === void 0 ? void 0 : _a.length) > 0;
        }
        catch (error) {
            functions.logger.error('Perplexity connection test failed:', error);
            return false;
        }
    }
    /**
     * Get available Perplexity models
     */
    getAvailableModels() {
        return [
            'llama-3.1-sonar-large-128k-online',
            'llama-3.1-sonar-small-128k-online',
            'llama-3.1-sonar-large-128k-chat',
            'llama-3.1-sonar-small-128k-chat',
            'llama-3.1-8b-instruct',
            'llama-3.1-70b-instruct'
        ];
    }
    /**
     * Analyze with web search enabled
     */
    async analyzeWithWebSearch(prompt, searchQuery) {
        const startTime = Date.now();
        try {
            functions.logger.info(`Starting Perplexity web search analysis for candidate: ${prompt.candidateName}`);
            // Enhance the prompt with web search instructions
            const enhancedPrompt = searchQuery
                ? `${prompt.userPrompt}\n\nWeb検索クエリ: ${searchQuery}\n最新の情報を含めて分析してください。`
                : `${prompt.userPrompt}\n\n最新の政治情報や政策動向を検索して分析に含めてください。`;
            const response = await axios_1.default.post(`${this.baseURL}/chat/completions`, {
                model: 'llama-3.1-sonar-large-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: prompt.systemPrompt
                    },
                    {
                        role: 'user',
                        content: enhancedPrompt
                    }
                ],
                max_tokens: 8192,
                temperature: 0.3,
                top_p: 0.9,
                search_domain_filter: ['gov.jp', 'go.jp', 'wikipedia.org'],
                return_citations: true,
                search_recency_filter: 'month'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 90000 // Extended timeout for web search
            });
            const responseData = response.data;
            const responseText = responseData.choices[0].message.content;
            const analysisResult = this.parseAnalysisResponse(responseText, {
                candidateName: prompt.candidateName,
                prefecture: prompt.prefecture,
                processingTime: Date.now() - startTime,
                contentLength: prompt.content.length,
                sourceUrl: '',
                citations: responseData.citations || []
            });
            functions.logger.info(`Perplexity web search analysis successful for ${prompt.candidateName}`);
            return analysisResult;
        }
        catch (error) {
            functions.logger.error('Perplexity web search analysis error:', error);
            throw new functions.https.HttpsError('internal', `Perplexity web search analysis failed: ${error.message}`);
        }
    }
    /**
     * Analyze with custom model and settings
     */
    async analyzeWithCustomModel(prompt, model = 'llama-3.1-sonar-large-128k-online', settings = {}) {
        var _a, _b;
        const startTime = Date.now();
        try {
            const requestBody = {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: prompt.systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt.userPrompt
                    }
                ],
                max_tokens: (_a = settings.maxTokens) !== null && _a !== void 0 ? _a : 8192,
                temperature: (_b = settings.temperature) !== null && _b !== void 0 ? _b : 0.3,
                top_p: 0.9
            };
            // Add search parameters if online model
            if (model.includes('online')) {
                requestBody.return_citations = true;
                if (settings.searchDomains) {
                    requestBody.search_domain_filter = settings.searchDomains;
                }
                if (settings.recencyFilter) {
                    requestBody.search_recency_filter = settings.recencyFilter;
                }
            }
            const response = await axios_1.default.post(`${this.baseURL}/chat/completions`, requestBody, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            });
            const responseData = response.data;
            const responseText = responseData.choices[0].message.content;
            return this.parseAnalysisResponse(responseText, {
                candidateName: prompt.candidateName,
                prefecture: prompt.prefecture,
                processingTime: Date.now() - startTime,
                contentLength: prompt.content.length,
                sourceUrl: '',
                citations: responseData.citations || []
            });
        }
        catch (error) {
            functions.logger.error('Perplexity custom analysis error:', error);
            throw new functions.https.HttpsError('internal', `Perplexity analysis failed: ${error.message}`);
        }
    }
    /**
     * Estimate token count for content
     */
    async estimateTokens(content) {
        try {
            // Perplexity doesn't have a direct token counting API
            // Use approximation similar to other models
            const japaneseChars = (content.match(/[ひらがなカタカナ漢字]/g) || []).length;
            const otherChars = content.length - japaneseChars;
            return Math.ceil((japaneseChars / 2.5) + (otherChars / 3.5));
        }
        catch (error) {
            functions.logger.warn('Token estimation failed:', error);
            return Math.ceil(content.length / 3);
        }
    }
}
exports.PerplexityAnalyzer = PerplexityAnalyzer;
//# sourceMappingURL=perplexityAnalyzer.js.map