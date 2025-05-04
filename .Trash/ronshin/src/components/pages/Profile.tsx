import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import { GridRow, GridCol } from '../shared/GridLayout';
import { ActionButtons, LoadingButton } from './shared/FormComponents';
import { useAuth } from '../../hooks/useAuth';

export const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Implement profile update logic
      setSuccess('プロフィールを更新しました');
      setIsEditing(false);
    } catch (err) {
      setError('プロフィールの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            プロフィール設定
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <GridRow spacing={4}>
            <GridCol xs={12}>
              <Typography variant="h6" gutterBottom>
                会員情報
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Chip
                  label={user?.role === 'premium' ? 'プレミアム会員' : '無料会員'}
                  color={user?.role === 'premium' ? 'primary' : 'default'}
                  sx={{ mr: 1 }}
                />
                {user?.role === 'free' && (
                  <LoadingButton
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => {/* TODO: Implement upgrade flow */}}
                    isLoading={false}
                  >
                    プレミアムにアップグレード
                  </LoadingButton>
                )}
              </Box>
              
              <Divider sx={{ my: 3 }} />

              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="name"
                    label="名前"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <ActionButtons
                    isSubmitting={isSubmitting}
                    onCancel={() => setIsEditing(false)}
                  />
                </form>
              ) : (
                <Box>
                  <GridRow spacing={2}>
                    <GridCol xs={12} sm={3}>
                      <Typography color="text.secondary">メールアドレス</Typography>
                    </GridCol>
                    <GridCol xs={12} sm={9}>
                      <Typography>{user?.email}</Typography>
                    </GridCol>

                    <GridCol xs={12} sm={3}>
                      <Typography color="text.secondary">名前</Typography>
                    </GridCol>
                    <GridCol xs={12} sm={9}>
                      <Typography>{user?.name}</Typography>
                    </GridCol>

                    <GridCol xs={12} sm={3}>
                      <Typography color="text.secondary">新聞作成回数</Typography>
                    </GridCol>
                    <GridCol xs={12} sm={9}>
                      <Typography>{user?.generationCount} 回</Typography>
                    </GridCol>

                    <GridCol xs={12} sm={3}>
                      <Typography color="text.secondary">保存済み新聞</Typography>
                    </GridCol>
                    <GridCol xs={12} sm={9}>
                      <Typography>{user?.savedNewspapers} 件</Typography>
                    </GridCol>
                  </GridRow>

                  <Box sx={{ mt: 3 }}>
                    <LoadingButton
                      variant="outlined"
                      onClick={() => setIsEditing(true)}
                      isLoading={false}
                    >
                      プロフィールを編集
                    </LoadingButton>
                  </Box>
                </Box>
              )}
            </GridCol>
          </GridRow>
        </Paper>
      </Box>
    </Container>
  );
};
