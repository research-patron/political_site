import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import { GridRow, GridCol } from '../shared/GridLayout';
import { LoadingButton } from './shared/FormComponents';

const steps = [
  '論文のアップロード',
  'テンプレートの選択',
  '新聞の生成',
  'レイアウトの調整',
  'プレビュー・保存'
];

export const CreateNewspaper = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    setIsSubmitting(true);
    try {
      // TODO: 各ステップに応じた処理を実装
      await new Promise(resolve => setTimeout(resolve, 1000));
      setActiveStep((prevStep) => prevStep + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <GridRow spacing={3}>
            <GridCol xs={12}>
              <Typography variant="h6" gutterBottom>
                論文をアップロード（最大5つ）
              </Typography>
              {/* TODO: 論文アップロードコンポーネントを実装 */}
              <Typography color="text.secondary">
                アップロードコンポーネントをここに実装
              </Typography>
            </GridCol>
          </GridRow>
        );
      case 1:
        return (
          <GridRow spacing={3}>
            <GridCol xs={12}>
              <Typography variant="h6" gutterBottom>
                テンプレートを選択
              </Typography>
              {/* TODO: テンプレート選択コンポーネントを実装 */}
              <Typography color="text.secondary">
                テンプレート選択コンポーネントをここに実装
              </Typography>
            </GridCol>
          </GridRow>
        );
      case 2:
        return (
          <GridRow spacing={3}>
            <GridCol xs={12}>
              <Typography variant="h6" gutterBottom>
                新聞を生成中
              </Typography>
              {/* TODO: 生成プロセスコンポーネントを実装 */}
              <Typography color="text.secondary">
                生成プロセスコンポーネントをここに実装
              </Typography>
            </GridCol>
          </GridRow>
        );
      case 3:
        return (
          <GridRow spacing={3}>
            <GridCol xs={12}>
              <Typography variant="h6" gutterBottom>
                レイアウトを調整
              </Typography>
              {/* TODO: レイアウト調整コンポーネントを実装 */}
              <Typography color="text.secondary">
                レイアウト調整コンポーネントをここに実装
              </Typography>
            </GridCol>
          </GridRow>
        );
      case 4:
        return (
          <GridRow spacing={3}>
            <GridCol xs={12}>
              <Typography variant="h6" gutterBottom>
                プレビューと保存
              </Typography>
              {/* TODO: プレビュー・保存コンポーネントを実装 */}
              <Typography color="text.secondary">
                プレビュー・保存コンポーネントをここに実装
              </Typography>
            </GridCol>
          </GridRow>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          新聞を作成
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ py: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4 }}>
          {getStepContent(activeStep)}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            {activeStep !== 0 && (
              <LoadingButton
                onClick={handleBack}
                sx={{ mr: 1 }}
                isLoading={false}
              >
                戻る
              </LoadingButton>
            )}
            <LoadingButton
              variant="contained"
              onClick={handleNext}
              isLoading={isSubmitting}
              disabled={activeStep === steps.length - 1}
            >
              {activeStep === steps.length - 1 ? '完了' : '次へ'}
            </LoadingButton>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};
