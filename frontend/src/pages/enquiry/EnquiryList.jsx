import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space } from 'antd';
import dayjs from 'dayjs';
import { EnquiryAPI } from '@/api/enquiry';
import { useNavigate } from 'react-router-dom';

export default function EnquiryList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    EnquiryAPI.list()
      .then(({ result = [] }) => {
       const rows = Array.isArray(result) ? result : (result.docs || []);
       setRows(rows);
     })
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'Client', dataIndex: 'clientName' },
    { title: 'Contact', dataIndex: 'contact' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Location', dataIndex: 'location' },
    {
      title: 'Last Remark',
      render: (_, r) =>
        r.lastRemark?.note ? (
          <Space direction="vertical" size={0}>
            <div>{r.lastRemark.note}</div>
            <small>
              {r.lastRemark.personName} • {r.lastRemark.at ? dayjs(r.lastRemark.at).format('DD MMM, HH:mm') : '-'}
            </small>
          </Space>
        ) : (
          <Tag color="default">No remarks</Tag>
        ),
    },
    {
      title: 'Action',
      render: (_, r) => (
        <Button type="link" onClick={() => nav(`/enquiry/${r._id}`)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <Table
      rowKey="_id"
      loading={loading}
      columns={columns}
      dataSource={rows}
      pagination={{ pageSize: 10 }}
    />
  );
}
