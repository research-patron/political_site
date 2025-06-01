import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Paper,
  CircularProgress,
  Divider,
  Button,
  useTheme,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  LocalFireDepartment as FireIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getAuth } from 'firebase/auth';

const Ranking = () => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [rankings, setRankings] = useState({
    weekly: [],
    monthly: [],
  });
  const [userRank, setUserRank] = useState({
    weekly: 0,
    monthly: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Firebase Auth から ID トークンを取得
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }
      
      const idToken = await user.getIdToken();
      const functionUrl = 'https://asia-northeast1-pochitan-12066.cloudfunctions.net/getLeaderboard';
      
      // 週間ランキング取得
      const weeklyResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ period: 'weekly', limit: 20 })
      });
      
      // 月間ランキング取得
      const monthlyResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ period: 'monthly', limit: 20 })
      });

      if (!weeklyResponse.ok || !monthlyResponse.ok) {
        throw new Error('ランキングの取得に失敗しました');
      }

      const weeklyResult = await weeklyResponse.json();
      const monthlyResult = await monthlyResponse.json();

      setRankings({
        weekly: weeklyResult.rankings || [],
        monthly: monthlyResult.rankings || [],
      });

      setUserRank({
        weekly: weeklyResult.userRank || 0,
        monthly: monthlyResult.userRank || 0,
      });
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setError('ランキングの取得に失敗しました。後でもう一度お試しください。');
      // エラー時のデフォルト値を設定
      setRankings({ weekly: [], monthly: [] });
      setUserRank({ weekly: 0, monthly: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <TrophyIcon sx={{ color: '#FFD700', fontSize: 28 }} />;
      case 2:
        return <TrophyIcon sx={{ color: '#C0C0C0', fontSize: 24 }} />;
      case 3:
        return <TrophyIcon sx={{ color: '#CD7F32', fontSize: 20 }} />;
      default:
        return null;
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return {
          backgroundColor: '#FFF9E6',
          borderLeft: '4px solid #FFD700',
        };
      case 2:
        return {
          backgroundColor: '#F5F5F5',
          borderLeft: '4px solid #C0C0C0',
        };
      case 3:
        return {
          backgroundColor: '#FFF5F0',
          borderLeft: '4px solid #CD7F32',
        };
      default:
        return {};
    }
  };

  const currentRankings = tabValue === 0 ? rankings.weekly : rankings.monthly;
  const currentUserRank = tabValue === 0 ? userRank.weekly : userRank.monthly;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        ランキング
      </Typography>

      {/* エラー表示 */}
      {error && (
        <Box sx={{ mb: 3, p: 3, textAlign: 'center', bgcolor: 'error.light', borderRadius: 2 }}>
          <Typography variant="h6" color="error.main" gutterBottom>
            エラー
          </Typography>
          <Typography variant="body1" color="error.dark" paragraph>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="error" 
            onClick={fetchRankings}
            sx={{ textTransform: 'none' }}
          >
            再読み込み
          </Button>
        </Box>
      )}

      {/* ユーザーの順位表示 */}
      {!error && currentUserRank > 0 && (
        <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', opacity: 0.9 }}>
                  あなたの順位
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 700, color: 'white' }}>
                  {currentUserRank}位
                </Typography>
              </Box>
              <TrophyIcon sx={{ fontSize: 80, color: 'white', opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="週間ランキング" />
          <Tab label="月間ランキング" />
        </Tabs>

        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="error" gutterBottom>
                {error}
              </Typography>
              <Button variant="outlined" onClick={fetchRankings} sx={{ mt: 2 }}>
                再読み込み
              </Button>
            </Box>
          ) : currentRankings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">
                まだランキングデータがありません
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {currentRankings.map((user, index) => {
                const rank = index + 1;
                const isCurrentUser = user.userId === userProfile?.uid;

                return (
                  <React.Fragment key={user.userId}>
                    <ListItem
                      sx={{
                        py: 2,
                        px: 3,
                        ...getRankStyle(rank),
                        backgroundColor: isCurrentUser 
                          ? theme.palette.primary.light + '40'
                          : getRankStyle(rank).backgroundColor,
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: 60 }}>
                        {getRankIcon(rank) || (
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {rank}
                          </Typography>
                        )}
                      </Box>

                      <ListItemAvatar>
                        <Avatar src={user.photoURL} sx={{ width: 48, height: 48 }}>
                          {user.displayName?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {user.displayName}
                            </Typography>
                            {isCurrentUser && (
                              <Chip label="You" size="small" color="primary" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              レベル {user.level}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              正解数: {user.totalCorrect}
                            </Typography>
                          </Box>
                        }
                      />

                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                          {user.score}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ポイント
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < currentRankings.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* ランキング説明 */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          ランキングについて
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <StarIcon color="primary" />
            <Box>
              <Typography variant="subtitle2">ポイント計算</Typography>
              <Typography variant="body2" color="text.secondary">
                正解した問題数 × 10ポイント
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingUpIcon color="secondary" />
            <Box>
              <Typography variant="subtitle2">更新タイミング</Typography>
              <Typography variant="body2" color="text.secondary">
                リアルタイムで更新されます
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FireIcon color="warning" />
            <Box>
              <Typography variant="subtitle2">特典</Typography>
              <Typography variant="body2" color="text.secondary">
                上位ランカーには特別なバッジが付与されます
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Ranking;