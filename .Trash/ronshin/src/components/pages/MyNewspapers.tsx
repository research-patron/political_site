import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { GridRow, GridCol } from '../shared/GridLayout';
import { LoadingButton } from './shared/FormComponents';
import type { Newspaper } from '../../types';

export const MyNewspapers = () => {
  const navigate = useNavigate();
  const [newspapers] = useState<Newspaper[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNewspaper, setSelectedNewspaper] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, newspaperId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedNewspaper(newspaperId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNewspaper(null);
  };

  const handleEdit = async () => {
    if (selectedNewspaper) {
      setIsLoading(true);
      try {
        // TODO: Implement edit functionality
        await new Promise(resolve => setTimeout(resolve, 1000));
        handleMenuClose();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleShare = async () => {
    if (selectedNewspaper) {
      setIsLoading(true);
      try {
        // TODO: Implement share functionality
        await new Promise(resolve => setTimeout(resolve, 1000));
        handleMenuClose();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (selectedNewspaper) {
      setIsLoading(true);
      try {
        // TODO: Implement delete functionality
        await new Promise(resolve => setTimeout(resolve, 1000));
        handleMenuClose();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return '非公開';
      case 'group':
        return 'グループ内';
      case 'public':
        return '公開';
      default:
        return '不明';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            マイ新聞一覧
          </Typography>
          <LoadingButton
            variant="contained"
            onClick={() => navigate('/create')}
            isLoading={false}
          >
            新しい新聞を作成
          </LoadingButton>
        </Box>

        {newspapers.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              まだ新聞が作成されていません
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              「新しい新聞を作成」ボタンから、最初の新聞を作成してみましょう
            </Typography>
            <LoadingButton
              variant="outlined"
              onClick={() => navigate('/create')}
              isLoading={false}
            >
              新聞を作成する
            </LoadingButton>
          </Paper>
        ) : (
          <GridRow spacing={3}>
            {newspapers.map((newspaper) => (
              <GridCol xs={12} sm={6} md={4} key={newspaper.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {newspaper.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, newspaper.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      作成日: {new Date(newspaper.createdAt).toLocaleDateString()}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={getVisibilityLabel(newspaper.visibility)}
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        size="small"
                        label={newspaper.template}
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <LoadingButton
                      size="small"
                      onClick={() => window.open(`/preview/${newspaper.id}`)}
                      isLoading={false}
                    >
                      プレビュー
                    </LoadingButton>
                    <LoadingButton
                      size="small"
                      onClick={() => window.open(`/pdf/${newspaper.id}`)}
                      isLoading={false}
                    >
                      PDF表示
                    </LoadingButton>
                  </CardActions>
                </Card>
              </GridCol>
            ))}
          </GridRow>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit} disabled={isLoading}>編集</MenuItem>
          <MenuItem onClick={handleShare} disabled={isLoading}>共有</MenuItem>
          <MenuItem onClick={handleDelete} disabled={isLoading} sx={{ color: 'error.main' }}>
            削除
          </MenuItem>
        </Menu>
      </Box>
    </Container>
  );
};
