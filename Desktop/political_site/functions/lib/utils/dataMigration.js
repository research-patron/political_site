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
exports.clearMigrationData = exports.checkMigrationStatus = exports.migrateYamagataData = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
/**
 * Yamagata Prefecture Senate Election Data Migration
 */
// Mock data structure to match the current candidates.ts file
const yamagataSenateCandidates = [
    {
        id: 'haga',
        name: '芳賀道也',
        age: 67,
        party: '無所属',
        status: 'incumbent',
        prefecture: '山形県',
        electionType: '参議院選挙',
        electionDate: new Date('2025-07-01'),
        slogan: '人に優しい政治にズームイン',
        color: '#3B82F6',
        achievements: ['元山形放送アナウンサー', '参議院議員1期', '地域活性化プロジェクト推進'],
        policies: [
            {
                id: 'haga-policy-1',
                title: 'ガソリン価格引き下げ',
                category: 'economy',
                feasibilityScore: 75,
                impact: 'high',
                description: 'トリガー条項の凍結解除で即効性のある価格対策を実現',
                analyzedBy: 'manual',
                analyzedAt: new Date('2024-11-01'),
                detailedEvaluation: {
                    technical: {
                        score: 85,
                        summary: '既存の法制度（トリガー条項）が存在し、技術的実現性は高い',
                        report: 'トリガー条項は、揮発油税等の税率の特例措置（租税特別措置法第89条）として2010年に導入された制度です。ガソリン価格が3ヶ月連続で160円/Lを超えた場合、自動的に揮発油税を25.1円/L引き下げる仕組みが既に法律上存在しています。\n\n現在この条項は東日本大震災の復興財源確保のため凍結されていますが、凍結解除は国会での法改正のみで実施可能です。システム改修も最小限で済み、過去にガソリン税の暫定税率廃止（2008年）の前例もあることから、技術的・制度的なハードルは低いと評価できます。\n\nただし、課題として以下が挙げられます：\n・価格変動への対応（頻繁な税率変更による混乱）\n・地方揮発油譲与税への影響（年間約1,400億円）\n・石油元売り各社のシステム対応（約2-3ヶ月必要）',
                        references: ['租税特別措置法第89条', '2022年度税制改正大綱', '資源エネルギー庁燃料価格激変緩和対策'],
                        searchKeywords: ['トリガー条項 租税特別措置法89条', '揮発油税 暫定税率', 'ガソリン税 地方譲与税']
                    },
                    political: {
                        score: 65,
                        summary: '与野党で意見が分かれており、政治的合意形成に課題',
                        report: 'トリガー条項の凍結解除については、2022年3月以降、国会で複数回議論されています。野党4党（立憲民主党、日本維新の会、国民民主党、れいわ新選組）は共同で凍結解除法案を提出し、与党内でも公明党が前向きな姿勢を示しています。\n\nしかし、財務省は強く反対しており、主な論点は：\n1. 税収減少額：年間約1.5兆円（国税1.2兆円、地方税0.3兆円）\n2. 脱炭素政策との整合性（ガソリン消費促進への懸念）\n3. 買い控え・買いだめによる市場混乱のリスク\n\n直近の世論調査では、ガソリン減税支持が73%（日経新聞2024年11月調査）と高く、参議院選挙の争点となる可能性が高いです。しかし、自民党税制調査会は慎重姿勢を崩しておらず、実現には政権内での調整が不可欠です。',
                        references: ['第211回国会衆議院財務金融委員会議事録', '2024年度与党税制改正大綱', '日本経済新聞世論調査'],
                        searchKeywords: ['トリガー条項 国会審議', 'ガソリン税 減税 財務省', '自民党税制調査会 トリガー条項']
                    },
                    financial: {
                        score: 75,
                        summary: '税収減少は見込まれるが、経済効果でカバー可能と試算',
                        report: 'トリガー条項発動による財政影響は以下の通り試算されています：\n\n【歳入減少】\n・国税（揮発油税）：年間約1.2兆円減\n・地方税（地方揮発油譲与税）：年間約3,000億円減\n・合計：年間約1.5兆円の税収減\n\n【経済効果】\n日本エネルギー経済研究所の試算（2023年）によると：\n・家計負担軽減：平均世帯で年間2.4万円\n・消費拡大効果：GDP0.3%押し上げ（約1.6兆円）\n・物流コスト削減：運輸業界全体で年間8,000億円',
                        references: ['財務省主計局試算（2023年）', '日本エネルギー経済研究所「燃料価格高騰の経済影響分析」', '内閣府「経済財政白書2024」'],
                        searchKeywords: ['トリガー条項 財政影響 試算', 'ガソリン減税 経済効果', '日本エネルギー経済研究所 レポート']
                    },
                    timeline: {
                        score: 80,
                        summary: '法改正のみで実施可能、6ヶ月以内に効果発現',
                        report: '実施までのロードマップは以下の通り想定されます：\n\n【第1段階：法案準備（1-2ヶ月）】\n・租税特別措置法改正案の作成\n・与党税制調査会での審議\n・閣議決定\n\n【第2段階：国会審議（2-3ヶ月）】\n・衆議院財務金融委員会での審議（約3週間）\n・衆議院本会議採決\n・参議院財政金融委員会での審議（約2週間）\n・参議院本会議採決',
                        references: ['国会法制局「租税特別措置法改正の手引き」', '石油連盟「価格改定システムガイドライン」', '総務省「地方税法施行規則」'],
                        searchKeywords: ['租税特別措置法 改正 手続き', 'ガソリン税 減税 実施時期', '石油連盟 システム対応']
                    }
                }
            },
            {
                id: 'haga-policy-2',
                title: '教育無償化の拡大',
                category: 'education',
                feasibilityScore: 60,
                impact: 'high',
                description: '高等教育までの段階的無償化を推進',
                analyzedBy: 'manual',
                analyzedAt: new Date('2024-11-01'),
                detailedEvaluation: {
                    technical: {
                        score: 70,
                        summary: '段階的実施により制度設計は可能',
                        report: '教育無償化の拡大は、憲法26条の「教育を受ける権利」の完全実現を目指す政策です。現在、幼児教育・保育の無償化（2019年10月～）と高等学校の実質無償化（2020年4月～）が実施されていますが、高等教育（大学・専門学校等）の完全無償化には以下の制度設計が必要です。\n\n【現行制度の拡充案】\n1. 高等教育修学支援新制度（2020年開始）の対象拡大\n   - 現在：住民税非課税世帯とそれに準ずる世帯（年収約380万円まで）\n   - 拡大案：年収600万円まで段階的に引き上げ',
                        references: ['文部科学省「高等教育の修学支援新制度」', 'OECD Education at a Glance 2023', '教育基本法'],
                        searchKeywords: ['高等教育修学支援新制度 拡充', 'OECD 教育費 国際比較', '大学無償化 憲法26条']
                    },
                    political: {
                        score: 55,
                        summary: '財源確保について与党内でも議論が分かれる',
                        report: '教育無償化の政治的実現性については、理念では超党派の支持があるものの、財源論で大きく意見が分かれています。\n\n【各党の立場】\n・自民党：段階的・限定的な無償化（所得制限維持）\n・公明党：中間層まで含めた支援拡大に前向き\n・立憲民主党：高等教育完全無償化を公約',
                        references: ['第211回国会文部科学委員会議事録', '各党2022年参議院選挙公約集', '日本私立大学協会「高等教育政策に関する提言」'],
                        searchKeywords: ['教育無償化 各党公約', '教育国債 財政制度審議会', '私立大学協会 声明']
                    },
                    financial: {
                        score: 45,
                        summary: '年間2兆円規模の財源が必要、増税議論は避けられない',
                        report: '高等教育完全無償化の財政規模は極めて大きく、恒久財源の確保が最大の課題です。\n\n【必要財源の試算】\n文部科学省試算（2023年）によると：\n・国公立大学授業料免除：約3,000億円\n・私立大学授業料補助（平均50万円）：約1.5兆円\n・専門学校等支援：約2,000億円\n・施設設備費、教材費支援：約1,000億円\n合計：年間約2兆円',
                        references: ['財務省「我が国の財政に関する長期推計」', '文部科学省「教育投資の経済効果分析」', '財政制度等審議会「教育予算のあり方について」'],
                        searchKeywords: ['教育無償化 財源 試算', '教育国債 財政制度審議会', 'フランス 職業訓練税']
                    },
                    timeline: {
                        score: 60,
                        summary: '完全実施まで10年以上の長期計画が必要',
                        report: '教育無償化の完全実施には、財政的制約と制度的準備から長期的な取り組みが必要です。\n\n【段階的実施計画案】\n第1期（2025-2027年）：基盤整備期\n・低所得世帯の支援拡充（年収400万円まで）\n・必要予算：年間3,000億円増\n・修学支援システムの全国統一化',
                        references: ['中央教育審議会「2040年に向けた高等教育のグランドデザイン」', '韓国教育部「高等教育財政支援計画」', '文部科学省「教育振興基本計画」'],
                        searchKeywords: ['韓国 大学無償化 過程', '教育財政 長期推計', '高等教育グランドデザイン']
                    }
                }
            }
        ]
    },
    {
        id: 'yoshinaga',
        name: '吉永美子',
        age: 60,
        party: '立憲民主党',
        status: 'newcomer',
        prefecture: '山形県',
        electionType: '参議院選挙',
        electionDate: new Date('2025-07-01'),
        slogan: 'くらしを守る 憲法を守る 民主主義を守る',
        color: '#10B981',
        achievements: ['労働組合活動家', '市民活動家', '女性の権利活動'],
        policies: [
            {
                id: 'yoshinaga-policy-1',
                title: '最低賃金1500円実現',
                category: 'labor',
                feasibilityScore: 55,
                impact: 'high',
                description: '段階的な最低賃金引き上げで生活向上',
                analyzedBy: 'manual',
                analyzedAt: new Date('2024-11-01'),
                detailedEvaluation: {
                    technical: {
                        score: 60,
                        summary: '段階的引き上げは可能だが、地域格差の調整が必要',
                        report: '最低賃金1500円の実現は、現行制度の枠組みで段階的に実施可能ですが、地域経済への影響を考慮した慎重な設計が必要です。\n\n【現状分析】\n2024年10月改定の地域別最低賃金：\n・山形県：900円（全国加重平均1,004円）\n・最高：東京都1,113円\n・最低：高知県等870円\n\n1500円実現には山形県で67%の引き上げが必要となります。',
                        references: ['厚生労働省「地域別最低賃金の全国一覧」', '中央最低賃金審議会答申（2024年）', '韓国雇用労働部「最低賃金影響分析報告書」'],
                        searchKeywords: ['最低賃金 地域格差 是正', '韓国 最低賃金 引き上げ 影響', '業務改善助成金 拡充']
                    },
                    political: {
                        score: 50,
                        summary: '経営者団体からの反発が予想される',
                        report: '最低賃金1500円実現には、労使間の大きな対立を乗り越える必要があります。\n\n【各団体の立場】\n支持派：\n・連合：2035年までに1500円を要求（現行方針）\n・全労連：即時1500円実現を主張\n・日本弁護士連合会：格差是正の観点から支持\n\n反対派：\n・日本商工会議所：「中小企業の7割が雇用維持困難」と試算\n・日本経済団体連合会：「生産性向上が先決」と慎重姿勢',
                        references: ['連合「2024年度最低賃金改善要求」', '日本商工会議所「最低賃金に関する調査結果」', '各党2024年政策集'],
                        searchKeywords: ['最低賃金1500円 各党公約', '連合 最低賃金要求', '商工会議所 最低賃金反対']
                    },
                    financial: {
                        score: 55,
                        summary: '中小企業への支援策とセットで実施が必要',
                        report: '最低賃金1500円実現には、中小企業への大規模な支援策が不可欠です。\n\n【必要な支援規模】\n厚生労働省試算（2024年）：\n・影響を受ける労働者：約1,200万人\n・企業の追加人件費負担：年間約15兆円\n・うち中小企業の負担：約10兆円\n\n【支援策】\n1. 業務改善助成金の大幅拡充\n   - 現行上限600万円→2,000万円\n   - 補助率3/4→9/10に引き上げ',
                        references: ['厚生労働省「最低賃金引き上げの影響試算」', '中小企業庁「賃上げ支援策の効果分析」', 'OECD「最低賃金政策の国際比較」'],
                        searchKeywords: ['最低賃金 中小企業 影響', '業務改善助成金 拡充 効果', 'OECD 最低賃金 国際比較']
                    },
                    timeline: {
                        score: 50,
                        summary: '段階的実施で7年程度の期間が必要',
                        report: '最低賃金1500円の実現には、経済への影響を最小限に抑えるため段階的な実施が必要です。\n\n【実施スケジュール案】\n第1段階（2025-2027年）：年間100円引き上げ\n・2025年：1,000円（山形県+100円）\n・2026年：1,100円（+100円）\n・2027年：1,200円（+100円）\n\n第2段階（2028-2031年）：年間75円引き上げ\n・2028年：1,275円（+75円）\n・2029年：1,350円（+75円）\n・2030年：1,425円（+75円）\n・2031年：1,500円（+75円）',
                        references: ['中央最低賃金審議会「最低賃金引き上げ方針」', '韓国雇用労働部「段階的引き上げ計画」', 'ILO「最低賃金制度設計ガイドライン」'],
                        searchKeywords: ['最低賃金 段階的 引き上げ計画', '韓国 最低賃金 実施スケジュール', 'ILO 最低賃金 ガイドライン']
                    }
                }
            }
        ]
    }
];
/**
 * Cloud Function to migrate Yamagata data to Firestore
 */
const migrateYamagataData = async (data, context) => {
    var _a;
    try {
        // Validate admin privileges
        if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
            throw new functions.https.HttpsError('permission-denied', 'Admin privileges required for data migration');
        }
        functions.logger.info('Starting Yamagata data migration to Firestore');
        const db = admin.firestore();
        const batch = db.batch();
        let candidatesCount = 0;
        let policiesCount = 0;
        // Process each candidate
        for (const candidate of yamagataSenateCandidates) {
            // Create candidate document
            const candidateRef = db.collection('candidates').doc(candidate.id);
            const candidateData = {
                id: candidate.id,
                name: candidate.name,
                age: candidate.age,
                party: candidate.party,
                status: candidate.status,
                prefecture: candidate.prefecture,
                electionType: candidate.electionType,
                electionDate: admin.firestore.Timestamp.fromDate(candidate.electionDate),
                slogan: candidate.slogan,
                photoUrl: null, // To be added later
                achievements: candidate.achievements,
                color: candidate.color,
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now(),
                migratedAt: admin.firestore.Timestamp.now(),
                dataSource: 'migration',
                createdBy: context.auth.uid
            };
            batch.set(candidateRef, candidateData);
            candidatesCount++;
            // Process policies for this candidate
            for (const policy of candidate.policies) {
                const policyRef = candidateRef.collection('policies').doc(policy.id);
                const policyData = {
                    id: policy.id,
                    candidateId: candidate.id,
                    title: policy.title,
                    category: policy.category,
                    description: policy.description,
                    feasibilityScore: policy.feasibilityScore,
                    impact: policy.impact,
                    detailedEvaluation: {
                        technical: Object.assign(Object.assign({}, policy.detailedEvaluation.technical), { searchKeywords: policy.detailedEvaluation.technical.searchKeywords || [] }),
                        political: Object.assign(Object.assign({}, policy.detailedEvaluation.political), { searchKeywords: policy.detailedEvaluation.political.searchKeywords || [] }),
                        financial: Object.assign(Object.assign({}, policy.detailedEvaluation.financial), { searchKeywords: policy.detailedEvaluation.financial.searchKeywords || [] }),
                        timeline: Object.assign(Object.assign({}, policy.detailedEvaluation.timeline), { searchKeywords: policy.detailedEvaluation.timeline.searchKeywords || [] })
                    },
                    sourceUrl: null,
                    analyzedBy: policy.analyzedBy,
                    analyzedAt: admin.firestore.Timestamp.fromDate(policy.analyzedAt),
                    createdAt: admin.firestore.Timestamp.now(),
                    updatedAt: admin.firestore.Timestamp.now(),
                    migratedAt: admin.firestore.Timestamp.now()
                };
                batch.set(policyRef, policyData);
                policiesCount++;
            }
        }
        // Create migration log
        const migrationLogRef = db.collection('migrationLogs').doc();
        const migrationLogData = {
            migrationDate: admin.firestore.Timestamp.now(),
            migrationType: 'yamagata-senate-data',
            candidatesCount,
            policiesCount,
            performedBy: context.auth.uid,
            status: 'completed',
            details: {
                candidates: yamagataSenateCandidates.map(c => ({
                    id: c.id,
                    name: c.name,
                    policiesCount: c.policies.length
                }))
            }
        };
        batch.set(migrationLogRef, migrationLogData);
        // Commit the batch
        await batch.commit();
        functions.logger.info(`Yamagata data migration completed successfully`, {
            candidatesCount,
            policiesCount
        });
        return {
            success: true,
            message: `Migration completed successfully. ${candidatesCount} candidates and ${policiesCount} policies migrated.`,
            candidatesCount,
            policiesCount
        };
    }
    catch (error) {
        functions.logger.error('Yamagata data migration failed:', error);
        // Re-throw functions.https.HttpsError as-is
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Wrap other errors
        throw new functions.https.HttpsError('internal', `Migration failed: ${error.message}`);
    }
};
exports.migrateYamagataData = migrateYamagataData;
/**
 * Check migration status
 */
const checkMigrationStatus = async (data, context) => {
    var _a;
    try {
        // Validate admin privileges
        if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
            throw new functions.https.HttpsError('permission-denied', 'Admin privileges required');
        }
        const db = admin.firestore();
        // Check if Yamagata candidates exist
        const candidatesQuery = await db.collection('candidates')
            .where('prefecture', '==', '山形県')
            .where('electionType', '==', '参議院選挙')
            .get();
        const candidates = candidatesQuery.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Get migration logs
        const migrationLogsQuery = await db.collection('migrationLogs')
            .where('migrationType', '==', 'yamagata-senate-data')
            .orderBy('migrationDate', 'desc')
            .limit(5)
            .get();
        const migrationLogs = migrationLogsQuery.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return {
            candidatesFound: candidates.length,
            candidates: candidates,
            migrationHistory: migrationLogs,
            isMigrationNeeded: candidates.length === 0
        };
    }
    catch (error) {
        functions.logger.error('Error checking migration status:', error);
        throw new functions.https.HttpsError('internal', 'Failed to check migration status');
    }
};
exports.checkMigrationStatus = checkMigrationStatus;
/**
 * Clear migration data (for testing purposes)
 */
const clearMigrationData = async (data, context) => {
    var _a;
    try {
        // Validate admin privileges
        if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
            throw new functions.https.HttpsError('permission-denied', 'Admin privileges required');
        }
        const db = admin.firestore();
        // Get all Yamagata candidates
        const candidatesQuery = await db.collection('candidates')
            .where('prefecture', '==', '山形県')
            .where('electionType', '==', '参議院選挙')
            .get();
        const batch = db.batch();
        // Delete candidates and their policies
        for (const candidateDoc of candidatesQuery.docs) {
            // Delete policies subcollection
            const policiesQuery = await candidateDoc.ref.collection('policies').get();
            for (const policyDoc of policiesQuery.docs) {
                batch.delete(policyDoc.ref);
            }
            // Delete candidate document
            batch.delete(candidateDoc.ref);
        }
        await batch.commit();
        functions.logger.info('Migration data cleared successfully');
        return {
            success: true,
            message: `Cleared ${candidatesQuery.size} candidates and their policies`
        };
    }
    catch (error) {
        functions.logger.error('Error clearing migration data:', error);
        throw new functions.https.HttpsError('internal', 'Failed to clear migration data');
    }
};
exports.clearMigrationData = clearMigrationData;
//# sourceMappingURL=dataMigration.js.map