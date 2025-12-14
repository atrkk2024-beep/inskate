import { Admin, Resource } from 'react-admin';

import { authProvider } from './providers/authProvider';
import { dataProvider } from './providers/dataProvider';
import { theme } from './theme';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { LoginPage } from './pages/Login';

// Resources
import { UserList, UserShow } from './resources/users';
import { CategoryList, CategoryEdit, CategoryCreate } from './resources/categories';
import { LessonList, LessonEdit, LessonCreate, LessonShow } from './resources/lessons';
import { CommentList } from './resources/comments';
import { PlanList, PlanEdit, PlanCreate } from './resources/plans';
import { SubscriptionList } from './resources/subscriptions';
import { CoachList, CoachEdit, CoachCreate } from './resources/coaches';
import { BookingList, BookingShow } from './resources/bookings';
import { VideoReviewList, VideoReviewShow } from './resources/video-reviews';
import { TicketList, TicketShow } from './resources/tickets';
import { PushNotificationList, PushNotificationCreate } from './resources/push';

// Icons
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

function App() {
  return (
    <Admin
      authProvider={authProvider}
      dataProvider={dataProvider}
      theme={theme}
      layout={Layout}
      dashboard={Dashboard}
      loginPage={LoginPage}
      requireAuth
    >
      <Resource
        name="users"
        list={UserList}
        show={UserShow}
        icon={PeopleIcon}
        options={{ label: 'Пользователи' }}
      />
      <Resource
        name="categories"
        list={CategoryList}
        edit={CategoryEdit}
        create={CategoryCreate}
        icon={CategoryIcon}
        options={{ label: 'Категории' }}
      />
      <Resource
        name="lessons"
        list={LessonList}
        edit={LessonEdit}
        create={LessonCreate}
        show={LessonShow}
        icon={VideoLibraryIcon}
        options={{ label: 'Уроки' }}
      />
      <Resource
        name="comments"
        list={CommentList}
        icon={CommentIcon}
        options={{ label: 'Комментарии' }}
      />
      <Resource
        name="plans"
        list={PlanList}
        edit={PlanEdit}
        create={PlanCreate}
        icon={PaymentIcon}
        options={{ label: 'Тарифы' }}
      />
      <Resource
        name="subscriptions"
        list={SubscriptionList}
        icon={CardMembershipIcon}
        options={{ label: 'Подписки' }}
      />
      <Resource
        name="coaches"
        list={CoachList}
        edit={CoachEdit}
        create={CoachCreate}
        icon={SportsIcon}
        options={{ label: 'Тренеры' }}
      />
      <Resource
        name="bookings"
        list={BookingList}
        show={BookingShow}
        icon={EventIcon}
        options={{ label: 'Бронирования' }}
      />
      <Resource
        name="video-reviews"
        list={VideoReviewList}
        show={VideoReviewShow}
        icon={VideoCallIcon}
        options={{ label: 'Видеоразборы' }}
      />
      <Resource
        name="support/tickets"
        list={TicketList}
        show={TicketShow}
        icon={SupportAgentIcon}
        options={{ label: 'Обращения' }}
      />
      <Resource
        name="push"
        list={PushNotificationList}
        create={PushNotificationCreate}
        icon={NotificationsIcon}
        options={{ label: 'Push-уведомления' }}
      />
    </Admin>
  );
}

export default App;

