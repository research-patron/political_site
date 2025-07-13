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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeAnalyzer = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const functions = __importStar(require("firebase-functions"));
const aiAnalyzer_1 = require("./aiAnalyzer");
class ClaudeAnalyzer extends aiAnalyzer_1.AIAnalyzer {
    constructor(apiKey) {
        super('claude-4.0-sonnet', apiKey);
        this.checkApiKey();
        this.anthropic = new sdk_1.default({
            apiKey: apiKey,
        });
    }
    async analyzeContent(prompt) {
        const startTime = Date.now();
        try {
            functions.logger.info(`Starting Claude analysis for candidate: ${prompt.candidateName}`);
            // Prepare messages for Claude
            const messages = [
                {
                    role: 'user',
                    content: `${prompt.systemPrompt}\n\n${prompt.userPrompt}`
                }
            ];
            // Call Claude API
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 8192,
                temperature: 0.3,
                messages: messages
            });
            // Extract text from response
            let responseText = '';
            for (const content of response.content) {
                if (content.type === 'text') {
                    responseText += content.text;
                }
            }
            if (!responseText || responseText.trim().length === 0) {
                throw new Error('Empty response from Claude API');
            }
            functions.logger.info(`Claude analysis completed. Response length: ${responseText.length}`);
            // Parse and validate the response
            const analysisResult = this.parseAnalysisResponse(responseText, {
                candidateName: prompt.candidateName,
                prefecture: prompt.prefecture,
                processingTime: Date.now() - startTime,
                contentLength: prompt.content.length,
                sourceUrl: ''
            });
            functions.logger.info(`Claude analysis successful for ${prompt.candidateName}. Found ${analysisResult.policies.length} policies`);
            return analysisResult;
        }
        catch (error) {
            functions.logger.error('Claude analysis error:', error);
            if (error.status === 401) {
                throw new functions.https.HttpsError('failed-precondition', 'Claude API key is invalid or not configured');
            }
            if (error.status === 429) {
                throw new functions.https.HttpsError('resource-exhausted', 'Claude API rate limit exceeded. Please try again later.');
            }
            if (error.status === 400) {
                throw new functions.https.HttpsError('invalid-argument', 'Invalid request to Claude API');
            }
            throw new functions.https.HttpsError('internal', `Claude analysis failed: ${error.message}`);
        }
    }
    /**
     * Test Claude API connection
     */
    async testConnection() {
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 10,
                messages: [
                    {
                        role: 'user',
                        content: 'Hello'
                    }
                ]
            });
            return response.content.length > 0;
        }
        catch (error) {
            functions.logger.error('Claude connection test failed:', error);
            return false;
        }
    }
    /**
     * Get available Claude models
     */
    getAvailableModels() {
        return [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];
    }
    /**
     * Analyze content with streaming response
     */
    async analyzeWithStreaming(prompt, onChunk) {
        var _a, e_1, _b, _c;
        const startTime = Date.now();
        try {
            functions.logger.info(`Starting Claude streaming analysis for candidate: ${prompt.candidateName}`);
            const messages = [
                {
                    role: 'user',
                    content: `${prompt.systemPrompt}\n\n${prompt.userPrompt}`
                }
            ];
            const stream = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 8192,
                temperature: 0.3,
                messages: messages,
                stream: true
            });
            let fullResponse = '';
            try {
                for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = await stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                    _c = stream_1_1.value;
                    _d = false;
                    const chunk = _c;
                    if (chunk.type === 'content_block_delta') {
                        if (chunk.delta.type === 'text_delta') {
                            const text = chunk.delta.text;
                            fullResponse += text;
                            if (onChunk) {
                                onChunk(text);
                            }
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = stream_1.return)) await _b.call(stream_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (!fullResponse || fullResponse.trim().length === 0) {
                throw new Error('Empty response from Claude streaming API');
            }
            // Parse and validate the response
            const analysisResult = this.parseAnalysisResponse(fullResponse, {
                candidateName: prompt.candidateName,
                prefecture: prompt.prefecture,
                processingTime: Date.now() - startTime,
                contentLength: prompt.content.length,
                sourceUrl: ''
            });
            functions.logger.info(`Claude streaming analysis successful for ${prompt.candidateName}`);
            return analysisResult;
        }
        catch (error) {
            functions.logger.error('Claude streaming analysis error:', error);
            throw new functions.https.HttpsError('internal', `Claude streaming analysis failed: ${error.message}`);
        }
    }
    /**
     * Estimate token count for content
     */
    async estimateTokens(content) {
        try {
            // Claude doesn't have a direct token counting API
            // Use approximation: ~3.5 characters per token for English, ~2.5 for Japanese
            const japaneseChars = (content.match(/[ひらがなカタカナ漢字]/g) || []).length;
            const otherChars = content.length - japaneseChars;
            return Math.ceil((japaneseChars / 2.5) + (otherChars / 3.5));
        }
        catch (error) {
            functions.logger.warn('Token estimation failed:', error);
            return Math.ceil(content.length / 3);
        }
    }
    /**
     * Analyze content with custom model and settings
     */
    async analyzeWithCustomModel(prompt, model = 'claude-3-5-sonnet-20241022', settings = {}) {
        var _a, _b;
        const startTime = Date.now();
        try {
            const messages = [
                {
                    role: 'user',
                    content: `${prompt.systemPrompt}\n\n${prompt.userPrompt}`
                }
            ];
            const response = await this.anthropic.messages.create({
                model: model,
                max_tokens: (_a = settings.maxTokens) !== null && _a !== void 0 ? _a : 8192,
                temperature: (_b = settings.temperature) !== null && _b !== void 0 ? _b : 0.3,
                messages: messages
            });
            let responseText = '';
            for (const content of response.content) {
                if (content.type === 'text') {
                    responseText += content.text;
                }
            }
            return this.parseAnalysisResponse(responseText, {
                candidateName: prompt.candidateName,
                prefecture: prompt.prefecture,
                processingTime: Date.now() - startTime,
                contentLength: prompt.content.length,
                sourceUrl: ''
            });
        }
        catch (error) {
            functions.logger.error('Claude custom analysis error:', error);
            throw new functions.https.HttpsError('internal', `Claude analysis failed: ${error.message}`);
        }
    }
}
exports.ClaudeAnalyzer = ClaudeAnalyzer;
//# sourceMappingURL=claudeAnalyzer.js.map