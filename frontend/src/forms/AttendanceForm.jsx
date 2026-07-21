import dayjs from 'dayjs';
import { DatePicker, Form, Input, Select } from 'antd';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import { useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';

const statusOptions = [
  'present',
  'absent',
  'late',
  'half_day',
  'leave',
  'work_from_home',
];

const workModeOptions = ['office', 'remote', 'hybrid', 'field'];
const noWorkStatuses = ['absent', 'leave'];

export default function AttendanceForm({ mode = 'create' }) {
  const translate = useLanguage();
  const { dateFormat } = useDate();

  return (
    <>
      <Form.Item name="employee" label={translate('employee')} rules={[{ required: true }]}>
        <AutoCompleteAsync
          entity="admin"
          displayLabels={['employeeId', 'name', 'surname']}
          searchFields="employeeId,name,surname,email"
        />
      </Form.Item>

      <Form.Item
        name="status"
        label={translate('status')}
        initialValue="present"
        rules={[{ required: true }]}
      >
        <Select
          options={statusOptions.map((value) => ({
            value,
            label: translate(value),
          }))}
        />
      </Form.Item>

      <Form.Item noStyle shouldUpdate={(previous, current) => previous.status !== current.status}>
        {({ getFieldValue }) => {
          const isLeave = getFieldValue('status') === 'leave';

          if (mode === 'create' && isLeave) {
            return (
              <Form.Item
                name="leaveDateRange"
                label={translate('leave_date_range')}
                initialValue={[dayjs(), dayjs()]}
                rules={[{ required: true, type: 'array' }]}
              >
                <DatePicker.RangePicker style={{ width: '100%' }} format={dateFormat} />
              </Form.Item>
            );
          }

          return (
            <Form.Item
              name="attendanceDate"
              label={translate('attendance_date')}
              initialValue={dayjs()}
              rules={[{ required: true, type: 'object' }]}
            >
              <DatePicker style={{ width: '100%' }} format={dateFormat} />
            </Form.Item>
          );
        }}
      </Form.Item>

      <Form.Item noStyle shouldUpdate={(previous, current) => previous.status !== current.status}>
        {({ getFieldValue }) => {
          const status = getFieldValue('status');
          if (noWorkStatuses.includes(status)) return null;

          return (
            <Form.Item
              name="workMode"
              label={translate('work_mode')}
              initialValue="office"
              rules={[{ required: true }]}
            >
              <Select
                options={workModeOptions.map((value) => ({
                  value,
                  label: translate(value),
                }))}
              />
            </Form.Item>
          );
        }}
      </Form.Item>

      <Form.Item noStyle shouldUpdate={(previous, current) => previous.status !== current.status}>
        {({ getFieldValue }) => {
          const status = getFieldValue('status');
          if (noWorkStatuses.includes(status)) return null;

          return (
            <>
              <Form.Item name="checkIn" label={translate('check_in')}>
                <Input type="time" />
              </Form.Item>

              <Form.Item name="checkOut" label={translate('check_out')}>
                <Input type="time" />
              </Form.Item>
            </>
          );
        }}
      </Form.Item>

      <Form.Item name="notes" label={translate('notes')}>
        <Input.TextArea rows={4} />
      </Form.Item>
    </>
  );
}
