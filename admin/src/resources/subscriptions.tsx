import {
  List,
  Datagrid,
  TextField,
  DateField,
  ReferenceField,
  FunctionField,
  SelectInput,
} from 'react-admin';
import { Chip } from '@mui/material';

const subscriptionFilters = [
  <SelectInput
    key="status"
    source="status"
    label="Статус"
    choices={[
      { id: 'TRIAL', name: 'Триал' },
      { id: 'ACTIVE', name: 'Активна' },
      { id: 'PAST_DUE', name: 'Просрочена' },
      { id: 'CANCELED', name: 'Отменена' },
      { id: 'EXPIRED', name: 'Истекла' },
    ]}
    alwaysOn
  />,
];

const statusColors: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
  TRIAL: 'info',
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'error',
  EXPIRED: 'default',
};

const statusNames: Record<string, string> = {
  TRIAL: 'Триал',
  ACTIVE: 'Активна',
  PAST_DUE: 'Просрочена',
  CANCELED: 'Отменена',
  EXPIRED: 'Истекла',
};

export const SubscriptionList = () => (
  <List filters={subscriptionFilters} sort={{ field: 'createdAt', order: 'DESC' }}>
    <Datagrid>
      <FunctionField
        label="Пользователь"
        render={(record: any) => record.user?.name || record.user?.phone}
      />
      <FunctionField
        label="Тариф"
        render={(record: any) => record.plan?.name}
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
      <DateField source="trialEndAt" label="Окончание триала" />
      <DateField source="currentPeriodEndAt" label="Действует до" />
      <DateField source="createdAt" label="Создано" />
    </Datagrid>
  </List>
);

