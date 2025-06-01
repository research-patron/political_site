import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  LinearProgress,
  Chip,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  LocalFireDepartment as FireIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Progress = () => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [period, setPeriod] = useState('week');
  const [learningData, setLearningData] = useState([]);
  const [stats, setStats] = useState({
    totalWords: 0,
    totalTime: 0,
    averageAccuracy: 0,
    bestStreak: 0,
    totalSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearningData();
  }, [userProfile, period]);

  const fetchLearningData = async () => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (period === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const q = query(
        collection(db, 'learningRecords'),
        where('userId', '==', userProfile.uid),
        where('sessionDate', '>=', startDate),
        orderBy('sessionDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const records = [];
      let totalWords = 0;
      let totalTime = 0;
      let totalCorrect = 0;
      let totalQuestions = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.sessionDate && typeof data.sessionDate.toDate === 'function') {
          records.push({
            ...data,
            date: data.sessionDate.toDate()
          });
          
          totalWords += data.questionsAnswered || 0;
          totalTime += data.duration || 0;
          totalCorrect += data.correctAnswers || 0;
          totalQuestions += data.questionsAnswered || 0;
        }
      });

      const averageAccuracy = totalQuestions > 0 
        ? Math.round((totalCorrect / totalQuestions) * 100) 
        : 0;

      setLearningData(records);
      setStats({
        totalWords,
        totalTime: Math.round(totalTime / 60), // 分単位
        averageAccuracy,
        bestStreak: userProfile.streak || 0,
        totalSessions: records.length,
      });
    } catch (error) {
      console.error('Error fetching learning data:', error);
      // エラーが発生してもデフォルト値を設定
      setLearningData([]);
      setStats({
        totalWords: 0,
        totalTime: 0,
        averageAccuracy: 0,
        bestStreak: userProfile?.streak || 0,
        totalSessions: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const labels = [];
    const data = [];
    
    if (period === 'week') {
      // 過去7日間のデータ
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
        labels.push(dateStr);
        
        const dayData = learningData.filter(record => 
          record.date.toDateString() === date.toDateString()
        );
        const dayTotal = dayData.reduce((sum, record) => sum + record.questionsAnswered, 0);
        data.push(dayTotal);
      }
    } else if (period === 'month') {
      // 過去30日間のデータ（週単位で集計）
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        
        const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
        labels.push(weekLabel);
        
        const weekData = learningData.filter(record => 
          record.date >= weekStart && record.date <= weekEnd
        );
        const weekTotal = weekData.reduce((sum, record) => sum + record.questionsAnswered, 0);
        data.push(weekTotal);
      }
    }

    return {
      labels,
      datasets: [
        {
          label: '学習単語数',
          data,
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light,
          tension: 0.4,
        },
      ],
    };
  };

  const getAccuracyData = () => {
    const correctCount = learningData.reduce((sum, record) => sum + record.correctAnswers, 0);
    const incorrectCount = learningData.reduce((sum, record) => 
      sum + (record.questionsAnswered - record.correctAnswers), 0
    );

    return {
      labels: ['正解', '不正解'],
      datasets: [
        {
          data: [correctCount, incorrectCount],
          backgroundColor: [
            theme.palette.success.main,
            theme.palette.error.main,
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // 日付ごとの学習データを集計
    const dailyData = {};
    learningData.forEach(record => {
      const dateKey = record.date.toDateString();
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          totalWords: 0,
          correctAnswers: 0,
          totalQuestions: 0,
          sessions: 0
        };
      }
      dailyData[dateKey].totalWords += record.questionsAnswered || 0;
      dailyData[dateKey].correctAnswers += record.correctAnswers || 0;
      dailyData[dateKey].totalQuestions += record.questionsAnswered || 0;
      dailyData[dateKey].sessions += 1;
    });

    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    const calendarDays = [];

    // 月の最初の日の前の空白
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }

    // 月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    return (
      <Box>
        {/* 月の表示 */}
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
          {currentYear}年 {currentMonth + 1}月
        </Typography>

        {/* 曜日ヘッダー */}
        <Grid container spacing={0.5}>
          {weekDays.map((day, index) => (
            <Grid item xs={12/7} key={index}>
              <Typography 
                variant="caption" 
                sx={{ 
                  textAlign: 'center', 
                  display: 'block',
                  fontWeight: 600,
                  color: index === 0 ? theme.palette.error.main : index === 6 ? theme.palette.info.main : 'text.secondary'
                }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* カレンダー本体 */}
        <Grid container spacing={0.5} sx={{ mt: 1 }}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <Grid item xs={12/7} key={`empty-${index}`} />;
            }

            const currentDate = new Date(currentYear, currentMonth, day);
            const dateKey = currentDate.toDateString();
            const dayData = dailyData[dateKey];
            const isToday = currentDate.toDateString() === today.toDateString();
            const hasData = !!dayData;
            
            return (
              <Grid item xs={12/7} key={day}>
                <Paper
                  elevation={isToday ? 3 : hasData ? 1 : 0}
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    backgroundColor: hasData 
                      ? theme.palette.success.light 
                      : isToday 
                        ? theme.palette.primary.light 
                        : theme.palette.grey[100],
                    border: isToday ? `2px solid ${theme.palette.primary.main}` : 'none',
                    minHeight: 60,
                    cursor: hasData ? 'pointer' : 'default',
                    '&:hover': hasData ? {
                      backgroundColor: theme.palette.success.main,
                      color: 'white',
                    } : {},
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: isToday ? 700 : 400 }}>
                    {day}
                  </Typography>
                  {hasData && (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>
                        {dayData.totalWords}問
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', color: 'success.dark' }}>
                        {Math.round((dayData.correctAnswers / dayData.totalQuestions) * 100)}%
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* 凡例 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: theme.palette.success.light, borderRadius: 0.5 }} />
            <Typography variant="caption">学習済み</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: theme.palette.primary.light, border: `2px solid ${theme.palette.primary.main}`, borderRadius: 0.5 }} />
            <Typography variant="caption">今日</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const statCards = [
    {
      title: '総学習単語数',
      value: stats.totalWords,
      unit: '単語',
      icon: <SchoolIcon />,
      color: theme.palette.primary.main,
    },
    {
      title: '学習時間',
      value: stats.totalTime,
      unit: '分',
      icon: <CalendarIcon />,
      color: theme.palette.secondary.main,
    },
    {
      title: '平均正答率',
      value: stats.averageAccuracy,
      unit: '%',
      icon: <CheckCircleIcon />,
      color: theme.palette.success.main,
    },
    {
      title: '連続学習',
      value: stats.bestStreak,
      unit: '日',
      icon: <FireIcon />,
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          学習進捗
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>期間</InputLabel>
          <Select
            value={period}
            label="期間"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="week">週間</MenuItem>
            <MenuItem value="month">月間</MenuItem>
            <MenuItem value="year">年間</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: `${stat.color}20`,
                      color: stat.color,
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {stat.value}
                      <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 0.5 }}>
                        {stat.unit}
                      </Typography>
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* グラフ */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                学習推移
              </Typography>
              {learningData.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <Line
                    data={getChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 10,
                          },
                        },
                      },
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">
                    この期間のデータがありません
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                正答率
              </Typography>
              {learningData.length > 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ width: 200, height: 200 }}>
                    <Doughnut
                      data={getAccuracyData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">
                    データがありません
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 学習カレンダー */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            学習カレンダー
          </Typography>
          {renderCalendar()}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Progress;