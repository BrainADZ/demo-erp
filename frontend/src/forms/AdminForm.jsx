import { useEffect, useState } from 'react';
import { Button, Form, Input, Select, Switch } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';

const departmentOptions = [
  { value: 'management', label: 'Management' },
  { value: 'sales', label: 'Sales' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'hr', label: 'HR' },
  { value: 'support', label: 'Support' },
  { value: 'general', label: 'General' },
];

export default function AdminForm({ isUpdateForm = false, isForAdminOwner = false }) {
  const translate = useLanguage();
  const [roleOptions, setRoleOptions] = useState([]);
  const [moduleOptions, setModuleOptions] = useState([]);

  useEffect(() => {
    const loadPermissionsMeta = async () => {
      const data = await request.get({ entity: 'admin/permissions/meta' });
      if (data?.success) {
        const roles = Object.entries(data.result.roles || {}).map(([value, label]) => ({
          value,
          label,
        }));
        const modules = Object.entries(data.result.permissionModules || {}).map(([value, config]) => ({
          value,
          label: config.label,
        }));
        setRoleOptions(roles);
        setModuleOptions(modules);
      }
    };

    loadPermissionsMeta();
  }, []);

  return (
    <>
      <Form.Item
        label={translate('employee_id')}
        name="employeeId"
        rules={[
          {
            required: false,
          },
        ]}
      >
        <Input autoComplete="off" placeholder="EMP0001" />
      </Form.Item>

      <Form.Item
        label={translate('first Name')}
        name="name"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input autoComplete="off" />
      </Form.Item>

      <Form.Item
        label={translate('last Name')}
        name="surname"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input autoComplete="off" />
      </Form.Item>

      <Form.Item
        label={translate('email')}
        name="email"
        rules={[
          {
            required: true,
          },
          {
            type: 'email',
          },
        ]}
      >
        <Input autoComplete="off" />
      </Form.Item>

      {!isUpdateForm && (
        <Form.Item
          label={translate('Password')}
          name="password"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      )}

      <Form.Item
        label={translate('department')}
        name="department"
        initialValue="general"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select options={departmentOptions} />
      </Form.Item>

      <Form.Item
        label={translate('job_title')}
        name="jobTitle"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input autoComplete="off" placeholder="Sales Executive" />
      </Form.Item>

      <Form.Item
        label={translate('Role')}
        name="role"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select>
          {roleOptions.map((role) => (
            <Select.Option
              key={role.value}
              value={role.value}
              disabled={role.value === 'owner' ? !isForAdminOwner : false}
            >
              {role.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label={translate('sidebar_access')}
        name="permissionModules"
        tooltip="Select the sidebar sections this employee can use. Required background access like clients or taxes is added automatically for related modules."
      >
        <Select
          mode="multiple"
          allowClear
          showSearch
          optionFilterProp="label"
          options={moduleOptions}
          placeholder="Choose menu access like Customers, Invoices, Settings"
        />
      </Form.Item>

      <Form.Item
        label={translate('enabled')}
        name="enabled"
        valuePropName="checked"
        initialValue={true}
      >
        <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} />
      </Form.Item>
    </>
  );
}
