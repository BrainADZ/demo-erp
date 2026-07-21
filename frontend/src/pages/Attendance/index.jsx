import dayjs from 'dayjs';
import { Button, Card, Col, DatePicker, Row, Select, Tag } from 'antd';

import CrudModule from '@/modules/CrudModule/CrudModule';
import AttendanceForm from '@/forms/AttendanceForm';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import useLanguage from '@/locale/useLanguage';
import { useDate } from '@/settings';
import { useMemo, useState } from 'react';

const statusColors = {
  present: 'green',
  absent: 'red',
  late: 'orange',
  half_day: 'gold',
  leave: 'blue',
  work_from_home: 'purple',
};

export default function Attendance() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const entity = 'attendance';
  const [filters, setFilters] = useState({
    employee: undefined,
    status: undefined,
    workMode: undefined,
    loginSource: undefined,
    sessionStatus: undefined,
    autoMarked: undefined,
    dateRange: [],
  });

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      employee: undefined,
      status: undefined,
      workMode: undefined,
      loginSource: undefined,
      sessionStatus: undefined,
      autoMarked: undefined,
      dateRange: [],
    });
  };

  const listQuery = useMemo(() => {
    const [dateFrom, dateTo] = filters.dateRange || [];

    return {
      employee: filters.employee,
      status: filters.status,
      workMode: filters.workMode,
      loginSource: filters.loginSource,
      sessionStatus: filters.sessionStatus,
      autoMarked: filters.autoMarked,
      dateFrom: dateFrom ? dayjs(dateFrom).format('YYYY-MM-DD') : undefined,
      dateTo: dateTo ? dayjs(dateTo).format('YYYY-MM-DD') : undefined,
      sortBy: 'attendanceDate',
      sortValue: -1,
    };
  }, [filters]);

  const searchConfig = {
    displayLabels: ['employeeName', 'employeeIdSnapshot', 'status', 'sessionStatus'],
    searchFields: 'employeeName,employeeIdSnapshot,status,loginSource,sessionStatus',
    outputValue: '_id',
  };

  const deleteModalLabels = ['employeeName', 'employeeIdSnapshot', 'status'];
  const formatDate = (date) => (date ? dayjs(date).format(dateFormat) : '-');
  const formatDateTime = (date) => (date ? dayjs(date).format(`${dateFormat} HH:mm`) : '-');
  const renderText = (value) => value || '-';
  const renderStatus = (status) => (
    <Tag color={statusColors[status] || 'default'}>{translate(status || 'unknown')}</Tag>
  );
  const renderWorkMode = (workMode, record) => {
    if (['absent', 'leave'].includes(record?.status)) return '-';
    return workMode ? translate(workMode) : '-';
  };
  const renderSessionStatus = (sessionStatus) => (
    <Tag color={sessionStatus === 'active' ? 'processing' : 'default'}>
      {translate(sessionStatus || 'unknown')}
    </Tag>
  );
  const renderAutoMarked = (autoMarked) => (
    <Tag color={autoMarked ? 'blue' : 'default'}>{translate(autoMarked ? 'yes' : 'no')}</Tag>
  );
  const renderLoginSource = (source) => (
    <Tag color={source === 'remote' ? 'purple' : source === 'office' ? 'green' : 'default'}>
      {translate(source || 'unknown')}
    </Tag>
  );

  const readColumns = [
    { title: translate('employee_id'), dataIndex: 'employeeIdSnapshot' },
    { title: translate('employee'), dataIndex: 'employeeName' },
    {
      title: translate('attendance_date'),
      dataIndex: 'attendanceDate',
      render: formatDate,
    },
    {
      title: translate('status'),
      dataIndex: 'status',
      render: renderStatus,
    },
    { title: translate('work_mode'), dataIndex: 'workMode', render: renderWorkMode },
    { title: translate('check_in'), dataIndex: 'checkIn', render: renderText },
    { title: translate('check_out'), dataIndex: 'checkOut', render: renderText },
    { title: translate('session_status'), dataIndex: 'sessionStatus', render: renderSessionStatus },
    { title: translate('check_out_method'), dataIndex: 'checkOutMethod', render: renderText },
    {
      title: translate('login_time'),
      dataIndex: 'loginCapturedAt',
      render: formatDateTime,
    },
    { title: translate('login_source'), dataIndex: 'loginSource', render: renderLoginSource },
    { title: translate('browser'), dataIndex: 'loginBrowser', render: renderText },
    { title: translate('device'), dataIndex: 'loginDevice', render: renderText },
    { title: translate('timezone'), dataIndex: 'loginTimezone', render: renderText },
    { title: translate('notes'), dataIndex: 'notes', render: renderText },
  ];

  const dataTableColumns = [
    { title: translate('employee_id'), dataIndex: 'employeeIdSnapshot' },
    { title: translate('employee'), dataIndex: 'employeeName' },
    {
      title: translate('attendance_date'),
      dataIndex: 'attendanceDate',
      render: formatDate,
    },
    {
      title: translate('status'),
      dataIndex: 'status',
      render: renderStatus,
    },
    { title: translate('work_mode'), dataIndex: 'workMode', render: renderWorkMode },
    { title: translate('check_in'), dataIndex: 'checkIn', render: renderText },
    { title: translate('check_out'), dataIndex: 'checkOut', render: renderText },
    {
      title: translate('session_status'),
      dataIndex: 'sessionStatus',
      render: renderSessionStatus,
    },
    {
      title: translate('auto_marked'),
      dataIndex: 'autoMarked',
      render: renderAutoMarked,
    },
    {
      title: translate('login_source'),
      dataIndex: 'loginSource',
      render: renderLoginSource,
    },
    { title: translate('notes'), dataIndex: 'notes', render: renderText },
  ];

  const filterPanel = (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <AutoCompleteAsync
            entity="admin"
            displayLabels={['employeeId', 'name', 'surname']}
            searchFields="employeeId,name,surname,email"
            onChange={(value) => updateFilter('employee', value)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Select
            allowClear
            value={filters.status}
            onChange={(value) => updateFilter('status', value)}
            style={{ width: '100%' }}
            placeholder={translate('status')}
            options={[
              'present',
              'absent',
              'late',
              'half_day',
              'leave',
              'work_from_home',
            ].map((value) => ({
              value,
              label: translate(value),
            }))}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Select
            allowClear
            value={filters.workMode}
            onChange={(value) => updateFilter('workMode', value)}
            style={{ width: '100%' }}
            placeholder={translate('work_mode')}
            options={['office', 'remote', 'hybrid', 'field'].map((value) => ({
              value,
              label: translate(value),
            }))}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Select
            allowClear
            value={filters.loginSource}
            onChange={(value) => updateFilter('loginSource', value)}
            style={{ width: '100%' }}
            placeholder={translate('login_source')}
            options={['office', 'remote', 'unknown'].map((value) => ({
              value,
              label: translate(value),
            }))}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={3}>
          <Select
            allowClear
            value={filters.sessionStatus}
            onChange={(value) => updateFilter('sessionStatus', value)}
            style={{ width: '100%' }}
            placeholder={translate('session_status')}
            options={['active', 'closed'].map((value) => ({
              value,
              label: translate(value),
            }))}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={3}>
          <Select
            allowClear
            value={filters.autoMarked}
            onChange={(value) => updateFilter('autoMarked', value)}
            style={{ width: '100%' }}
            placeholder={translate('auto_marked')}
            options={[
              { value: 'true', label: translate('yes') },
              { value: 'false', label: translate('no') },
            ]}
          />
        </Col>
        <Col xs={24} sm={24} md={16} lg={8}>
          <DatePicker.RangePicker
            value={filters.dateRange}
            onChange={(value) => updateFilter('dateRange', value || [])}
            style={{ width: '100%' }}
            format={dateFormat}
          />
        </Col>
        <Col xs={24} sm={24} md={8} lg={4}>
          <Button block onClick={clearFilters}>
            {translate('clear_filters')}
          </Button>
        </Col>
      </Row>
    </Card>
  );

  const Labels = {
    PANEL_TITLE: translate('attendance'),
    DATATABLE_TITLE: translate('attendance_records'),
    ADD_NEW_ENTITY: translate('mark_attendance'),
    ENTITY_NAME: translate('attendance'),
  };

  const config = {
    entity,
    ...Labels,
    readColumns,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
    listQuery,
    dataTableHeaderContent: filterPanel,
  };

  return (
    <CrudModule
      createForm={<AttendanceForm mode="create" />}
      updateForm={<AttendanceForm mode="update" />}
      config={config}
    />
  );
}
