import { Layout as RaLayout, LayoutProps, Menu, useGetIdentity } from 'react-admin';
import { Box, Typography } from '@mui/material';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import CommentIcon from '@mui/icons-material/Comment';
import PaymentIcon from '@mui/icons-material/Payment';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import SportsIcon from '@mui/icons-material/Sports';
import EventIcon from '@mui/icons-material/Event';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import NotificationsIcon from '@mui/icons-material/Notifications';

const CustomMenu = () => (
  <Menu>
    <Menu.DashboardItem primaryText="Дашборд" leftIcon={<DashboardIcon />} />
    
    <Menu.Item to="/users" primaryText="Пользователи" leftIcon={<PeopleIcon />} />
    
    <Box sx={{ mt: 2, mb: 1, px: 2 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        КОНТЕНТ
      </Typography>
    </Box>
    <Menu.Item to="/categories" primaryText="Категории" leftIcon={<CategoryIcon />} />
    <Menu.Item to="/lessons" primaryText="Уроки" leftIcon={<VideoLibraryIcon />} />
    <Menu.Item to="/comments" primaryText="Комментарии" leftIcon={<CommentIcon />} />
    
    <Box sx={{ mt: 2, mb: 1, px: 2 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        МОНЕТИЗАЦИЯ
      </Typography>
    </Box>
    <Menu.Item to="/plans" primaryText="Тарифы" leftIcon={<PaymentIcon />} />
    <Menu.Item to="/subscriptions" primaryText="Подписки" leftIcon={<CardMembershipIcon />} />
    
    <Box sx={{ mt: 2, mb: 1, px: 2 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        ТРЕНИРОВКИ
      </Typography>
    </Box>
    <Menu.Item to="/coaches" primaryText="Тренеры" leftIcon={<SportsIcon />} />
    <Menu.Item to="/bookings" primaryText="Бронирования" leftIcon={<EventIcon />} />
    <Menu.Item to="/video-reviews" primaryText="Видеоразборы" leftIcon={<VideoCallIcon />} />
    
    <Box sx={{ mt: 2, mb: 1, px: 2 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        КОММУНИКАЦИИ
      </Typography>
    </Box>
    <Menu.Item to="/support/tickets" primaryText="Обращения" leftIcon={<SupportAgentIcon />} />
    <Menu.Item to="/push" primaryText="Push-уведомления" leftIcon={<NotificationsIcon />} />
  </Menu>
);

const AppBar = () => {
  const { identity } = useGetIdentity();
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        px: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" fontWeight={700} color="primary.contrastText">
          ⛸️ InSkate Admin
        </Typography>
      </Box>
      {identity && (
        <Typography variant="body2" color="primary.contrastText">
          {identity.fullName}
        </Typography>
      )}
    </Box>
  );
};

export const Layout = (props: LayoutProps) => (
  <RaLayout {...props} menu={CustomMenu} />
);

