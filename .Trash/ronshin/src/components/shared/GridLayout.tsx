import { Box, BoxProps } from '@mui/material';
import { ReactNode } from 'react';

interface GridLayoutProps extends BoxProps {
  children: ReactNode;
  spacing?: number;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export const GridRow = ({ children, spacing = 2, ...props }: GridLayoutProps) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: spacing * 8,
        gridTemplateColumns: 'repeat(12, 1fr)',
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export const GridCol = ({
  children,
  xs = 12,
  sm,
  md,
  lg,
  xl,
  ...props
}: GridLayoutProps) => {
  return (
    <Box
      sx={{
        gridColumn: {
          xs: `span ${xs}`,
          ...(sm && { sm: `span ${sm}` }),
          ...(md && { md: `span ${md}` }),
          ...(lg && { lg: `span ${lg}` }),
          ...(xl && { xl: `span ${xl}` }),
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};
