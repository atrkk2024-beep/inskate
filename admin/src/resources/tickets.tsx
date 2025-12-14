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

const ticketFilters = [
  <SelectInput
    key="status"
    source="status"
    label="Статус"
    choices={[
      { id: 'OPEN', name: 'Открыт' },
      { id: 'IN_PROGRESS', name: 'В работе' },
      { id: 'RESOLVED', name: 'Решён' },
      { id: 'CLOSED', name: 'Закрыт' },
    ]}
    alwaysOn
  />,
];

const statusColors: Record<string, 'error' | 'warning' | 'success' | 'default'> = {
  OPEN: 'error',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const statusNames: Record<string, string> = {
  OPEN: 'Открыт',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Решён',
  CLOSED: 'Закрыт',
};

const StatusButtons = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();

  if (!record || record.status === 'CLOSED') return null;

  const updateStatus = async (status: string) => {
    await fetch(`/api/support/tickets/${record.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ status }),
    });
    notify('Статус обновлён');
    refresh();
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {record.status === 'OPEN' && (
        <Button label="В работу" onClick={() => updateStatus('IN_PROGRESS')} />
      )}
      {record.status === 'IN_PROGRESS' && (
        <Button label="Решён" onClick={() => updateStatus('RESOLVED')} color="success" />
      )}
      {record.status !== 'CLOSED' && (
        <Button label="Закрыть" onClick={() => updateStatus('CLOSED')} />
      )}
    </Box>
  );
};

export const TicketList = () => (
  <List filters={ticketFilters} sort={{ field: 'createdAt', order: 'DESC' }}>
    <Datagrid rowClick="show">
      <FunctionField
        label="Пользователь"
        render={(record: any) => record.user?.name || record.user?.phone}
      />
      <TextField source="topic" label="Тема" />
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
      <StatusButtons />
    </Datagrid>
  </List>
);

export const TicketShow = () => (
  <Show>
    <SimpleShowLayout>
      <FunctionField
        label="Пользователь"
        render={(record: any) => `${record.user?.name || ''} (${record.user?.phone})`}
      />
      <TextField source="topic" label="Тема" />
      <TextField source="message" label="Сообщение" />
      <FunctionField
        label="Статус"
        render={(record: any) => (
          <Chip
            label={statusNames[record.status]}
            color={statusColors[record.status]}
          />
        )}
      />
      <DateField source="createdAt" label="Создано" />
    </SimpleShowLayout>
  </Show>
);

