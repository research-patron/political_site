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
exports.UrlScraper = void 0;
const puppeteer = __importStar(require("puppeteer"));
const cheerio = __importStar(require("cheerio"));
const pdfParse = __importStar(require("pdf-parse"));
const axios_1 = __importDefault(require("axios"));
const functions = __importStar(require("firebase-functions"));
class UrlScraper {
    /**
     * Main method to scrape content from URL
     */
    static async scrapeUrl(url) {
        try {
            // Validate URL
            const validatedUrl = this.validateUrl(url);
            // Determine content type based on URL
            const contentType = this.getContentType(validatedUrl);
            switch (contentType) {
                case 'pdf':
                    return await this.scrapePdf(validatedUrl);
                case 'html':
                    return await this.scrapeHtml(validatedUrl);
                default:
                    throw new Error(`Unsupported content type: ${contentType}`);
            }
        }
        catch (error) {
            functions.logger.error('Error scraping URL:', error);
            throw new functions.https.HttpsError('internal', `Failed to scrape URL: ${error.message}`);
        }
    }
    /**
     * Validate and normalize URL
     */
    static validateUrl(url) {
        try {
            const urlObj = new URL(url);
            // Only allow HTTP/HTTPS protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                throw new Error('Only HTTP/HTTPS URLs are allowed');
            }
            return urlObj.href;
        }
        catch (error) {
            throw new Error(`Invalid URL: ${url}`);
        }
    }
    /**
     * Determine content type from URL
     */
    static getContentType(url) {
        const urlLower = url.toLowerCase();
        if (urlLower.includes('.pdf') || urlLower.includes('pdf')) {
            return 'pdf';
        }
        return 'html';
    }
    /**
     * Scrape HTML content using Puppeteer
     */
    static async scrapeHtml(url) {
        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            // Set user agent and viewport
            await page.setUserAgent('Mozilla/5.0 (compatible; PoliticalPlatformBot/1.0)');
            await page.setViewport({ width: 1280, height: 720 });
            // Navigate to page with timeout
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            // Wait for content to load
            await page.waitForTimeout(2000);
            // Get page title and content
            const title = await page.title();
            const htmlContent = await page.content();
            // Parse with Cheerio to extract text
            const $ = cheerio.load(htmlContent);
            // Remove script and style elements
            $('script, style, nav, header, footer, aside').remove();
            // Extract main content
            let textContent = '';
            // Try to find main content areas
            const contentSelectors = [
                'main',
                '[role="main"]',
                '.main-content',
                '.content',
                '.article-content',
                '.post-content',
                'article',
                '.manifesto',
                '.policy'
            ];
            for (const selector of contentSelectors) {
                const element = $(selector);
                if (element.length > 0 && element.text().trim().length > 100) {
                    textContent = element.text();
                    break;
                }
            }
            // Fallback to body content if no main content found
            if (!textContent) {
                textContent = $('body').text();
            }
            // Clean up text content
            textContent = this.cleanTextContent(textContent);
            return {
                url,
                type: 'html',
                title,
                content: textContent,
                metadata: {
                    scrapedAt: new Date(),
                    contentLength: textContent.length,
                    source: 'puppeteer'
                }
            };
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    /**
     * Scrape PDF content
     */
    static async scrapePdf(url) {
        var _a;
        try {
            // Download PDF file
            const response = await axios_1.default.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: 50 * 1024 * 1024 // 50MB limit
            });
            // Parse PDF content
            const pdfBuffer = Buffer.from(response.data);
            const pdfData = await pdfParse(pdfBuffer);
            // Clean up text content
            const textContent = this.cleanTextContent(pdfData.text);
            return {
                url,
                type: 'pdf',
                title: ((_a = pdfData.info) === null || _a === void 0 ? void 0 : _a.Title) || 'PDF Document',
                content: textContent,
                metadata: {
                    scrapedAt: new Date(),
                    contentLength: textContent.length,
                    source: 'pdf-parse'
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to scrape PDF: ${error.message}`);
        }
    }
    /**
     * Clean and normalize text content
     */
    static cleanTextContent(text) {
        return text
            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
            // Remove control characters
            .replace(/[\x00-\x1F\x7F]/g, '')
            // Trim
            .trim()
            // Limit length (keep first 50,000 characters)
            .substring(0, 50000);
    }
    /**
     * Check if URL is accessible
     */
    static async checkUrlAccessibility(url) {
        try {
            const response = await axios_1.default.head(url, { timeout: 10000 });
            return response.status === 200;
        }
        catch (_a) {
            return false;
        }
    }
}
exports.UrlScraper = UrlScraper;
//# sourceMappingURL=urlScraper.js.map