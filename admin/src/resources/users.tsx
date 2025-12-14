import {
  List,
  Datagrid,
  TextField,
  DateField,
  Show,
  SimpleShowLayout,
  FunctionField,
  TextInput,
  SelectInput,
  useRecordContext,
  TopToolbar,
  ExportButton,
  FilterButton,
  Button,
} from 'react-admin';
import { Chip, Box } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

const userFilters = [
  <TextInput key="search" source="search" label="Поиск" alwaysOn />,
  <SelectInput
    key="role"
    source="role"
    label="Роль"
    choices={[
      { id: 'USER', name: 'Пользователь' },
      { id: 'SUBSCRIBER', name: 'Подписчик' },
      { id: 'COACH', name: 'Тренер' },
      { id: 'ADMIN', name: 'Админ' },
    ]}
  />,
  <SelectInput
    key="hasSubscription"
    source="hasSubscription"
    label="Подписка"
    choices={[
      { id: true, name: 'Есть' },
      { id: false, name: 'Нет' },
    ]}
  />,
];

const RoleChip = () => {
  const record = useRecordContext();
  if (!record) return null;

  const roleColors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning'> = {
    USER: 'default',
    SUBSCRIBER: 'success',
    COACH: 'primary',
    ADMIN: 'secondary',
  };

  const roleNames: Record<string, string> = {
    GUEST: 'Гость',
    USER: 'Пользователь',
    SUBSCRIBER: 'Подписчик',
    COACH: 'Тренер',
    MANAGER: 'Менеджер',
    ADMIN: 'Админ',
  };

  return (
    <Chip
      label={roleNames[record.role] || record.role}
      color={roleColors[record.role] || 'default'}
      size="small"
    />
  );
};

const ListActions = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
    <Button
      label="Экспорт CSV"
      onClick={() => {
        const token = localStorage.getItem('token');
        window.open(`/api/users/export/csv?token=${token}`, '_blank');
      }}
    >
      <DownloadIcon />
    </Button>
  </TopToolbar>
);

export const UserList = () => (
  <List filters={userFilters} actions={<ListActions />} sort={{ field: 'createdAt', order: 'DESC' }}>
    <Datagrid rowClick="show">
      <TextField source="phone" label="Телефон" />
      <TextField source="name" label="Имя" />
      <RoleChip />
      <TextField source="country" label="Страна" />
      <FunctionField
        label="Подписка"
        render={(record: any) =>
          record.subscription ? (
            <Chip label={record.subscription.plan} color="success" size="small" />
          ) : (
            <Chip label="Нет" size="small" variant="outlined" />
          )
        }
      />
      <DateField source="createdAt" label="Регистрация" />
    </Datagrid>
  </List>
);

export const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" label="ID" />
      <TextField source="phone" label="Телефон" />
      <TextField source="name" label="Имя" />
      <TextField source="role" label="Роль" />
      <TextField source="country" label="Страна" />
      <DateField source="createdAt" label="Дата регистрации" />
      
      <Box sx={{ mt: 3 }}>
        <FunctionField
          label="Подписка"
          render={(record: any) =>
            record.subscription ? (
              <Box>
                <Chip label={record.subscription.plan} color="success" />
                <Box sx={{ mt: 1 }}>
                  Статус: {record.subscription.status}
                  <br />
                  Действует до: {record.subscription.currentPeriodEndAt}
                </Box>
              </Box>
            ) : (
              'Нет активной подписки'
            )
          }
        />
      </Box>
    </SimpleShowLayout>
  </Show>
);

