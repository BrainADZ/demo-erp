import { useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { settingsAction } from '@/redux/settings/actions';
import { selectSettings } from '@/redux/settings/selectors';

import { Button, Form, notification } from 'antd';
import Loading from '@/components/Loading';
import useLanguage from '@/locale/useLanguage';

export default function UpdateSettingForm({ config, children, withUpload, uploadSettingKey }) {
  let { entity, settingsCategory } = config;
  const dispatch = useDispatch();
  const { result, isLoading } = useSelector(selectSettings);
  const translate = useLanguage();
  const [form] = Form.useForm();

  const onSubmit = (fieldsValue) => {
    if (withUpload) {
      if (fieldsValue.settingValue?.length) {
        fieldsValue.file = fieldsValue.settingValue[0].originFileObj;
        delete fieldsValue.settingValue;
      } else {
        notification.error({
          message: translate('Please select a file to upload.'),
        });
        return;
      }

      dispatch(settingsAction.upload({ entity, settingKey: uploadSettingKey, jsonData: fieldsValue }));
      return;
    }

    const settings = [];

    for (const [key, value] of Object.entries(fieldsValue)) {
      settings.push({ settingKey: key, settingValue: value });
    }

    dispatch(settingsAction.updateMany({ entity, jsonData: { settings } }));
  };

  useEffect(() => {
    const current = result[settingsCategory];
    form.setFieldsValue(current);
  }, [form, result, settingsCategory]);

  return (
    <div>
      <Loading isLoading={isLoading}>
        <Form
          form={form}
          onFinish={onSubmit}
          labelCol={{ span: 10 }}
          labelAlign="left"
          wrapperCol={{ span: 16 }}
        >
          {children}
          <Form.Item
            style={{
              display: 'inline-block',
              paddingRight: '5px',
            }}
          >
            <Button type="primary" htmlType="submit">
              {translate('Save')}
            </Button>
          </Form.Item>
          <Form.Item
            style={{
              display: 'inline-block',
              paddingLeft: '5px',
            }}
          />
        </Form>
      </Loading>
    </div>
  );
}
