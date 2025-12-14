import {
  List,
  Datagrid,
  TextField,
  NumberField,
  BooleanField,
  Edit,
  Create,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextInput,
  NumberInput,
  BooleanInput,
  SelectInput,
  ReferenceInput,
  ReferenceField,
  required,
  DateField,
  ImageField,
  FunctionField,
  useRecordContext,
  TopToolbar,
  EditButton,
  Button,
  useUpdate,
  useNotify,
  useRefresh,
} from 'react-admin';
import { Chip, Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const lessonFilters = [
  <ReferenceInput key="categoryId" source="categoryId" reference="categories" label="Категория">
    <SelectInput optionText="title" />
  </ReferenceInput>,
  <SelectInput
    key="status"
    source="status"
    label="Статус"
    choices={[
      { id: 'DRAFT', name: 'Черновик' },
      { id: 'PENDING', name: 'На модерации' },
      { id: 'PUBLISHED', name: 'Опубликовано' },
    ]}
  />,
  <SelectInput
    key="isFree"
    source="isFree"
    label="Тип"
    choices={[
      { id: true, name: 'Бесплатный' },
      { id: false, name: 'Премиум' },
    ]}
  />,
];

const StatusChip = () => {
  const record = useRecordContext();
  if (!record) return null;

  const statusColors: Record<string, 'default' | 'warning' | 'success'> = {
    DRAFT: 'default',
    PENDING: 'warning',
    PUBLISHED: 'success',
  };

  const statusNames: Record<string, string> = {
    DRAFT: 'Черновик',
    PENDING: 'На модерации',
    PUBLISHED: 'Опубликовано',
  };

  return (
    <Chip
      label={statusNames[record.status]}
      color={statusColors[record.status]}
      size="small"
    />
  );
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ModerateButtons = () => {
  const record = useRecordContext();
  const [update] = useUpdate();
  const notify = useNotify();
  const refresh = useRefresh();

  if (!record || record.status !== 'PENDING') return null;

  const handleApprove = async () => {
    await update('lessons', { id: record.id, data: { status: 'PUBLISHED' }, previousData: record });
    notify('Урок опубликован');
    refresh();
  };

  const handleReject = async () => {
    await update('lessons', { id: record.id, data: { status: 'DRAFT' }, previousData: record });
    notify('Урок отклонён');
    refresh();
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button label="Одобрить" onClick={handleApprove} color="success">
        <CheckIcon />
      </Button>
      <Button label="Отклонить" onClick={handleReject} color="error">
        <CloseIcon />
      </Button>
    </Box>
  );
};

export const LessonList = () => (
  <List filters={lessonFilters} sort={{ field: 'order', order: 'ASC' }}>
    <Datagrid rowClick="show">
      <ImageField source="thumbnailUrl" label="" sx={{ '& img': { maxHeight: 50, borderRadius: 1 } }} />
      <TextField source="title" label="Название" />
      <ReferenceField source="categoryId" reference="categories" label="Категория">
        <TextField source="title" />
      </ReferenceField>
      <FunctionField
        label="Длительность"
        render={(record: any) => formatDuration(record.durationSec)}
      />
      <BooleanField source="isFree" label="Бесплатный" />
      <StatusChip />
      <NumberField source="order" label="Порядок" />
      <ModerateButtons />
    </Datagrid>
  </List>
);

export const LessonShow = () => (
  <Show actions={<TopToolbar><EditButton /></TopToolbar>}>
    <SimpleShowLayout>
      <TextField source="title" label="Название" />
      <ReferenceField source="categoryId" reference="categories" label="Категория">
        <TextField source="title" />
      </ReferenceField>
      <TextField source="description" label="Описание" />
      <FunctionField
        label="Длительность"
        render={(record: any) => formatDuration(record.durationSec)}
      />
      <ImageField source="thumbnailUrl" label="Превью" />
      <TextField source="videoUrl" label="URL видео" />
      <BooleanField source="isFree" label="Бесплатный" />
      <StatusChip />
      <DateField source="publishedAt" label="Опубликовано" />
      <DateField source="createdAt" label="Создано" />
    </SimpleShowLayout>
  </Show>
);

export const LessonEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" label="Название" validate={required()} fullWidth />
      <ReferenceInput source="categoryId" reference="categories" label="Категория">
        <SelectInput optionText="title" validate={required()} />
      </ReferenceInput>
      <TextInput source="description" label="Описание" multiline rows={4} fullWidth />
      <NumberInput source="durationSec" label="Длительность (секунды)" />
      <TextInput source="thumbnailUrl" label="URL превью" fullWidth />
      <TextInput source="videoUrl" label="URL видео" validate={required()} fullWidth />
      <BooleanInput source="isFree" label="Бесплатный" />
      <SelectInput
        source="status"
        label="Статус"
        choices={[
          { id: 'DRAFT', name: 'Черновик' },
          { id: 'PENDING', name: 'На модерации' },
          { id: 'PUBLISHED', name: 'Опубликовано' },
        ]}
      />
      <NumberInput source="order" label="Порядок" />
    </SimpleForm>
  </Edit>
);

export const LessonCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" label="Название" validate={required()} fullWidth />
      <ReferenceInput source="categoryId" reference="categories" label="Категория">
        <SelectInput optionText="title" validate={required()} />
      </ReferenceInput>
      <TextInput source="description" label="Описание" multiline rows={4} fullWidth />
      <NumberInput source="durationSec" label="Длительность (секунды)" defaultValue={0} />
      <TextInput source="thumbnailUrl" label="URL превью" fullWidth />
      <TextInput source="videoUrl" label="URL видео (YouTube)" validate={required()} fullWidth />
      <BooleanInput source="isFree" label="Бесплатный" defaultValue={false} />
      <SelectInput
        source="status"
        label="Статус"
        choices={[
          { id: 'DRAFT', name: 'Черновик' },
          { id: 'PENDING', name: 'На модерации' },
          { id: 'PUBLISHED', name: 'Опубликовано' },
        ]}
        defaultValue="DRAFT"
      />
    </SimpleForm>
  </Create>
);

