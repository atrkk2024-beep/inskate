import {
  List,
  Datagrid,
  TextField,
  DateField,
  Show,
  SimpleShowLayout,
  FunctionField,
  SelectInput,
  ReferenceInput,
  useRecordContext,
  Button,
  useNotify,
  useRefresh,
} from 'react-admin';
import { Chip, Box, Typography, Paper } from '@mui/material';

const reviewFilters = [
  <SelectInput
    key="status"
    source="status"
    label="Статус"
    choices={[
      { id: 'SUBMITTED', name: 'Отправлен' },
      { id: 'IN_REVIEW', name: 'На разборе' },
      { id: 'DONE', name: 'Завершён' },
      { id: 'REJECTED', name: 'Отклонён' },
    ]}
    alwaysOn
  />,
  <ReferenceInput key="coachId" source="coachId" reference="coaches" label="Тренер">
    <SelectInput optionText="name" />
  </ReferenceInput>,
];

const statusColors: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  DRAFT: 'default',
  SUBMITTED: 'warning',
  IN_REVIEW: 'info',
  DONE: 'success',
  REJECTED: 'error',
};

const statusNames: Record<string, string> = {
  DRAFT: 'Черновик',
  SUBMITTED: 'Отправлен',
  IN_REVIEW: 'На разборе',
  DONE: 'Завершён',
  REJECTED: 'Отклонён',
};

const StatusButtons = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();

  if (!record) return null;

  const updateStatus = async (status: string) => {
    await fetch(`/api/video-reviews/${record.id}/status`, {
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

  if (record.status === 'DONE' || record.status === 'REJECTED') {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {record.status === 'SUBMITTED' && (
        <Button label="Взять в работу" onClick={() => updateStatus('IN_REVIEW')} color="primary" />
      )}
      {record.status === 'IN_REVIEW' && (
        <>
          <Button label="Завершить" onClick={() => updateStatus('DONE')} color="success" />
          <Button label="Отклонить" onClick={() => updateStatus('REJECTED')} color="error" />
        </>
      )}
    </Box>
  );
};

export const VideoReviewList = () => (
  <List filters={reviewFilters} sort={{ field: 'createdAt', order: 'DESC' }}>
    <Datagrid rowClick="show">
      <FunctionField
        label="Пользователь"
        render={(record: any) => record.user?.name || record.user?.phone}
      />
      <FunctionField
        label="Тренер"
        render={(record: any) => record.coach?.name || '—'}
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
      <FunctionField
        label="Сообщений"
        render={(record: any) => record.messageCount || 0}
      />
      <DateField source="createdAt" label="Создано" />
      <StatusButtons />
    </Datagrid>
  </List>
);

export const VideoReviewShow = () => (
  <Show>
    <SimpleShowLayout>
      <FunctionField
        label="Пользователь"
        render={(record: any) => `${record.user?.name || ''} (${record.user?.phone})`}
      />
      <FunctionField
        label="Тренер"
        render={(record: any) => record.coach?.name || 'Не назначен'}
      />
      <FunctionField
        label="Видео"
        render={(record: any) => (
          <a href={record.videoUrl} target="_blank" rel="noopener noreferrer">
            Открыть видео
          </a>
        )}
      />
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
      <DateField source="resolvedAt" label="Завершено" />

      <FunctionField
        label="Сообщения"
        render={(record: any) => (
          <Box sx={{ mt: 2 }}>
            {record.messages?.map((msg: any) => (
              <Paper
                key={msg.id}
                sx={{
                  p: 2,
                  mb: 1,
                  backgroundColor: msg.authorRole === 'coach' ? '#e3f2fd' : '#f5f5f5',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {msg.authorRole === 'coach' ? 'Тренер' : 'Пользователь'} •{' '}
                  {new Date(msg.createdAt).toLocaleString('ru-RU')}
                </Typography>
                <Typography>{msg.text}</Typography>
              </Paper>
            ))}
          </Box>
        )}
      />
    </SimpleShowLayout>
  </Show>
);

