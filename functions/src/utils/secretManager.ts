import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

/**
 * Google Cloud Secret Managerクライアントラッパー
 * 機密情報（API Key等）の安全な取得を提供
 */
export class SecretManagerClient {
  private client: SecretManagerServiceClient;
  private projectId: string;
  private cache: Map<string, { value: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1時間のキャッシュ

  constructor(projectId?: string) {
    this.client = new SecretManagerServiceClient();
    this.projectId = projectId || process.env.GOOGLE_CLOUD_PROJECT_ID || 'political-site-583aa';
  }

  /**
   * Secretの値を取得（キャッシュ機能付き）
   * @param secretName Secret名
   * @param version バージョン（デフォルト: latest）
   * @returns Secret値
   */
  async getSecret(secretName: string, version: string = 'latest'): Promise<string> {
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

      const payload = response.payload?.data?.toString();
      if (!payload) {
        throw new Error(`Secret ${secretName} is empty or not found`);
      }

      // キャッシュに保存
      this.cache.set(cacheKey, {
        value: payload,
        timestamp: Date.now()
      });

      return payload;
    } catch (error) {
      console.error(`Failed to get secret ${secretName}:`, error);
      throw new Error(`Failed to retrieve secret: ${secretName}`);
    }
  }

  /**
   * 複数のSecretを一括取得
   * @param secretNames Secret名の配列
   * @returns Secret値のMap
   */
  async getSecrets(secretNames: string[]): Promise<Map<string, string>> {
    const secrets = new Map<string, string>();
    
    await Promise.all(
      secretNames.map(async (secretName) => {
        try {
          const value = await this.getSecret(secretName);
          secrets.set(secretName, value);
        } catch (error) {
          console.error(`Failed to get secret ${secretName}:`, error);
          // 個別のSecret取得失敗は警告のみ（全体を止めない）
        }
      })
    );

    return secrets;
  }

  /**
   * AI API関連のSecretを取得
   * @returns AI API Keys
   */
  async getAISecrets(): Promise<{
    geminiApiKey?: string;
    claudeApiKey?: string;
    perplexityApiKey?: string;
  }> {
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
  clearCache(): void {
    this.cache.clear();
  }
}

// シングルトンインスタンス
export const secretManager = new SecretManagerClient();