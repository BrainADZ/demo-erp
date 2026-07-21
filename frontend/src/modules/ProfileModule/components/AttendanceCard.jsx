import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Alert, Button, Card, Descriptions, Space, Tag } from 'antd';
import { RedoOutlined } from '@ant-design/icons';

import { request } from '@/request';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { useSelector } from 'react-redux';
import { useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';

const sourceColors = {
  office: 'green',
  remote: 'purple',
  unknown: 'default',
};

export default function AttendanceCard() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const currentAdmin = useSelector(selectCurrentAdmin);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTodayAttendance = async () => {
    setLoading(true);
    const data = await request.get({ entity: 'attendance/my/today' });
    if (data?.success) {
      setTodayAttendance(data.result || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTodayAttendance();
  }, []);

  if (currentAdmin?.role === 'owner') {
    return null;
  }

  return (
    <Card
      title={translate('today_attendance')}
      style={{ marginTop: 24 }}
      extra={
        <Space>
          <Button icon={<RedoOutlined />} loading={loading} onClick={loadTodayAttendance}>
            {translate('refresh')}
          </Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Attendance is auto-marked on login and captured on proper logout."
        description="If power or internet drops, we keep the session open instead of forcing an incorrect checkout."
      />
      <Descriptions column={1} size="small">
        <Descriptions.Item label={translate('date')}>
          {todayAttendance?.attendanceDate
            ? dayjs(todayAttendance.attendanceDate).format(dateFormat)
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={translate('status')}>
          {todayAttendance?.status ? translate(todayAttendance.status) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={translate('work_mode')}>
          {todayAttendance?.workMode ? translate(todayAttendance.workMode) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={translate('check_in')}>
          {todayAttendance?.checkIn || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={translate('check_out')}>
          {todayAttendance?.checkOut || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={translate('session_status')}>
          <Tag color={todayAttendance?.sessionStatus === 'active' ? 'processing' : 'default'}>
            {translate(todayAttendance?.sessionStatus || 'unknown')}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={translate('check_out_method')}>
          {todayAttendance?.checkOutMethod ? translate(todayAttendance.checkOutMethod) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={translate('login_source')}>
          <Tag color={sourceColors[todayAttendance?.loginSource] || 'default'}>
            {translate(todayAttendance?.loginSource || 'unknown')}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={translate('ip_address')}>
          {todayAttendance?.loginIp || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={translate('browser')}>
          {todayAttendance?.loginBrowser || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
