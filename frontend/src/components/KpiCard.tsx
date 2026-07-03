import { Box, Card, CardContent, Typography } from '@mui/material';
import { Icon } from './Icon';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  bg?: string;
  onClick?: () => void;
}

export default function KpiCard({ title, value, icon, color = 'primary.main', bg = 'primary.50', onClick }: KpiCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid', borderColor: 'divider',
        ...(onClick ? { cursor: 'pointer', '&:hover': { borderColor: color, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }, transition: 'all 0.2s' } : {}),
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            <Icon name={icon} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">{title}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
