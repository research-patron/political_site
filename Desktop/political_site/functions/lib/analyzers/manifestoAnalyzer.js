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
exports.testAIConnections = exports.getAnalysisHistory = exports.analyzeManifestoUrl = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const requestValidator_1 = require("../validators/requestValidator");
const urlScraper_1 = require("../scrapers/urlScraper");
const geminiAnalyzer_1 = require("./geminiAnalyzer");
const claudeAnalyzer_1 = require("./claudeAnalyzer");
const perplexityAnalyzer_1 = require("./perplexityAnalyzer");
const auth_1 = require("../utils/auth");
/**
 * Cloud Function to analyze manifesto URLs
 */
const analyzeManifestoUrl = async (data, context) => {
    const startTime = Date.now();
    try {
        // Validate authentication and admin privileges
        (0, requestValidator_1.validateAdmin)(context);
        // Validate request data
        const validatedData = (0, requestValidator_1.validateRequest)(data, requestValidator_1.analyzeManifestoSchema);
        // Check rate limiting
        const userId = context.auth.uid;
        const canProceed = await (0, auth_1.checkUserRateLimit)(userId, 'manifesto-analysis', 10, 60 * 60 * 1000); // 10 per hour
        if (!canProceed) {
            throw new functions.https.HttpsError('resource-exhausted', 'Analysis rate limit exceeded. Please try again later.');
        }
        functions.logger.info(`Starting manifesto analysis for ${validatedData.candidateName}`, {
            url: validatedData.url,
            prefecture: validatedData.prefecture,
            userId: userId
        });
        // Step 1: Scrape content from URL
        const scrapedContent = await urlScraper_1.UrlScraper.scrapeUrl(validatedData.url);
        if (scrapedContent.content.length < 100) {
            throw new functions.https.HttpsError('invalid-argument', 'Scraped content is too short for meaningful analysis');
        }
        functions.logger.info(`Content scraped successfully. Length: ${scrapedContent.content.length}`);
        // Step 2: Select AI analyzer
        const analyzer = await selectAnalyzer(validatedData.aiModel || 'auto');
        // Step 3: Create analysis prompt
        const prompt = analyzer.createAnalysisPrompt(validatedData.candidateName, validatedData.prefecture, validatedData.electionType, scrapedContent.content);
        // Step 4: Perform AI analysis
        const analysisResult = await analyzer.analyzeContent(prompt);
        // Update analysis metadata
        analysisResult.analysisMetadata.sourceUrl = validatedData.url;
        analysisResult.analysisMetadata.contentLength = scrapedContent.content.length;
        // Step 5: Save to Firestore
        await saveAnalysisToFirestore(validatedData, analysisResult, scrapedContent, userId);
        // Step 6: Log successful analysis
        const totalProcessingTime = Date.now() - startTime;
        functions.logger.info(`Manifesto analysis completed successfully`, {
            candidateId: analysisResult.candidateId,
            policiesFound: analysisResult.policies.length,
            aiModel: analysisResult.analysisMetadata.aiModel,
            processingTime: totalProcessingTime
        });
        return {
            success: true,
            candidateId: analysisResult.candidateId,
            policies: analysisResult.policies,
            analysisMetadata: Object.assign(Object.assign({}, analysisResult.analysisMetadata), { processingTime: totalProcessingTime })
        };
    }
    catch (error) {
        const totalProcessingTime = Date.now() - startTime;
        functions.logger.error('Manifesto analysis failed', {
            error: error.message,
            processingTime: totalProcessingTime,
            data: data
        });
        // Re-throw functions.https.HttpsError as-is
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Wrap other errors
        throw new functions.https.HttpsError('internal', `Analysis failed: ${error.message}`);
    }
};
exports.analyzeManifestoUrl = analyzeManifestoUrl;
/**
 * Select appropriate AI analyzer based on preference and availability
 */
async function selectAnalyzer(preference) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const claudeKey = process.env.CLAUDE_API_KEY;
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    // Check availability based on API keys
    const availableAnalyzers = {};
    if (geminiKey && geminiKey !== 'your-gemini-api-key') {
        availableAnalyzers['gemini-2.5-pro'] = () => new geminiAnalyzer_1.GeminiAnalyzer(geminiKey);
    }
    if (claudeKey && claudeKey !== 'your-claude-api-key') {
        availableAnalyzers['claude-4.0-sonnet'] = () => new claudeAnalyzer_1.ClaudeAnalyzer(claudeKey);
    }
    if (perplexityKey && perplexityKey !== 'your-perplexity-api-key') {
        availableAnalyzers['perplexity'] = () => new perplexityAnalyzer_1.PerplexityAnalyzer(perplexityKey);
    }
    if (Object.keys(availableAnalyzers).length === 0) {
        throw new functions.https.HttpsError('failed-precondition', 'No AI analyzers are configured. Please set up API keys.');
    }
    // Handle specific preference
    if (preference !== 'auto' && availableAnalyzers[preference]) {
        return availableAnalyzers[preference]();
    }
    // Auto-select based on priority and availability
    const priority = ['gemini-2.5-pro', 'claude-4.0-sonnet', 'perplexity'];
    for (const model of priority) {
        if (availableAnalyzers[model]) {
            functions.logger.info(`Auto-selected AI model: ${model}`);
            return availableAnalyzers[model]();
        }
    }
    // Fallback to first available
    const firstAvailable = Object.keys(availableAnalyzers)[0];
    functions.logger.info(`Fallback to AI model: ${firstAvailable}`);
    return availableAnalyzers[firstAvailable]();
}
/**
 * Save analysis results to Firestore
 */
async function saveAnalysisToFirestore(request, analysis, scrapedContent, userId) {
    const db = admin.firestore();
    const batch = db.batch();
    try {
        // Create candidate document
        const candidateRef = db.collection('candidates').doc(analysis.candidateId);
        const candidateData = {
            id: analysis.candidateId,
            name: analysis.candidateName,
            prefecture: request.prefecture,
            electionType: request.electionType,
            electionDate: admin.firestore.Timestamp.fromDate(new Date(request.electionDate)),
            status: 'newcomer', // Default status
            party: '', // To be filled later
            age: 0, // To be filled later
            slogan: '',
            achievements: [],
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
            createdBy: userId,
            analysisSource: {
                url: request.url,
                analyzedAt: admin.firestore.Timestamp.now(),
                aiModel: analysis.analysisMetadata.aiModel,
                scrapedContentType: scrapedContent.type
            }
        };
        batch.set(candidateRef, candidateData, { merge: true });
        // Save policies as subcollection
        analysis.policies.forEach((policy, index) => {
            const policyRef = candidateRef.collection('policies').doc(`policy-${index + 1}`);
            const policyData = Object.assign(Object.assign({}, policy), { id: `policy-${index + 1}`, candidateId: analysis.candidateId, analyzedAt: admin.firestore.Timestamp.fromDate(new Date(analysis.analysisMetadata.analyzedAt)), createdAt: admin.firestore.Timestamp.now(), updatedAt: admin.firestore.Timestamp.now() });
            batch.set(policyRef, policyData);
        });
        // Save analysis log
        const analysisLogRef = db.collection('analysisLogs').doc();
        const logData = {
            candidateId: analysis.candidateId,
            userId: userId,
            sourceUrl: request.url,
            aiModel: analysis.analysisMetadata.aiModel,
            processingTime: analysis.analysisMetadata.processingTime,
            contentLength: analysis.analysisMetadata.contentLength,
            policiesCount: analysis.policies.length,
            timestamp: admin.firestore.Timestamp.now(),
            success: true
        };
        batch.set(analysisLogRef, logData);
        // Commit batch
        await batch.commit();
        functions.logger.info(`Analysis saved to Firestore for candidate: ${analysis.candidateId}`);
    }
    catch (error) {
        functions.logger.error('Error saving analysis to Firestore:', error);
        throw new functions.https.HttpsError('internal', `Failed to save analysis: ${error.message}`);
    }
}
/**
 * Get analysis history for a user
 */
const getAnalysisHistory = async (data, context) => {
    try {
        (0, requestValidator_1.validateAdmin)(context);
        const userId = context.auth.uid;
        const limit = data.limit || 10;
        const db = admin.firestore();
        const query = await db.collection('analysisLogs')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return query.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    }
    catch (error) {
        functions.logger.error('Error getting analysis history:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get analysis history');
    }
};
exports.getAnalysisHistory = getAnalysisHistory;
/**
 * Test AI analyzer connections
 */
const testAIConnections = async (data, context) => {
    try {
        (0, requestValidator_1.validateAdmin)(context);
        const results = {};
        // Test Gemini
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey && geminiKey !== 'your-gemini-api-key') {
            try {
                const gemini = new geminiAnalyzer_1.GeminiAnalyzer(geminiKey);
                results['gemini'] = await gemini.testConnection();
            }
            catch (error) {
                results['gemini'] = false;
            }
        }
        else {
            results['gemini'] = false;
        }
        // Test Claude
        const claudeKey = process.env.CLAUDE_API_KEY;
        if (claudeKey && claudeKey !== 'your-claude-api-key') {
            try {
                const claude = new claudeAnalyzer_1.ClaudeAnalyzer(claudeKey);
                results['claude'] = await claude.testConnection();
            }
            catch (error) {
                results['claude'] = false;
            }
        }
        else {
            results['claude'] = false;
        }
        // Test Perplexity
        const perplexityKey = process.env.PERPLEXITY_API_KEY;
        if (perplexityKey && perplexityKey !== 'your-perplexity-api-key') {
            try {
                const perplexity = new perplexityAnalyzer_1.PerplexityAnalyzer(perplexityKey);
                results['perplexity'] = await perplexity.testConnection();
            }
            catch (error) {
                results['perplexity'] = false;
            }
        }
        else {
            results['perplexity'] = false;
        }
        return results;
    }
    catch (error) {
        functions.logger.error('Error testing AI connections:', error);
        throw new functions.https.HttpsError('internal', 'Failed to test AI connections');
    }
};
exports.testAIConnections = testAIConnections;
//# sourceMappingURL=manifestoAnalyzer.js.map