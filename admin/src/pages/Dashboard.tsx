import { useEffect, useState } from 'react';
import { Card, CardContent, Grid, Typography, Box, CircularProgress } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import EventIcon from '@mui/icons-material/Event';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VideoCallIcon from '@mui/icons-material/VideoCall';

const COLORS = ['#1e3a5f', '#4a6fa5', '#c4a962', '#917833', '#28a745', '#dc3545'];

interface DashboardData {
  users: { total: number; new: number };
  subscriptions: { active: number };
  bookings: { total: number };
  videoReviews: { pending: number };
  content: { lessons: number; views: number };
}

const StatCard = ({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}15`,
            borderRadius: 2,
            p: 1,
            color: color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/analytics/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Mock data for charts
  const subscriptionData = [
    { name: 'Стандарт', value: 45 },
    { name: 'Про', value: 30 },
    { name: 'Максимум', value: 15 },
  ];

  const viewsData = [
    { name: 'Пн', views: 120 },
    { name: 'Вт', views: 150 },
    { name: 'Ср', views: 180 },
    { name: 'Чт', views: 140 },
    { name: 'Пт', views: 200 },
    { name: 'Сб', views: 250 },
    { name: 'Вс', views: 220 },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Дашборд
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Обзор ключевых метрик за последние 30 дней
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Всего пользователей"
            value={data?.users.total || 0}
            icon={<PeopleIcon />}
            color="#1e3a5f"
            subtitle={`+${data?.users.new || 0} новых`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Активные подписки"
            value={data?.subscriptions.active || 0}
            icon={<CardMembershipIcon />}
            color="#28a745"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Бронирований"
            value={data?.bookings.total || 0}
            icon={<EventIcon />}
            color="#c4a962"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Уроков"
            value={data?.content.lessons || 0}
            icon={<VideoLibraryIcon />}
            color="#4a6fa5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Просмотров"
            value={data?.content.views || 0}
            icon={<TrendingUpIcon />}
            color="#917833"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Ожидают разбор"
            value={data?.videoReviews.pending || 0}
            icon={<VideoCallIcon />}
            color="#dc3545"
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Просмотры за неделю
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={viewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Распределение подписок
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {subscriptionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

