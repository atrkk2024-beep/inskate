import {
  List,
  Datagrid,
  TextField,
  DateField,
  ReferenceField,
  FunctionField,
  useRecordContext,
  Button,
  useUpdate,
  useNotify,
  useRefresh,
  SelectInput,
} from 'react-admin';
import { Chip, Box } from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';

const commentFilters = [
  <SelectInput
    key="status"
    source="status"
    label="Статус"
    choices={[
      { id: 'ACTIVE', name: 'Активный' },
      { id: 'HIDDEN', name: 'Скрытый' },
    ]}
    alwaysOn
  />,
];

const ModerateButtons = () => {
  const record = useRecordContext();
  const [update] = useUpdate();
  const notify = useNotify();
  const refresh = useRefresh();

  if (!record) return null;

  const handleHide = async () => {
    await fetch(`/api/comments/${record.id}/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ action: 'hide' }),
    });
    notify('Комментарий скрыт');
    refresh();
  };

  const handleShow = async () => {
    await fetch(`/api/comments/${record.id}/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ action: 'show' }),
    });
    notify('Комментарий восстановлен');
    refresh();
  };

  const handleDelete = async () => {
    await fetch(`/api/comments/${record.id}/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ action: 'delete' }),
    });
    notify('Комментарий удалён');
    refresh();
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {record.status === 'ACTIVE' ? (
        <Button label="Скрыть" onClick={handleHide} color="warning">
          <VisibilityOffIcon />
        </Button>
      ) : (
        <Button label="Показать" onClick={handleShow} color="success">
          <VisibilityIcon />
        </Button>
      )}
      <Button label="Удалить" onClick={handleDelete} color="error">
        <DeleteIcon />
      </Button>
    </Box>
  );
};

export const CommentList = () => (
  <List filters={commentFilters} sort={{ field: 'createdAt', order: 'DESC' }}>
    <Datagrid>
      <ReferenceField source="lessonId" reference="lessons" label="Урок" link={false}>
        <TextField source="title" />
      </ReferenceField>
      <FunctionField
        label="Пользователь"
        render={(record: any) => record.user?.name || record.user?.phone?.slice(-4)}
      />
      <TextField source="text" label="Комментарий" />
      <FunctionField
        label="Статус"
        render={(record: any) => (
          <Chip
            label={record.status === 'ACTIVE' ? 'Активный' : 'Скрытый'}
            color={record.status === 'ACTIVE' ? 'success' : 'default'}
            size="small"
          />
        )}
      />
      <DateField source="createdAt" label="Дата" />
      <ModerateButtons />
    </Datagrid>
  </List>
);

