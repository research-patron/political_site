import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Avatar,
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';

const Settings = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLearning, setIsEditingLearning] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    targetExam: '',
    targetLevel: '',
    dailyGoal: 10,
    reminderTime: '20:00',
    isDarkMode: false,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const examTypes = ['英検', 'TOEFL', 'TOEIC'];
  
  const examLevels = {
    '英検': ['1級', '準1級', '2級', '準2級', '3級', '4級', '5級'],
    'TOEFL': ['120', '100', '80', '60', '40'],
    'TOEIC': ['990', '900', '800', '700', '600', '500'],
  };

  // 英検のTOEFL換算表（一般的な換算値）
  const eikenToToeflConversion = {
    '1級': 107,    // 95-120点の平均
    '準1級': 80,   // 70-90点の平均
    '2級': 56,     // 42-71点の平均
    '準2級': 35,   // 45点未満
    '3級': 25,     // TOEFL測定不可レベル（推定）
    '4級': 20,     // TOEFL測定不可レベル（推定）
    '5級': 15      // TOEFL測定不可レベル（推定）
  };

  useEffect(() => {
    if (userProfile && currentUser) {
      setFormData({
        displayName: currentUser.displayName || '',
        targetExam: userProfile.settings?.targetExam || '',
        targetLevel: userProfile.settings?.targetLevel || '',
        dailyGoal: userProfile.settings?.dailyGoal || 10,
        reminderTime: userProfile.settings?.reminderTime || '20:00',
        isDarkMode: userProfile.settings?.isDarkMode || false,
      });
    }
  }, [userProfile, currentUser]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Firebaseユーザープロファイルを更新
      if (formData.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, {
          displayName: formData.displayName,
        });
      }

      // Firestoreのユーザー設定とプロフィールを更新
      await updateUserProfile({
        displayName: formData.displayName,
        settings: {
          targetExam: formData.targetExam,
          targetLevel: formData.targetLevel,
          dailyGoal: formData.dailyGoal,
          reminderTime: formData.reminderTime,
          isDarkMode: formData.isDarkMode,
        },
      });

      setSnackbar({ open: true, message: '設定を保存しました', severity: 'success' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({ open: true, message: '設定の保存に失敗しました', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLearning = async () => {
    setLoading(true);
    try {
      // 学習設定のみを更新
      await updateUserProfile({
        settings: {
          ...userProfile?.settings,
          targetExam: formData.targetExam,
          targetLevel: formData.targetLevel,
          dailyGoal: formData.dailyGoal,
          reminderTime: formData.reminderTime,
          isDarkMode: formData.isDarkMode,
        },
      });

      setSnackbar({ open: true, message: '学習設定を保存しました', severity: 'success' });
      setIsEditingLearning(false);
    } catch (error) {
      console.error('Error saving learning settings:', error);
      setSnackbar({ open: true, message: '学習設定の保存に失敗しました', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // 実際のアカウント削除処理は実装しない（要件定義外）
    setSnackbar({ open: true, message: 'この機能は現在利用できません', severity: 'info' });
    setDeleteDialog(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      setSnackbar({ open: true, message: 'ログアウトに失敗しました', severity: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        設定
      </Typography>

      {/* プロフィール設定 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">プロフィール</Typography>
            {!isEditing ? (
              <IconButton onClick={() => setIsEditing(true)}>
                <EditIcon />
              </IconButton>
            ) : (
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading}
              >
                保存
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={currentUser?.photoURL}
              sx={{ width: 80, height: 80, mr: 3 }}
            >
              {currentUser?.displayName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body1" gutterBottom>
                {currentUser?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                レベル {userProfile?.level || 1} • {userProfile?.experience || 0} EXP
              </Typography>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="ニックネーム"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            disabled={!isEditing}
            sx={{ mb: 2 }}
          />
        </CardContent>
      </Card>

      {/* 学習設定 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">学習設定</Typography>
            {!isEditingLearning ? (
              <IconButton onClick={() => setIsEditingLearning(true)}>
                <EditIcon />
              </IconButton>
            ) : (
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveLearning}
                disabled={loading}
              >
                保存
              </Button>
            )}
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>目標資格</InputLabel>
            <Select
              value={formData.targetExam}
              label="目標資格"
              onChange={(e) => setFormData({ ...formData, targetExam: e.target.value, targetLevel: '' })}
              disabled={!isEditingLearning}
            >
              <MenuItem value="">選択してください</MenuItem>
              {examTypes.map((exam) => (
                <MenuItem key={exam} value={exam}>
                  {exam}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {formData.targetExam && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>目標レベル</InputLabel>
              <Select
                value={formData.targetLevel}
                label="目標レベル"
                onChange={(e) => setFormData({ ...formData, targetLevel: e.target.value })}
                disabled={!isEditingLearning}
              >
                <MenuItem value="">選択してください</MenuItem>
                {examLevels[formData.targetExam].map((level) => (
                  <MenuItem key={level} value={level}>
                    {formData.targetExam === 'TOEFL' ? `${level}点` : 
                     formData.targetExam === 'TOEIC' ? `${level}点` : level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            type="number"
            label="1日の目標学習単語数"
            value={formData.dailyGoal}
            onChange={(e) => setFormData({ ...formData, dailyGoal: parseInt(e.target.value) || 10 })}
            disabled={!isEditingLearning}
            inputProps={{ min: 1, max: 100 }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="time"
            label="リマインダー時刻"
            value={formData.reminderTime}
            onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
            disabled={!isEditingLearning}
            InputLabelProps={{ shrink: true }}
          />
        </CardContent>
      </Card>

      {/* アプリ設定 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            アプリ設定
          </Typography>

          <List>
            <ListItem>
              <ListItemText
                primary="ダークモード"
                secondary="アプリの外観をダークモードに切り替えます"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={formData.isDarkMode}
                  onChange={(e) => setFormData({ ...formData, isDarkMode: e.target.checked })}
                  disabled={!isEditing && !isEditingLearning}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* アカウント管理 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            アカウント管理
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              fullWidth
            >
              ログアウト
            </Button>

            <Divider />

            <Alert severity="warning">
              アカウントを削除すると、すべてのデータが失われます。この操作は取り消せません。
            </Alert>

            <Button
              variant="text"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialog(true)}
              fullWidth
            >
              アカウントを削除
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* アカウント削除確認ダイアログ */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>アカウントの削除</DialogTitle>
        <DialogContent>
          <Typography>
            本当にアカウントを削除しますか？この操作は取り消せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>キャンセル</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            削除する
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;