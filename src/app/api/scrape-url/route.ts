import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // URL妥当性チェック
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // 簡単なfetch実装（開発用）
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    
    // 簡単なHTMLパース（タイトル抽出）
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : 'No title'

    // HTMLタグを除去してテキストのみを抽出
    const content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return NextResponse.json({
      success: true,
      content,
      title,
      extractedPolicies: [],
      candidateInfo: {},
      metadata: {
        scrapedAt: new Date(),
        wordCount: content.length,
        contentType: 'text/html',
        success: true
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Scrape URL API error:', error)
    return NextResponse.json(
      { error: 'Failed to scrape URL', details: error.message },
      { status: 500 }
    )
  }
}