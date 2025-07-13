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
exports.GeminiAnalyzer = void 0;
const generative_ai_1 = require("@google/generative-ai");
const functions = __importStar(require("firebase-functions"));
const aiAnalyzer_1 = require("./aiAnalyzer");
class GeminiAnalyzer extends aiAnalyzer_1.AIAnalyzer {
    constructor(apiKey) {
        super('gemini-2.5-pro', apiKey);
        this.checkApiKey();
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.5-pro",
            generationConfig: {
                temperature: 0.3,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 8192,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
            ],
        });
    }
    async analyzeContent(prompt) {
        const startTime = Date.now();
        try {
            functions.logger.info(`Starting Gemini analysis for candidate: ${prompt.candidateName}`);
            // Prepare the full prompt
            const fullPrompt = `${prompt.systemPrompt}\n\n${prompt.userPrompt}`;
            // Generate content using Gemini
            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();
            if (!text || text.trim().length === 0) {
                throw new Error('Empty response from Gemini API');
            }
            functions.logger.info(`Gemini analysis completed. Response length: ${text.length}`);
            // Parse and validate the response
            const analysisResult = this.parseAnalysisResponse(text, {
                candidateName: prompt.candidateName,
                prefecture: prompt.prefecture,
                processingTime: Date.now() - startTime,
                contentLength: prompt.content.length,
                sourceUrl: ''
            });
            functions.logger.info(`Gemini analysis successful for ${prompt.candidateName}. Found ${analysisResult.policies.length} policies`);
            return analysisResult;
        }
        catch (error) {
            functions.logger.error('Gemini analysis error:', error);
            if (error.message.includes('API key')) {
                throw new functions.https.HttpsError('failed-precondition', 'Gemini API key is invalid or not configured');
            }
            if (error.message.includes('quota')) {
                throw new functions.https.HttpsError('resource-exhausted', 'Gemini API quota exceeded. Please try again later.');
            }
            if (error.message.includes('safety')) {
                throw new functions.https.HttpsError('invalid-argument', 'Content was blocked by Gemini safety filters');
            }
            throw new functions.https.HttpsError('internal', `Gemini analysis failed: ${error.message}`);
        }
    }
    /**
     * Test Gemini API connection
     */
    async testConnection() {
        try {
            const testPrompt = "こんにちは";
            const result = await this.model.generateContent(testPrompt);
            const response = await result.response;
            return !!response.text();
        }
        catch (error) {
            functions.logger.error('Gemini connection test failed:', error);
            return false;
        }
    }
    /**
     * Get available models
     */
    async getAvailableModels() {
        try {
            // For now, return the models we know are available
            // In future, could use listModels() API if available
            return [
                'gemini-2.5-pro',
                'gemini-1.5-pro',
                'gemini-1.5-flash'
            ];
        }
        catch (error) {
            functions.logger.error('Error getting Gemini models:', error);
            return ['gemini-2.5-pro'];
        }
    }
    /**
     * Analyze content with custom model settings
     */
    async analyzeWithCustomSettings(prompt, settings) {
        var _a, _b, _c, _d;
        const customModel = this.genAI.getGenerativeModel({
            model: "gemini-2.5-pro",
            generationConfig: {
                temperature: (_a = settings.temperature) !== null && _a !== void 0 ? _a : 0.3,
                topP: (_b = settings.topP) !== null && _b !== void 0 ? _b : 0.9,
                topK: (_c = settings.topK) !== null && _c !== void 0 ? _c : 40,
                maxOutputTokens: (_d = settings.maxOutputTokens) !== null && _d !== void 0 ? _d : 8192,
            }
        });
        const startTime = Date.now();
        try {
            const fullPrompt = `${prompt.systemPrompt}\n\n${prompt.userPrompt}`;
            const result = await customModel.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();
            return this.parseAnalysisResponse(text, {
                candidateName: prompt.candidateName,
                prefecture: prompt.prefecture,
                processingTime: Date.now() - startTime,
                contentLength: prompt.content.length,
                sourceUrl: ''
            });
        }
        catch (error) {
            functions.logger.error('Gemini custom analysis error:', error);
            throw new functions.https.HttpsError('internal', `Gemini analysis failed: ${error.message}`);
        }
    }
    /**
     * Estimate token count for content
     */
    async estimateTokens(content) {
        try {
            const result = await this.model.countTokens(content);
            return result.totalTokens || 0;
        }
        catch (error) {
            functions.logger.warn('Token estimation failed:', error);
            // Rough estimation: 1 token ≈ 4 characters for Japanese
            return Math.ceil(content.length / 4);
        }
    }
}
exports.GeminiAnalyzer = GeminiAnalyzer;
//# sourceMappingURL=geminiAnalyzer.js.map