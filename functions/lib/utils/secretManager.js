"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secretManager = exports.SecretManagerClient = void 0;
const secret_manager_1 = require("@google-cloud/secret-manager");
/**
 * Google Cloud Secret Managerクライアントラッパー
 * 機密情報（API Key等）の安全な取得を提供
 */
class SecretManagerClient {
    constructor(projectId) {
        this.cache = new Map();
        this.CACHE_TTL = 60 * 60 * 1000; // 1時間のキャッシュ
        this.client = new secret_manager_1.SecretManagerServiceClient();
        this.projectId = projectId || process.env.GOOGLE_CLOUD_PROJECT_ID || 'political-site-583aa';
    }
    /**
     * Secretの値を取得（キャッシュ機能付き）
     * @param secretName Secret名
     * @param version バージョン（デフォルト: latest）
     * @returns Secret値
     */
    async getSecret(secretName, version = 'latest') {
        var _a, _b;
        const cacheKey = `${secretName}:${version}`;
        const cached = this.cache.get(cacheKey);
        // キャッシュチェック
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.value;
        }
        try {
            const secretPath = `projects/${this.projectId}/secrets/${secretName}/versions/${version}`;
            const [response] = await this.client.accessSecretVersion({
                name: secretPath,
            });
            const payload = (_b = (_a = response.payload) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.toString();
            if (!payload) {
                throw new Error(`Secret ${secretName} is empty or not found`);
            }
            // キャッシュに保存
            this.cache.set(cacheKey, {
                value: payload,
                timestamp: Date.now()
            });
            return payload;
        }
        catch (error) {
            console.error(`Failed to get secret ${secretName}:`, error);
            throw new Error(`Failed to retrieve secret: ${secretName}`);
        }
    }
    /**
     * 複数のSecretを一括取得
     * @param secretNames Secret名の配列
     * @returns Secret値のMap
     */
    async getSecrets(secretNames) {
        const secrets = new Map();
        await Promise.all(secretNames.map(async (secretName) => {
            try {
                const value = await this.getSecret(secretName);
                secrets.set(secretName, value);
            }
            catch (error) {
                console.error(`Failed to get secret ${secretName}:`, error);
                // 個別のSecret取得失敗は警告のみ（全体を止めない）
            }
        }));
        return secrets;
    }
    /**
     * AI API関連のSecretを取得
     * @returns AI API Keys
     */
    async getAISecrets() {
        const secretNames = [
            'gemini-api-key',
            'claude-api-key',
            'perplexity-api-key'
        ];
        const secrets = await this.getSecrets(secretNames);
        return {
            geminiApiKey: secrets.get('gemini-api-key'),
            claudeApiKey: secrets.get('claude-api-key'),
            perplexityApiKey: secrets.get('perplexity-api-key')
        };
    }
    /**
     * キャッシュをクリア
     */
    clearCache() {
        this.cache.clear();
    }
}
exports.SecretManagerClient = SecretManagerClient;
// シングルトンインスタンス
exports.secretManager = new SecretManagerClient();
//# sourceMappingURL=secretManager.js.map