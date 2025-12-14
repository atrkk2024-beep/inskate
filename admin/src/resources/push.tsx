import {
  List,
  Datagrid,
  TextField,
  DateField,
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  DateTimeInput,
  required,
  FunctionField,
  useNotify,
  useRedirect,
} from 'react-admin';
import { Chip } from '@mui/material';

export const PushNotificationList = () => (
  <List sort={{ field: 'createdAt', order: 'DESC' }}>
    <Datagrid>
      <TextField source="title" label="Заголовок" />
      <TextField source="body" label="Текст" />
      <FunctionField
        label="Сегмент"
        render={(record: any) => {
          const segments: Record<string, string> = {
            all: 'Все',
            subscribers: 'Подписчики',
            non_subscribers: 'Без подписки',
          };
          return segments[record.segment] || record.segment;
        }}
      />
      <FunctionField
        label="Статус"
        render={(record: any) => {
          if (record.sentAt) {
            return <Chip label="Отправлено" color="success" size="small" />;
          }
          if (record.scheduledAt) {
            return <Chip label="Запланировано" color="warning" size="small" />;
          }
          return <Chip label="Черновик" size="small" />;
        }}
      />
      <DateField source="scheduledAt" label="Запланировано на" showTime />
      <DateField source="sentAt" label="Отправлено" showTime />
      <DateField source="createdAt" label="Создано" />
    </Datagrid>
  </List>
);

export const PushNotificationCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        if (result.data.scheduled) {
          notify('Уведомление запланировано');
        } else {
          notify(`Отправлено: ${result.data.successCount} успешно, ${result.data.failureCount} ошибок`);
        }
        redirect('list', 'push');
      } else {
        notify(result.error?.message || 'Ошибка отправки', { type: 'error' });
      }
    } catch (error) {
      notify('Ошибка отправки', { type: 'error' });
    }
  };

  return (
    <Create>
      <SimpleForm onSubmit={handleSubmit}>
        <TextInput source="title" label="Заголовок" validate={required()} fullWidth />
        <TextInput source="body" label="Текст" validate={required()} multiline rows={3} fullWidth />
        <SelectInput
          source="segment"
          label="Сегмент получателей"
          choices={[
            { id: 'all', name: 'Все пользователи' },
            { id: 'subscribers', name: 'Только подписчики' },
            { id: 'non_subscribers', name: 'Без подписки' },
          ]}
          defaultValue="all"
          validate={required()}
        />
        <DateTimeInput
          source="scheduledAt"
          label="Запланировать на (оставьте пустым для немедленной отправки)"
          fullWidth
        />
      </SimpleForm>
    </Create>
  );
};

