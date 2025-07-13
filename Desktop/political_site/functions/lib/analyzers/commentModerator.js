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
exports.getModerationStats = exports.moderateComment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const requestValidator_1 = require("../validators/requestValidator");
const auth_1 = require("../utils/auth");
/**
 * Cloud Function to moderate comments
 */
const moderateComment = async (data, context) => {
    try {
        // Validate authentication
        (0, requestValidator_1.validateAuth)(context);
        // Validate request data
        const validatedData = (0, requestValidator_1.validateRequest)(data, requestValidator_1.moderateCommentSchema);
        // Check rate limiting
        const userId = context.auth.uid;
        const canProceed = await (0, auth_1.checkUserRateLimit)(userId, 'comment-moderation', 100, 60 * 60 * 1000); // 100 per hour
        if (!canProceed) {
            throw new functions.https.HttpsError('resource-exhausted', 'Comment moderation rate limit exceeded. Please try again later.');
        }
        functions.logger.info(`Moderating comment from user: ${userId}`);
        // Perform moderation analysis
        const moderationResult = await analyzeComment(validatedData.text);
        // Log moderation result
        await logModerationResult(validatedData, moderationResult, userId);
        functions.logger.info(`Comment moderation completed`, {
            userId: userId,
            allowed: moderationResult.allowed,
            score: moderationResult.score
        });
        return moderationResult;
    }
    catch (error) {
        functions.logger.error('Comment moderation failed', {
            error: error.message,
            data: data
        });
        // Re-throw functions.https.HttpsError as-is
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Wrap other errors
        throw new functions.https.HttpsError('internal', `Comment moderation failed: ${error.message}`);
    }
};
exports.moderateComment = moderateComment;
/**
 * Analyze comment for inappropriate content
 */
async function analyzeComment(text) {
    const checks = [
        checkProfanity(text),
        checkSpam(text),
        checkPersonalAttacks(text),
        checkPoliticalExtremism(text),
        checkMisinformation(text),
        checkPrivacyViolation(text)
    ];
    const results = await Promise.all(checks);
    // Calculate overall score (0-100, higher is more problematic)
    const scores = results.map(r => r.score);
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const finalScore = Math.max(maxScore, avgScore * 1.2); // Weight towards worst offense
    // Collect reasons for rejection
    const reasons = results
        .filter(r => r.flagged)
        .map(r => r.reason)
        .filter(Boolean);
    // Determine if comment should be allowed
    const allowed = finalScore < 60 && reasons.length === 0;
    // Generate suggested edit if needed
    const suggestedEdit = allowed ? undefined : generateSuggestedEdit(text, results);
    return {
        allowed,
        score: Math.round(finalScore),
        reasons: reasons.length > 0 ? reasons : undefined,
        suggestedEdit
    };
}
/**
 * Check for profanity and inappropriate language
 */
async function checkProfanity(text) {
    // Japanese profanity patterns
    const profanityPatterns = [
        /バカ|馬鹿|アホ|阿呆|死ね|殺す|クソ|糞|うざい|ウザい|きもい|キモい/gi,
        /ふざけるな|舐めてる|なめてる|ムカつく|むかつく|イライラ/gi,
        /最悪|サイアク|終わってる|オワコン|ゴミ|カス|クズ/gi
    ];
    const englishProfanity = [
        /\b(damn|hell|shit|fuck|bitch|asshole|idiot|stupid|moron)\b/gi,
        /\b(shut up|go to hell|screw you|piss off)\b/gi
    ];
    let score = 0;
    let flagged = false;
    let matchCount = 0;
    // Check Japanese patterns
    for (const pattern of profanityPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            matchCount += matches.length;
            score += matches.length * 20;
            flagged = true;
        }
    }
    // Check English patterns
    for (const pattern of englishProfanity) {
        const matches = text.match(pattern);
        if (matches) {
            matchCount += matches.length;
            score += matches.length * 25;
            flagged = true;
        }
    }
    return {
        score: Math.min(score, 100),
        flagged,
        reason: flagged ? '不適切な言葉遣いが含まれています' : undefined
    };
}
/**
 * Check for spam content
 */
async function checkSpam(text) {
    let score = 0;
    let flagged = false;
    // Check for excessive repetition
    const words = text.split(/\s+/);
    const wordCounts = new Map();
    words.forEach(word => {
        const count = wordCounts.get(word) || 0;
        wordCounts.set(word, count + 1);
    });
    // Find max repetition
    const maxRepetition = Math.max(...Array.from(wordCounts.values()));
    if (maxRepetition > 5) {
        score += (maxRepetition - 5) * 10;
        flagged = true;
    }
    // Check for URL patterns (basic)
    const urlMatches = text.match(/https?:\/\/[^\s]+/gi);
    if (urlMatches && urlMatches.length > 2) {
        score += urlMatches.length * 15;
        flagged = true;
    }
    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.5 && text.length > 20) {
        score += 30;
        flagged = true;
    }
    // Check for promotional content
    const promoPatterns = [
        /買って|購入|セール|割引|特価|無料|プレゼント|当選/gi,
        /今すぐ|急いで|限定|期間限定|お得|安い|最安/gi,
        /登録|会員|メルマガ|LINE|友達追加/gi
    ];
    for (const pattern of promoPatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 1) {
            score += matches.length * 10;
            flagged = true;
        }
    }
    return {
        score: Math.min(score, 100),
        flagged,
        reason: flagged ? 'スパムまたは宣伝的な内容が含まれています' : undefined
    };
}
/**
 * Check for personal attacks
 */
async function checkPersonalAttacks(text) {
    let score = 0;
    let flagged = false;
    // Patterns for personal attacks
    const attackPatterns = [
        /あいつ|こいつ|そいつ|お前|てめえ|貴様/gi,
        /〜は嘘つき|〜は詐欺師|〜は犯罪者|〜は無能/gi,
        /〜を信じるな|〜は危険|〜は敵/gi,
        /〜の顔|〜の見た目|〜のスタイル/gi
    ];
    for (const pattern of attackPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            score += matches.length * 25;
            flagged = true;
        }
    }
    // Check for discriminatory language
    const discriminationPatterns = [
        /老害|ゆとり世代|さとり世代|氷河期世代/gi,
        /男のくせに|女のくせに|〜人のくせに/gi,
        /田舎者|都会人|地方の人/gi
    ];
    for (const pattern of discriminationPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            score += matches.length * 30;
            flagged = true;
        }
    }
    return {
        score: Math.min(score, 100),
        flagged,
        reason: flagged ? '個人攻撃や差別的な表現が含まれています' : undefined
    };
}
/**
 * Check for political extremism
 */
async function checkPoliticalExtremism(text) {
    let score = 0;
    let flagged = false;
    // Extreme political language
    const extremismPatterns = [
        /革命|暴動|テロ|爆破|破壊活動/gi,
        /〜を倒せ|〜を滅ぼせ|〜を消せ/gi,
        /独裁|ファシズム|共産主義の脅威|売国奴/gi,
        /在日|朝鮮人|中国人.*帰れ|韓国人.*出て行け/gi
    ];
    for (const pattern of extremismPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            score += matches.length * 40;
            flagged = true;
        }
    }
    // Conspiracy theories
    const conspiracyPatterns = [
        /陰謀|隠蔽|工作員|洗脳|マインドコントロール/gi,
        /フェイクニュース|偏向報道|マスゴミ/gi,
        /裏で操っている|真実を隠している/gi
    ];
    for (const pattern of conspiracyPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            score += matches.length * 20;
            flagged = true;
        }
    }
    return {
        score: Math.min(score, 100),
        flagged,
        reason: flagged ? '過激な政治的表現が含まれています' : undefined
    };
}
/**
 * Check for misinformation
 */
async function checkMisinformation(text) {
    let score = 0;
    let flagged = false;
    // Patterns suggesting misinformation
    const misinfoPatterns = [
        /絶対に|100%|間違いなく|確実に.*証拠もなく/gi,
        /〜という事実|真実は|本当は.*根拠なし/gi,
        /メディアが隠している|政府が隠蔽/gi,
        /専門家は嘘|医者は嘘|科学者は嘘/gi
    ];
    for (const pattern of misinfoPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            score += matches.length * 25;
            flagged = true;
        }
    }
    // Check for unsubstantiated claims
    const claimIndicators = ['〜は危険', '〜で死ぬ', '〜で病気になる', '〜は効果ない'];
    for (const indicator of claimIndicators) {
        if (text.includes(indicator) && !text.includes('研究') && !text.includes('データ')) {
            score += 15;
            flagged = true;
        }
    }
    return {
        score: Math.min(score, 100),
        flagged,
        reason: flagged ? '根拠不明な情報や誤情報の可能性があります' : undefined
    };
}
/**
 * Check for privacy violations
 */
async function checkPrivacyViolation(text) {
    let score = 0;
    let flagged = false;
    // Personal information patterns
    const privateInfoPatterns = [
        /\d{3}-\d{4}-\d{4}/, // Phone numbers
        /\d{7}-\d{4}-\d{4}/, // Phone numbers
        /\w+@\w+\.\w+/, // Email addresses
        /〒\d{3}-\d{4}/, // Postal codes
        /\d{4}年\d{1,2}月\d{1,2}日生まれ/, // Birth dates
    ];
    for (const pattern of privateInfoPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            score += matches.length * 50;
            flagged = true;
        }
    }
    // Check for address information
    const addressPatterns = [
        /東京都.*区.*番地/,
        /大阪府.*市.*町/,
        /〜県〜市〜町\d/,
        /マンション.*号室/
    ];
    for (const pattern of addressPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            score += matches.length * 40;
            flagged = true;
        }
    }
    return {
        score: Math.min(score, 100),
        flagged,
        reason: flagged ? '個人情報が含まれている可能性があります' : undefined
    };
}
/**
 * Generate suggested edit for problematic content
 */
function generateSuggestedEdit(text, results) {
    let editedText = text;
    // Remove profanity
    const profanityPatterns = [
        /バカ|馬鹿|アホ|阿呆/gi,
        /クソ|糞/gi,
        /うざい|ウザい|きもい|キモい/gi
    ];
    for (const pattern of profanityPatterns) {
        editedText = editedText.replace(pattern, '[不適切な表現]');
    }
    // Remove personal attacks
    editedText = editedText.replace(/あいつ|こいつ|そいつ/gi, 'その人');
    editedText = editedText.replace(/お前|てめえ|貴様/gi, 'あなた');
    // Remove extreme expressions
    editedText = editedText.replace(/絶対に|100%|間違いなく/gi, 'おそらく');
    editedText = editedText.replace(/〜を倒せ|〜を滅ぼせ/gi, '〜に反対');
    return editedText !== text ? editedText : '';
}
/**
 * Log moderation result
 */
async function logModerationResult(request, result, userId) {
    try {
        const db = admin.firestore();
        const logData = {
            userId: userId,
            originalText: request.text,
            candidateId: request.candidateId || null,
            policyId: request.policyId || null,
            moderationResult: {
                allowed: result.allowed,
                score: result.score,
                reasons: result.reasons || [],
                suggestedEdit: result.suggestedEdit || null
            },
            timestamp: admin.firestore.Timestamp.now()
        };
        await db.collection('moderationLogs').add(logData);
    }
    catch (error) {
        functions.logger.warn('Failed to log moderation result:', error);
        // Don't throw error - logging failure shouldn't break the flow
    }
}
/**
 * Get moderation statistics (admin only)
 */
const getModerationStats = async (data, context) => {
    var _a;
    try {
        // Validate admin privileges
        if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
            throw new functions.https.HttpsError('permission-denied', 'Admin privileges required');
        }
        const db = admin.firestore();
        let query = db.collection('moderationLogs');
        // Add date filters if provided
        if (data.startDate) {
            query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(new Date(data.startDate)));
        }
        if (data.endDate) {
            query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(new Date(data.endDate)));
        }
        const snapshot = await query.get();
        const stats = {
            totalComments: snapshot.size,
            allowedComments: 0,
            blockedComments: 0,
            averageScore: 0,
            topReasons: new Map()
        };
        let totalScore = 0;
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const result = data.moderationResult;
            if (result.allowed) {
                stats.allowedComments++;
            }
            else {
                stats.blockedComments++;
                // Count reasons
                if (result.reasons) {
                    result.reasons.forEach((reason) => {
                        const count = stats.topReasons.get(reason) || 0;
                        stats.topReasons.set(reason, count + 1);
                    });
                }
            }
            totalScore += result.score || 0;
        });
        stats.averageScore = snapshot.size > 0 ? totalScore / snapshot.size : 0;
        return Object.assign(Object.assign({}, stats), { topReasons: Array.from(stats.topReasons.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([reason, count]) => ({ reason, count })) });
    }
    catch (error) {
        functions.logger.error('Error getting moderation stats:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get moderation statistics');
    }
};
exports.getModerationStats = getModerationStats;
//# sourceMappingURL=commentModerator.js.map