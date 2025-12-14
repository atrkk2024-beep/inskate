import {
  List,
  Datagrid,
  TextField,
  NumberField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  required,
  DateField,
} from 'react-admin';

export const CategoryList = () => (
  <List sort={{ field: 'order', order: 'ASC' }}>
    <Datagrid rowClick="edit">
      <TextField source="title" label="Название" />
      <NumberField source="order" label="Порядок" />
      <NumberField source="lessonCount" label="Уроков" />
      <DateField source="createdAt" label="Создано" />
    </Datagrid>
  </List>
);

export const CategoryEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" label="Название" validate={required()} fullWidth />
      <NumberInput source="order" label="Порядок" />
    </SimpleForm>
  </Edit>
);

export const CategoryCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" label="Название" validate={required()} fullWidth />
      <NumberInput source="order" label="Порядок" defaultValue={0} />
    </SimpleForm>
  </Create>
);

