const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');

// Node.js 18にはfetch APIが組み込まれている

admin.initializeApp();
const db = admin.firestore();

// Vertex AI設定
const PROJECT_ID = 'pochitan-12066';
const LOCATION = 'asia-northeast1';

async function generateContent(prompt) {
  try {
    // Google Auth を使用してアクセストークンを取得
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    // Vertex AI REST API を直接呼び出し
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/gemini-1.5-flash-002:generateContent`;
    
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.95,
        topK: 40
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Vertex AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Vertex AI error:', error);
    throw error;
  }
}

// CORS ミドルウェア
function setCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
}

exports.generateQuestions = functions.region('asia-northeast1').runWith({
  memory: '256MB',
  timeoutSeconds: 120
}).https.onRequest(async (req, res) => {
  // CORS ヘッダーを設定
  setCorsHeaders(res);

  // OPTIONS リクエストの場合はすぐに200を返す
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  // POST メソッドのみ許可
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // 認証チェック（簡略化）
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { words, difficulty = 'medium', targetExam, targetLevel } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      res.status(400).json({ error: 'Words array is required and must not be empty.' });
      return;
    }

    const questions = [];
    
    for (const word of words.slice(0, 10)) {
      // 資格とレベルに基づいて難易度と文の複雑さを決定
      let examContext = '';
      let sentenceComplexity = '';
      let toeflEquivalent = '';
      
      // 英検のTOEFL換算表
      const eikenToToeflConversion = {
        '1級': 107,    // 95-120点の平均
        '準1級': 80,   // 70-90点の平均
        '2級': 56,     // 42-71点の平均
        '準2級': 35,   // 45点未満
        '3級': 25,     // TOEFL測定不可レベル（推定）
        '4級': 20,     // TOEFL測定不可レベル（推定）
        '5級': 15      // TOEFL測定不可レベル（推定）
      };
      
      if (targetExam && targetLevel) {
        if (targetExam === '英検') {
          // 英検をTOEFL換算して処理
          const toeflScore = eikenToToeflConversion[targetLevel] || 25;
          toeflEquivalent = `TOEFL ${toeflScore}点相当`;
          
          if (toeflScore >= 95) {
            examContext = '大学院レベルの学術英語';
            sentenceComplexity = 'アカデミックで複雑な文構造、専門用語を含む';
          } else if (toeflScore >= 70) {
            examContext = '大学レベルの学術英語';
            sentenceComplexity = '学術的な文章、論理的な構造';
          } else if (toeflScore >= 42) {
            examContext = '高校上級〜大学初級レベル';
            sentenceComplexity = '準学術的な文章、やや複雑な構造';
          } else if (toeflScore >= 25) {
            examContext = '高校中級レベル';
            sentenceComplexity = '標準的な文章、基本的な学術語彙';
          } else {
            examContext = '中学〜高校初級レベル';
            sentenceComplexity = 'とても簡単で短い文、基本語彙';
          }
        } else if (targetExam === 'TOEFL') {
          const score = parseInt(targetLevel);
          if (score >= 100) {
            examContext = '大学院レベルの学術英語';
            sentenceComplexity = 'アカデミックで複雑な文構造、専門用語を含む';
          } else if (score >= 80) {
            examContext = '大学レベルの学術英語';
            sentenceComplexity = '学術的な文章、論理的な構造';
          } else if (score >= 60) {
            examContext = '高校上級〜大学初級レベル';
            sentenceComplexity = '準学術的な文章、やや複雑な構造';
          } else {
            examContext = '高校中級レベル';
            sentenceComplexity = '標準的な文章、基本的な学術語彙';
          }
        } else if (targetExam === 'TOEIC') {
          const score = parseInt(targetLevel);
          if (score >= 900) {
            examContext = 'ビジネス上級レベル';
            sentenceComplexity = '高度なビジネス文書、専門的な表現';
          } else if (score >= 800) {
            examContext = 'ビジネス中上級レベル';
            sentenceComplexity = 'ビジネス文書、会議での表現';
          } else if (score >= 700) {
            examContext = 'ビジネス中級レベル';
            sentenceComplexity = '一般的なビジネスメール、報告書';
          } else if (score >= 600) {
            examContext = 'ビジネス初級レベル';
            sentenceComplexity = '簡単なビジネスメール、日常業務';
          } else {
            examContext = '基礎ビジネスレベル';
            sentenceComplexity = '基本的なビジネス表現、挨拶';
          }
        }
      }
      
      const prompt = `
英単語学習のための穴埋め問題を1つ作成してください。

対象単語: ${word.english}${word.japanese ? ` (${word.japanese})` : ''}
品詞: ${word.partOfSpeech || '未分類'}
${examContext ? `試験レベル: ${targetExam === '英検' ? `${targetExam} ${targetLevel} (${toeflEquivalent}, ${examContext})` : `${targetExam} ${targetLevel} (${examContext})`}` : `難易度: ${difficulty === 'easy' ? '初級' : difficulty === 'hard' ? '上級' : '中級'}`}
${sentenceComplexity ? `文の複雑さ: ${sentenceComplexity}` : ''}

以下の形式で回答してください：
{
  "sentence": "穴埋め問題の英文（対象単語を____で置き換える）",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "correctIndex": 正解の選択肢のインデックス（0-3）,
  "explanation": "なぜこの答えが正解なのかの説明（日本語）"
}

要件：
1. 文は自然で文法的に正しいものにする
2. ${targetExam === 'TOEFL' || targetExam === '英検' ? '学術的な文脈を使用する' : targetExam === 'TOEIC' ? 'ビジネスシーンの文脈を使用する' : '文脈から単語の意味が推測できるようにする'}
3. 選択肢は紛らわしいが、正解は明確に1つだけ
4. ${sentenceComplexity || '難易度に応じて文の複雑さを調整する'}
5. ${targetExam === '英検' ? 'TOEFL換算スコアに基づいた学術的な語彙と文構造を使用する' : 'JSONフォーマットで返す'}
6. JSONフォーマットで返す`;

      try {
        const result = await generateContent(prompt);
        
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}') + 1;
        const jsonStr = result.substring(jsonStart, jsonEnd);
        const questionData = JSON.parse(jsonStr);
        
        questions.push({
          wordId: word.id || word.english,
          english: word.english,
          japanese: word.japanese || '',
          ...questionData
        });
      } catch (parseError) {
        console.error('Error parsing Vertex AI response:', parseError);
        questions.push({
          wordId: word.id || word.english,
          english: word.english,
          japanese: word.japanese || '',
          sentence: `The ____ is very important in this context.`,
          choices: [word.english, 'other', 'another', 'different'],
          correctIndex: 0,
          explanation: 'AIによる問題生成に失敗したため、シンプルな問題を表示しています。'
        });
      }
    }

    res.status(200).json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

exports.updateUserStats = functions.region('asia-northeast1').runWith({
  memory: '256MB',
  timeoutSeconds: 60
}).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { sessionData } = data;
  const userId = context.auth.uid;

  if (!sessionData) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Session data is required.'
    );
  }

  try {
    await db.collection('learningRecords').add({
      userId,
      ...sessionData,
      sessionDate: admin.firestore.FieldValue.serverTimestamp()
    });

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User profile not found.'
      );
    }

    const userData = userDoc.data();
    const today = new Date().toDateString();
    let lastLoginDate = null;
    
    try {
      if (userData.lastLoginDate && typeof userData.lastLoginDate.toDate === 'function') {
        lastLoginDate = userData.lastLoginDate.toDate().toDateString();
      }
    } catch (error) {
      console.warn('Error parsing lastLoginDate:', error);
    }
    
    let newStreak = userData.streak || 0;
    if (lastLoginDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastLoginDate === yesterday.toDateString()) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const expGained = sessionData.correctAnswers * 10;
    const newExp = (userData.experience || 0) + expGained;
    const newLevel = Math.floor(newExp / 100) + 1;

    await userRef.update({
      experience: newExp,
      level: newLevel,
      streak: newStreak,
      lastLoginDate: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      expGained,
      newExp,
      newLevel,
      newStreak
    };
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update user statistics'
    );
  }
});

exports.getLeaderboard = functions.region('asia-northeast1').runWith({
  memory: '256MB',
  timeoutSeconds: 60
}).https.onRequest(async (req, res) => {
  // CORS ヘッダーを設定
  setCorsHeaders(res);

  // OPTIONS リクエストの場合はすぐに200を返す
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  // POST メソッドのみ許可
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // 認証チェック（簡略化）
  const authHeader = req.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { period = 'weekly', limit = 10 } = req.body;

  try {
    let startDate = new Date();
    if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const recordsSnapshot = await db.collection('learningRecords')
      .where('sessionDate', '>=', startDate)
      .get();

    const userScores = {};
    
    recordsSnapshot.forEach(doc => {
      const record = doc.data();
      if (!userScores[record.userId]) {
        userScores[record.userId] = {
          totalQuestions: 0,
          totalCorrect: 0,
          totalTime: 0
        };
      }
      
      userScores[record.userId].totalQuestions += record.questionsAnswered || 0;
      userScores[record.userId].totalCorrect += record.correctAnswers || 0;
      userScores[record.userId].totalTime += record.duration || 0;
    });

    const rankings = [];
    for (const userId in userScores) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          
          // Firebase AuthのdisplayNameも取得
          let displayName = userData.displayName;
          try {
            const authUser = await admin.auth().getUser(userId);
            // AuthのdisplayNameがあり、FirestoreのdisplayNameが空の場合は更新
            if (authUser.displayName && !displayName) {
              displayName = authUser.displayName;
              // Firestoreも更新しておく
              await db.collection('users').doc(userId).update({
                displayName: authUser.displayName
              });
            }
          } catch (authError) {
            console.warn(`Could not fetch auth user for ${userId}:`, authError);
          }
          
          // displayNameが設定されていない場合のみAnonymousを使用
          if (!displayName) {
            displayName = 'Anonymous';
          }
          
          rankings.push({
            userId,
            displayName: displayName,
            photoURL: userData.photoURL || '',
            level: userData.level || 1,
            ...userScores[userId],
            score: userScores[userId].totalCorrect * 10
          });
        }
      } catch (error) {
        console.error(`Error fetching user data for ${userId}:`, error);
      }
    }

    rankings.sort((a, b) => b.score - a.score);

    // トークンからユーザーIDを取得（簡略化のため仮実装）
    // 実際にはトークンを検証してユーザーIDを取得する必要があります
    const userId = 'currentUserId'; // TODO: トークンから取得
    
    res.status(200).json({
      rankings: rankings.slice(0, limit),
      userRank: rankings.findIndex(r => r.userId === userId) + 1
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});