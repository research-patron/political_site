import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  LinearProgress,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  TextField,
  Stepper,
  Step,
  StepLabel,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../services/firebase';

const Learning = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  // ステップ管理
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['単語を入力', '問題を解く', '結果を確認'];
  
  // 単語入力関連
  const [inputText, setInputText] = useState('');
  const [words, setWords] = useState([]);
  const [savedLists, setSavedLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  
  // 学習関連
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    startTime: Date.now(),
    questionsAnswered: 0,
    correctAnswers: 0,
    incorrectWords: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [sessionResults, setSessionResults] = useState(null);

  useEffect(() => {
    fetchWordLists();
  }, [userProfile]);

  const fetchWordLists = async () => {
    if (!userProfile?.uid) return;

    try {
      const q = query(collection(db, 'wordLists'), where('userId', '==', userProfile.uid));
      const querySnapshot = await getDocs(q);
      const lists = [];
      querySnapshot.forEach((doc) => {
        lists.push({ id: doc.id, ...doc.data() });
      });
      setSavedLists(lists);
    } catch (error) {
      console.error('Error fetching word lists:', error);
    }
  };

  // 単語処理
  const handleProcessWords = (autoStart = false) => {
    if (!inputText.trim()) return;

    const newWords = inputText
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0)
      .map(word => ({ 
        english: word, 
        japanese: '翻訳中...', 
        partOfSpeech: '名詞' 
      }));

    if (newWords.length === 0) return;

    // 重複チェック
    const existingWords = words.map(w => w.english.toLowerCase());
    const uniqueNewWords = newWords.filter(
      w => !existingWords.includes(w.english.toLowerCase())
    );

    if (uniqueNewWords.length > 0) {
      const updatedWords = [...words, ...uniqueNewWords];
      setWords(updatedWords);
      setInputText('');
      
      // 自動開始フラグがtrueの場合、学習を自動開始
      if (autoStart && updatedWords.length > 0) {
        setTimeout(() => {
          handleStartLearning();
        }, 100);
      }
    }
  };

  // 単語削除
  const handleDeleteWord = (index) => {
    const newWords = words.filter((_, i) => i !== index);
    setWords(newWords);
  };

  // 保存済みリストを読み込む
  const handleLoadList = async (list) => {
    setSelectedList(list);
    setWords(list.words);
  };

  // 学習開始
  const handleStartLearning = async () => {
    if (words.length === 0) {
      setError('学習する単語を入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setActiveStep(1);

    try {
      // AIで問題を生成
      let generatedQuestions = [];
      
      try {
        const functionUrl = 'https://asia-northeast1-pochitan-12066.cloudfunctions.net/generateQuestions';
        const user = auth.currentUser;
        const idToken = await user.getIdToken();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            words: words.slice(0, 10),
            difficulty: 'medium',
            targetExam: userProfile?.settings?.targetExam || '',
            targetLevel: userProfile?.settings?.targetLevel || ''
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          if (result.questions && result.questions.length > 0) {
            generatedQuestions = result.questions;
          }
        }
      } catch (error) {
        console.warn('AI問題生成サービスが利用できません。ローカル問題を生成します。', error);
      }

      // フォールバック問題生成
      if (generatedQuestions.length === 0) {
        const allWords = words.map(w => w.english);
        
        generatedQuestions = words.slice(0, 10).map((word) => {
          const distractors = allWords
            .filter(w => w !== word.english)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          // 選択肢が足りない場合は補完
          while (distractors.length < 3) {
            distractors.push(`選択肢${distractors.length + 1}`);
          }

          const choices = [word.english, ...distractors]
            .sort(() => Math.random() - 0.5);
          
          const correctIndex = choices.indexOf(word.english);

          const sentenceTemplates = [
            `I need to ____ this problem.`,
            `Please ____ carefully.`,
            `The ____ is very important.`,
            `We should ____ together.`,
            `It is ____ to understand.`
          ];
          
          const randomSentence = sentenceTemplates[Math.floor(Math.random() * sentenceTemplates.length)];

          return {
            wordId: word.english,
            english: word.english,
            japanese: word.japanese || '',
            sentence: randomSentence,
            choices: choices,
            correctIndex: correctIndex,
            explanation: `正解は「${word.english}」${word.japanese ? ` (${word.japanese})` : ''} です。`
          };
        });
      }

      setQuestions(generatedQuestions);
      setSessionStats({
        startTime: Date.now(),
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectWords: []
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      setError('問題の生成に失敗しました');
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (value) => {
    if (!showResult) {
      setSelectedAnswer(value);
    }
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = parseInt(selectedAnswer) === currentQuestion.correctIndex;
    
    setShowResult(true);
    setSessionStats({
      ...sessionStats,
      questionsAnswered: sessionStats.questionsAnswered + 1,
      correctAnswers: sessionStats.correctAnswers + (isCorrect ? 1 : 0),
      incorrectWords: isCorrect 
        ? sessionStats.incorrectWords 
        : [...sessionStats.incorrectWords, currentQuestion.english]
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      completeSession();
    }
  };

  const completeSession = async () => {
    const duration = Math.floor((Date.now() - sessionStats.startTime) / 1000);
    const sessionData = {
      wordListId: selectedList?.id || 'temp-session',
      duration,
      questionsAnswered: sessionStats.questionsAnswered,
      correctAnswers: sessionStats.correctAnswers,
      incorrectWords: sessionStats.incorrectWords
    };

    console.log('学習セッション完了:', sessionData);

    try {
      // 学習記録を保存
      await addDoc(collection(db, 'learningRecords'), {
        userId: userProfile.uid,
        ...sessionData,
        sessionDate: new Date()
      });

      // ユーザー統計を更新
      try {
        const updateUserStats = httpsCallable(functions, 'updateUserStats');
        const result = await updateUserStats({ sessionData });
        console.log('統計更新結果:', result);
        
        setSessionResults({
          ...sessionData,
          ...result.data,
          accuracy: Math.round((sessionStats.correctAnswers / sessionStats.questionsAnswered) * 100)
        });
      } catch (funcError) {
        console.error('関数呼び出しエラー:', funcError);
        setSessionResults({
          ...sessionData,
          accuracy: Math.round((sessionStats.correctAnswers / sessionStats.questionsAnswered) * 100)
        });
      }
      
      setActiveStep(2);
      setShowCompletionDialog(true);
    } catch (error) {
      console.error('セッション完了エラー:', error);
      setSessionResults({
        ...sessionData,
        accuracy: Math.round((sessionStats.correctAnswers / sessionStats.questionsAnswered) * 100)
      });
      setActiveStep(2);
      setShowCompletionDialog(true);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setWords([]);
    setInputText('');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowResult(false);
    setSessionStats({
      startTime: Date.now(),
      questionsAnswered: 0,
      correctAnswers: 0,
      incorrectWords: []
    });
    setShowCompletionDialog(false);
    setSessionResults(null);
  };

  // ステップ0: 単語入力
  const renderWordInput = () => (
    <Box>
      <Paper elevation={0} sx={{ p: 3, bgcolor: '#f5f5f5', mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          英単語を入力（1行に1単語）
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={6}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onBlur={handleProcessWords}
          placeholder="例：
apple
book
computer
beautiful"
          sx={{ 
            backgroundColor: 'white',
            mb: 2,
            '& .MuiOutlinedInput-root': {
              fontFamily: 'monospace',
            }
          }}
        />
        
        <Button
          variant="outlined"
          onClick={() => handleProcessWords(true)}
          sx={{ mr: 2 }}
        >
          単語を追加して学習開始
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => setInputText('')}
          disabled={!inputText}
        >
          クリア
        </Button>
      </Paper>

      {/* 追加済み単語 */}
      {words.length > 0 && (
        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            追加済み単語 ({words.length}個)
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {words.map((word, index) => (
              <Chip
                key={index}
                label={word.english}
                onDelete={() => handleDeleteWord(index)}
                variant="outlined"
              />
            ))}
          </Box>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleStartLearning}
            startIcon={<SchoolIcon />}
            disabled={loading}
            sx={{ minWidth: 200 }}
          >
            学習を開始
          </Button>
        </Paper>
      )}

      {/* 保存済みリスト */}
      {savedLists.length > 0 && (
        <Paper elevation={0} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            保存済みリスト
          </Typography>
          
          <Grid container spacing={2}>
            {savedLists.map((list) => (
              <Grid item xs={12} sm={6} key={list.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {list.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {list.words.length}単語
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => handleLoadList(list)}
                    >
                      読み込む
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );

  // ステップ1: 問題を解く
  const renderQuestions = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (questions.length === 0) {
      return (
        <Alert severity="error">問題が生成されませんでした</Alert>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">
              問題 {currentQuestionIndex + 1} / {questions.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sessionStats.correctAnswers}/{sessionStats.questionsAnswered} 正解
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ lineHeight: 1.8 }}>
                {currentQuestion.sentence.split('____').map((part, index) => (
                  <React.Fragment key={index}>
                    {part}
                    {index === 0 && (
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          minWidth: 80,
                          borderBottom: '2px solid',
                          borderColor: 'primary.main',
                          mx: 1,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </Typography>
            </Paper>

            {showResult && (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  正解の単語
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {currentQuestion.english}
                </Typography>
                {currentQuestion.japanese && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {currentQuestion.japanese}
                  </Typography>
                )}
              </Box>
            )}

            <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
              <RadioGroup value={selectedAnswer} onChange={(e) => handleAnswerSelect(e.target.value)}>
                {currentQuestion.choices.map((choice, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      mb: 2,
                      p: 2,
                      cursor: showResult ? 'default' : 'pointer',
                      border: '2px solid',
                      borderColor: showResult
                        ? index === currentQuestion.correctIndex
                          ? 'success.main'
                          : selectedAnswer === index.toString()
                          ? 'error.main'
                          : '#e0e0e0'
                        : selectedAnswer === index.toString()
                        ? 'primary.main'
                        : '#e0e0e0',
                      backgroundColor: showResult
                        ? index === currentQuestion.correctIndex
                          ? '#e8f5e9'
                          : selectedAnswer === index.toString()
                          ? '#ffebee'
                          : 'white'
                        : selectedAnswer === index.toString()
                        ? '#e3f2fd'
                        : 'white',
                    }}
                    onClick={() => !showResult && handleAnswerSelect(index.toString())}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Radio
                        value={index.toString()}
                        sx={{ display: 'none' }}
                      />
                      <Typography sx={{ flex: 1 }}>
                        {choice}
                      </Typography>
                      {showResult && (
                        index === currentQuestion.correctIndex
                          ? <CheckCircleIcon color="success" />
                          : selectedAnswer === index.toString()
                          ? <CancelIcon color="error" />
                          : null
                      )}
                    </Box>
                  </Paper>
                ))}
              </RadioGroup>
            </FormControl>

            {showResult && currentQuestion.explanation && (
              <Alert severity="info" sx={{ mb: 3 }}>
                {currentQuestion.explanation}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              {!showResult ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  fullWidth
                >
                  回答する
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNextQuestion}
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                >
                  {currentQuestionIndex < questions.length - 1 ? '次の問題へ' : '結果を見る'}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // ステップ2: 結果表示
  const renderResults = () => (
    <Dialog open={showCompletionDialog} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          学習完了！
        </Typography>
      </DialogTitle>
      <DialogContent>
        {sessionResults && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h2" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
              {sessionResults.accuracy}%
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              正答率
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 3 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h4" color="success.main">
                    {sessionResults.correctAnswers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    正解数
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h4" color="error.main">
                    {sessionResults.questionsAnswered - sessionResults.correctAnswers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    不正解数
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {sessionResults.expGained && (
              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="body1">
                  {sessionResults.expGained} EXP を獲得しました！
                </Typography>
              </Alert>
            )}

            {sessionResults.incorrectWords.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  復習が必要な単語：
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {sessionResults.incorrectWords.map((word, index) => (
                    <Chip key={index} label={word} color="error" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/app/dashboard')}
          fullWidth
        >
          ダッシュボードへ
        </Button>
        <Button
          variant="contained"
          onClick={handleReset}
          fullWidth
        >
          もう一度学習する
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0', py: 2, mb: 3 }}>
        <Box sx={{ maxWidth: 800, mx: 'auto', px: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            英単語学習
          </Typography>
          
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 800, mx: 'auto', px: 2, pb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && renderWordInput()}
        {activeStep === 1 && renderQuestions()}
        {activeStep === 2 && renderResults()}
      </Box>
    </Box>
  );
};

export default Learning;