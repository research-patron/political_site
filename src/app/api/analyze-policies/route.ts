import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content, url, analyzer } = await request.json()
    
    if (!content || !analyzer) {
      return NextResponse.json(
        { error: 'Content and analyzer are required' },
        { status: 400 }
      )
    }

    if (!['gemini', 'claude', 'perplexity'].includes(analyzer)) {
      return NextResponse.json(
        { error: 'Invalid analyzer type' },
        { status: 400 }
      )
    }

    // Firebase Functionsを呼び出し
    const functionsUrl = process.env.FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/political-site-583aa/us-central1'
    
    const response = await fetch(`${functionsUrl}/analyze-policies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        content, 
        url, 
        analyzer,
        analysisType: 'policy-evaluation'
      })
    })

    if (!response.ok) {
      throw new Error(`Functions error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Analyze policies API error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze policies', details: error.message },
      { status: 500 }
    )
  }
}