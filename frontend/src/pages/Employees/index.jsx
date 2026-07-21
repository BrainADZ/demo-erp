import CrudModule from '@/modules/CrudModule/CrudModule';
import AdminForm from '@/forms/AdminForm';
import useLanguage from '@/locale/useLanguage';

export default function Employees() {
  const translate = useLanguage();
  const entity = 'admin';

  const searchConfig = {
    displayLabels: ['employeeId', 'name', 'surname', 'email'],
    searchFields: 'employeeId,name,surname,email',
    outputValue: '_id',
  };

  const deleteModalLabels = ['employeeId', 'name', 'surname'];

  const readColumns = [
    { title: translate('Employee ID'), dataIndex: 'employeeId' },
    { title: translate('first Name'), dataIndex: 'name' },
    { title: translate('last Name'), dataIndex: 'surname' },
    { title: translate('email'), dataIndex: 'email' },
    { title: translate('department'), dataIndex: 'department' },
    { title: translate('job_title'), dataIndex: 'jobTitle' },
    { title: translate('role'), dataIndex: 'role' },
    { title: translate('enabled'), dataIndex: 'enabled' },
  ];

  const dataTableColumns = [
    { title: translate('Employee ID'), dataIndex: 'employeeId' },
    { title: translate('Name'), dataIndex: 'name' },
    { title: translate('Email'), dataIndex: 'email' },
    { title: translate('Department'), dataIndex: 'department' },
    { title: translate('Job Title'), dataIndex: 'jobTitle' },
    { title: translate('Role'), dataIndex: 'role' },
  ];

  const Labels = {
    PANEL_TITLE: translate('employees'),
    DATATABLE_TITLE: translate('employee_directory'),
    ADD_NEW_ENTITY: translate('add_new_employee'),
    ENTITY_NAME: translate('employee'),
  };

  const config = {
    entity,
    ...Labels,
    readColumns,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };

  return (
    <CrudModule
      createForm={<AdminForm />}
      updateForm={<AdminForm isUpdateForm={true} />}
      config={config}
    />
  );
}
