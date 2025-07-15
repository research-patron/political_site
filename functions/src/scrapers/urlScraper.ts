/**
 * URL スクレイピングサービス (2025最新実装)
 * 候補者のウェブサイトから政策情報を抽出
 */

export interface ScrapedContent {
  url: string;
  title?: string;
  content: string;
  extractedPolicies?: PolicyExtract[];
  candidateInfo?: CandidateInfo;
  metadata: {
    scrapedAt: Date;
    wordCount: number;
    contentType: string;
    success: boolean;
    errorMessage?: string;
  };
}

export interface PolicyExtract {
  title: string;
  description: string;
  category: string;
  source: string;
}

export interface CandidateInfo {
  name?: string;
  party?: string;
  position?: string;
  contact?: string;
}

export class URLScraper {
  /**
   * URLからコンテンツをスクレイピング
   */
  static async scrapeURL(url: string): Promise<ScrapedContent> {
    try {
      // 簡単なfetch実装（開発用）
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      
      // 簡単なHTMLパース（タイトル抽出）
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'No title';

      // HTMLタグを除去してテキストのみを抽出
      const content = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // コンテンツから政策情報を抽出
      const extractedPolicies = this.extractPolicies(content);
      const candidateInfo = this.extractCandidateInfo(content, title);

      return {
        url,
        title,
        content,
        extractedPolicies,
        candidateInfo,
        metadata: {
          scrapedAt: new Date(),
          wordCount: content.length,
          contentType: 'text/html',
          success: true
        }
      };

    } catch (error) {
      console.error('URL scraping error:', error);
      return {
        url,
        content: '',
        metadata: {
          scrapedAt: new Date(),
          wordCount: 0,
          contentType: 'error',
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * スクレイピングしたコンテンツから政策情報を抽出
   */
  static extractPolicies(content: string): PolicyExtract[] {
    const policies: PolicyExtract[] = [];
    
    // 政策関連キーワードと文章パターン
    const policyPatterns = [
      { keyword: '経済政策', category: '経済政策' },
      { keyword: '社会保障', category: '社会保障' },
      { keyword: '教育政策', category: '教育' },
      { keyword: '環境政策', category: '環境' },
      { keyword: '外交政策', category: '外交・安全保障' },
      { keyword: '子育て支援', category: '社会保障' },
      { keyword: 'デジタル化', category: '経済政策' },
      { keyword: '医療制度', category: '社会保障' },
      { keyword: '税制改革', category: '経済政策' },
      { keyword: '憲法改正', category: '外交・安全保障' }
    ];

    // 段落単位で分析
    const paragraphs = content.split(/\n\s*\n/);
    
    paragraphs.forEach((paragraph, index) => {
      policyPatterns.forEach(pattern => {
        if (paragraph.includes(pattern.keyword) && paragraph.length > 50) {
          // 政策タイトルを抽出（最初の文または見出し）
          const sentences = paragraph.split(/[。！？]/);
          const title = sentences[0]?.substring(0, 100) + (sentences[0]?.length > 100 ? '...' : '');
          
          policies.push({
            title: title || `${pattern.keyword}に関する政策`,
            description: paragraph.substring(0, 500) + (paragraph.length > 500 ? '...' : ''),
            category: pattern.category,
            source: `段落${index + 1}`
          });
        }
      });
    });

    // 重複を除去
    const uniquePolicies = policies.filter((policy, index, self) =>
      index === self.findIndex(p => 
        p.title === policy.title || 
        (p.description.substring(0, 100) === policy.description.substring(0, 100))
      )
    );

    return uniquePolicies.slice(0, 10); // 最大10件
  }

  /**
   * 候補者情報を抽出
   */
  static extractCandidateInfo(content: string, title?: string): CandidateInfo {
    const candidateInfo: CandidateInfo = {};
    
    // 名前の抽出（タイトルから）
    if (title) {
      const namePatterns = [
        /^([^\s]+\s+[^\s]+).*候補/,
        /^([^\s]+\s+[^\s]+).*公式/,
        /([^\s]+\s+[^\s]+).*ホームページ/
      ];
      
      for (const pattern of namePatterns) {
        const match = title.match(pattern);
        if (match) {
          candidateInfo.name = match[1];
          break;
        }
      }
    }

    // 政党の抽出
    const partyPatterns = [
      '自由民主党', '立憲民主党', '日本維新の会', '公明党', '国民民主党',
      '日本共産党', 'れいわ新選組', '社会民主党', 'NHK党', '無所属'
    ];
    
    for (const party of partyPatterns) {
      if (content.includes(party)) {
        candidateInfo.party = party;
        break;
      }
    }

    // 役職の抽出
    const positionPatterns = [
      '衆議院議員', '参議院議員', '知事候補', '市長候補', '県議会議員', '市議会議員'
    ];
    
    for (const position of positionPatterns) {
      if (content.includes(position)) {
        candidateInfo.position = position;
        break;
      }
    }

    return candidateInfo;
  }

  /**
   * URLの妥当性チェック
   */
  static isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * ドメインのブラックリストチェック
   */
  static isAllowedDomain(url: string): boolean {
    const blockedDomains = [
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'youtube.com',
      'tiktok.com'
    ];
    
    try {
      const urlObj = new URL(url);
      return !blockedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }
}