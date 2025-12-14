import {
  List,
  Datagrid,
  TextField,
  DateField,
  Show,
  SimpleShowLayout,
  FunctionField,
  SelectInput,
  useRecordContext,
  Button,
  useNotify,
  useRefresh,
} from 'react-admin';
import { Chip, Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const bookingFilters = [
  <SelectInput
    key="status"
    source="status"
    label="Статус"
    choices={[
      { id: 'PENDING', name: 'Ожидает' },
      { id: 'CONFIRMED', name: 'Подтверждено' },
      { id: 'COMPLETED', name: 'Завершено' },
      { id: 'CANCELED', name: 'Отменено' },
      { id: 'NO_SHOW', name: 'Не явился' },
    ]}
    alwaysOn
  />,
];

const statusColors: Record<string, 'warning' | 'success' | 'info' | 'error' | 'default'> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  COMPLETED: 'info',
  CANCELED: 'error',
  NO_SHOW: 'default',
};

const statusNames: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждено',
  COMPLETED: 'Завершено',
  CANCELED: 'Отменено',
  NO_SHOW: 'Не явился',
};

const ActionButtons = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();

  if (!record || record.status !== 'PENDING') return null;

  const updateStatus = async (status: string) => {
    await fetch(`/api/bookings/${record.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ status }),
    });
    notify(status === 'CONFIRMED' ? 'Бронирование подтверждено' : 'Бронирование отменено');
    refresh();
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button label="Подтвердить" onClick={() => updateStatus('CONFIRMED')} color="success">
        <CheckIcon />
      </Button>
      <Button label="Отменить" onClick={() => updateStatus('CANCELED')} color="error">
        <CloseIcon />
      </Button>
    </Box>
  );
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const BookingList = () => (
  <List filters={bookingFilters} sort={{ field: 'createdAt', order: 'DESC' }}>
    <Datagrid rowClick="show">
      <FunctionField
        label="Пользователь"
        render={(record: any) => record.user?.name || record.user?.phone}
      />
      <FunctionField
        label="Тренер"
        render={(record: any) => record.coach?.name}
      />
      <FunctionField
        label="Время"
        render={(record: any) => formatDateTime(record.slot?.startAt)}
      />
      <FunctionField
        label="Тип"
        render={(record: any) => (
          <Chip
            label={record.type === 'PACKAGE' ? 'Пакет' : 'Разово'}
            size="small"
            variant="outlined"
          />
        )}
      />
      <FunctionField
        label="Статус"
        render={(record: any) => (
          <Chip
            label={statusNames[record.status]}
            color={statusColors[record.status]}
            size="small"
          />
        )}
      />
      <DateField source="createdAt" label="Создано" />
      <ActionButtons />
    </Datagrid>
  </List>
);

export const BookingShow = () => (
  <Show>
    <SimpleShowLayout>
      <FunctionField
        label="Пользователь"
        render={(record: any) => `${record.user?.name || ''} (${record.user?.phone})`}
      />
      <FunctionField
        label="Тренер"
        render={(record: any) => record.coach?.name}
      />
      <FunctionField
        label="Время"
        render={(record: any) =>
          `${formatDateTime(record.slot?.startAt)} - ${formatDateTime(record.slot?.endAt)}`
        }
      />
      <TextField source="type" label="Тип" />
      <TextField source="status" label="Статус" />
      <TextField source="notes" label="Заметки" />
      <DateField source="createdAt" label="Создано" />
    </SimpleShowLayout>
  </Show>
);

