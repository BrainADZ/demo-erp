import { useEffect, useState } from 'react';
import { Card, Descriptions, List, Form, Input, Button, message } from 'antd';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';
import { EnquiryAPI } from '@/api/enquiry';

export default function EnquiryDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchOne = () =>
    EnquiryAPI.read(id).then(({ result }) => setData(result));

  useEffect(() => {
    fetchOne();
  }, [id]);

  const onAddRemark = async (vals) => {
    try {
      setSubmitting(true);
      await EnquiryAPI.addRemark(id, vals); // { personName, note }
      form.resetFields();
      await fetchOne();
      message.success('Remark added');
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return null;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card title="Enquiry">
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Client">{data.clientName}</Descriptions.Item>
          <Descriptions.Item label="Contact">{data.contact}</Descriptions.Item>
          <Descriptions.Item label="Email">{data.email}</Descriptions.Item>
          <Descriptions.Item label="Location">{data.location}</Descriptions.Item>
          <Descriptions.Item label="Message">{data.message}</Descriptions.Item>
          <Descriptions.Item label="Created">
            {dayjs(data.createdAt).format('DD MMM YYYY, HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Add Remark">
        <Form layout="vertical" form={form} onFinish={onAddRemark}>
          <Form.Item
            name="personName"
            label="Sales Person"
            rules={[{ required: true, message: 'Enter person name' }]}
          >
            <Input placeholder="e.g. Neha" />
          </Form.Item>
          <Form.Item
            name="note"
            label="Remark"
            rules={[{ required: true, message: 'Enter remark' }]}
          >
            <Input.TextArea rows={3} placeholder="Called client, demo scheduled..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Add Remark
          </Button>
        </Form>
      </Card>

      <Card title="Remarks History">
        <List
          dataSource={[...(data.remarks || [])].reverse()}
          renderItem={(r) => (
            <List.Item>
              <List.Item.Meta
                title={`${r.personName} • ${dayjs(r.at).format('DD MMM, HH:mm')}`}
                description={r.note}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
