import {
  List,
  Datagrid,
  TextField,
  NumberField,
  BooleanField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  SelectInput,
  ArrayInput,
  SimpleFormIterator,
  required,
  FunctionField,
} from 'react-admin';
import { Chip } from '@mui/material';

const formatPrice = (price: number, currency: string) => {
  const amount = price / 100;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const PlanList = () => (
  <List sort={{ field: 'order', order: 'ASC' }}>
    <Datagrid rowClick="edit">
      <TextField source="name" label="Название" />
      <FunctionField
        label="Цена"
        render={(record: any) => formatPrice(record.price, record.currency)}
      />
      <TextField source="interval" label="Период" />
      <NumberField source="trialDays" label="Trial (дней)" />
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
      <NumberField source="subscriptionCount" label="Подписок" />
    </Datagrid>
  </List>
);

export const PlanEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Название" validate={required()} fullWidth />
      <NumberInput source="price" label="Цена (в копейках/центах)" validate={required()} />
      <SelectInput
        source="currency"
        label="Валюта"
        choices={[
          { id: 'RUB', name: 'Рубль (RUB)' },
          { id: 'USD', name: 'Доллар (USD)' },
          { id: 'EUR', name: 'Евро (EUR)' },
        ]}
        validate={required()}
      />
      <SelectInput
        source="interval"
        label="Период"
        choices={[
          { id: 'month', name: 'Месяц' },
          { id: 'year', name: 'Год' },
        ]}
        validate={required()}
      />
      <NumberInput source="trialDays" label="Пробный период (дней)" defaultValue={0} />
      <ArrayInput source="features" label="Особенности">
        <SimpleFormIterator>
          <TextInput source="" label="Особенность" fullWidth />
        </SimpleFormIterator>
      </ArrayInput>
      <BooleanInput source="active" label="Активен" />
      <NumberInput source="order" label="Порядок" />
    </SimpleForm>
  </Edit>
);

export const PlanCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Название" validate={required()} fullWidth />
      <NumberInput source="price" label="Цена (в копейках/центах)" validate={required()} />
      <SelectInput
        source="currency"
        label="Валюта"
        choices={[
          { id: 'RUB', name: 'Рубль (RUB)' },
          { id: 'USD', name: 'Доллар (USD)' },
          { id: 'EUR', name: 'Евро (EUR)' },
        ]}
        defaultValue="RUB"
        validate={required()}
      />
      <SelectInput
        source="interval"
        label="Период"
        choices={[
          { id: 'month', name: 'Месяц' },
          { id: 'year', name: 'Год' },
        ]}
        defaultValue="month"
        validate={required()}
      />
      <NumberInput source="trialDays" label="Пробный период (дней)" defaultValue={3} />
      <ArrayInput source="features" label="Особенности">
        <SimpleFormIterator>
          <TextInput source="" label="Особенность" fullWidth />
        </SimpleFormIterator>
      </ArrayInput>
      <BooleanInput source="active" label="Активен" defaultValue={true} />
    </SimpleForm>
  </Create>
);

