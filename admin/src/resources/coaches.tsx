import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  BooleanInput,
  required,
  ImageField,
  FunctionField,
} from 'react-admin';
import { Chip, Box } from '@mui/material';

export const CoachList = () => (
  <List>
    <Datagrid rowClick="edit">
      <ImageField source="avatarUrl" label="" sx={{ '& img': { width: 40, height: 40, borderRadius: '50%' } }} />
      <TextField source="name" label="Имя" />
      <TextField source="level" label="Уровень" />
      <FunctionField
        label="Активен"
        render={(record: any) => (
          <Chip
            label={record.active ? 'Да' : 'Нет'}
            color={record.active ? 'success' : 'default'}
            size="small"
          />
        )}
      />
      <FunctionField
        label="Нагрузка"
        render={(record: any) => (
          <Box>
            {record.pendingBookings > 0 && (
              <Chip label={`${record.pendingBookings} брон.`} size="small" sx={{ mr: 0.5 }} />
            )}
            {record.pendingReviews > 0 && (
              <Chip label={`${record.pendingReviews} разб.`} size="small" color="warning" />
            )}
          </Box>
        )}
      />
    </Datagrid>
  </List>
);

export const CoachEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Имя" validate={required()} fullWidth />
      <TextInput source="level" label="Уровень / звание" fullWidth />
      <TextInput source="bio" label="Биография" multiline rows={4} fullWidth />
      <TextInput source="avatarUrl" label="URL фото" fullWidth />
      <TextInput source="socials.instagram" label="Instagram" fullWidth />
      <TextInput source="socials.youtube" label="YouTube" fullWidth />
      <TextInput source="socials.telegram" label="Telegram" fullWidth />
      <BooleanInput source="active" label="Активен" />
    </SimpleForm>
  </Edit>
);

export const CoachCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Имя" validate={required()} fullWidth />
      <TextInput source="level" label="Уровень / звание" fullWidth />
      <TextInput source="bio" label="Биография" multiline rows={4} fullWidth />
      <TextInput source="avatarUrl" label="URL фото" fullWidth />
      <TextInput source="socials.instagram" label="Instagram" fullWidth />
      <TextInput source="socials.youtube" label="YouTube" fullWidth />
      <BooleanInput source="active" label="Активен" defaultValue={true} />
    </SimpleForm>
  </Create>
);

