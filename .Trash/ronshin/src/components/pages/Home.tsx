import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { GridRow, GridCol } from '../shared/GridLayout';
import { useAuth } from '../../hooks/useAuth';

export const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      title: '論文から新聞を生成',
      description: '学術論文を新聞形式に自動変換し、研究内容を視覚的にわかりやすく表現します。',
    },
    {
      title: 'AIによる自動解析',
      description: 'Vertex AI Gemini 2.5 Proを活用し、論文の重要なポイントを自動で抽出・構造化します。',
    },
    {
      title: 'カスタマイズ可能',
      description: '複数のテンプレートから選択し、レイアウトやデザインを自由にカスタマイズできます。',
    },
    {
      title: '共有機能',
      description: '生成した新聞を研究グループ内で共有し、最新の研究成果を効率的に共有できます。',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ヒーローセクション */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <GridRow>
            <GridCol xs={12} md={6}>
              <Typography
                component="h1"
                variant="h2"
                sx={{ mb: 4, fontWeight: 'bold' }}
              >
                論文を新聞形式で
                <br />
                わかりやすく共有
              </Typography>
              <Typography variant="h5" sx={{ mb: 4 }}>
                研究成果を視覚的に表現し、効果的な情報共有を実現します
              </Typography>
              {!user && (
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => navigate('/signup')}
                  sx={{ mr: 2 }}
                >
                  無料で始める
                </Button>
              )}
              {user && (
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => navigate('/create')}
                >
                  新聞を作成
                </Button>
              )}
            </GridCol>
          </GridRow>
        </Container>
      </Box>

      {/* 機能紹介セクション */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography
          component="h2"
          variant="h3"
          align="center"
          sx={{ mb: 6 }}
        >
          主な機能
        </Typography>
        <GridRow spacing={4}>
          {features.map((feature, index) => (
            <GridCol xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography
                    gutterBottom
                    variant="h5"
                    component="h3"
                    sx={{ mb: 2 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </GridCol>
          ))}
        </GridRow>
      </Container>

      {/* CTAセクション */}
      <Box
        sx={{
          bgcolor: 'grey.100',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography variant="h4" component="h2" gutterBottom>
              研究成果の共有を、もっと効果的に
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              Ronshinで、あなたの研究を魅力的に発信しましょう
            </Typography>
            {!user && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/signup')}
              >
                今すぐ始める
              </Button>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};
