import { Box, Button, ButtonProps, CircularProgress } from '@mui/material';
import { ReactNode } from 'react';

interface ActionButtonsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  submitText?: string;
  cancelText?: string;
}

interface LoadingButtonProps extends ButtonProps {
  isLoading: boolean;
  children: ReactNode;
}

export const ActionButtons = ({
  isSubmitting,
  onCancel,
  submitText = '保存',
  cancelText = 'キャンセル',
}: ActionButtonsProps) => (
  <Box sx={{ mt: 3 }}>
    <Button
      type="submit"
      variant="contained"
      sx={{ mr: 1 }}
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          処理中...
        </>
      ) : (
        submitText
      )}
    </Button>
    <Button
      onClick={onCancel}
      disabled={isSubmitting}
    >
      {cancelText}
    </Button>
  </Box>
);

export const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  isLoading,
  children,
  disabled,
  ...props
}) => (
  <Button
    disabled={isLoading || disabled}
    {...props}
  >
    {isLoading ? (
      <>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        処理中...
      </>
    ) : (
      children
    )}
  </Button>
);
