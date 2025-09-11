import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Tag, Space, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  fetchIntegrations, 
  createIntegration, 
  updateIntegration, 
  deleteIntegration, 
  testIntegration,
  syncIntegration 
} from '../store/slices/integrationSlice';
import { integrationAPI } from '../services/api';

const { Option } = Select;

const Integrations: React.FC = () => {
  const dispatch = useDispatch();
  const { integrations, loading } = useSelector((state: RootState) => state.integration);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchIntegrations());
  }, [dispatch]);

  const handleCreate = () => {
    setEditingIntegration(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (integration: any) => {
    setEditingIntegration(integration);
    form.setFieldsValue(integration);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteIntegration(id)).unwrap();
      message.success('Integration deleted successfully');
    } catch (error: any) {
      message.error(error || 'Failed to delete integration');
    }
  };

  const handleTest = async (id: string) => {
    try {
      await dispatch(testIntegration(id)).unwrap();
      message.success('Integration test successful');
    } catch (error: any) {
      message.error(error || 'Integration test failed');
    }
  };

  const handleSync = async (id: string) => {
    try {
      await dispatch(syncIntegration({ id })).unwrap();
      message.success('Sync started successfully');
    } catch (error: any) {
      message.error(error || 'Sync failed');
    }
  };

  const onFinish = async (values: any) => {
    try {
      if (editingIntegration) {
        await dispatch(updateIntegration({ id: editingIntegration.id, data: values })).unwrap();
        message.success('Integration updated successfully');
      } else {
        await dispatch(createIntegration(values)).unwrap();
        message.success('Integration created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error || 'Operation failed');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          ACTIVE: 'green',
          INACTIVE: 'default',
          ERROR: 'red',
          PENDING: 'orange',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => (
        <Space>
          <Button
            icon={<CheckCircleOutlined />}
            size="small"
            onClick={() => handleTest(record.id)}
          >
            Test
          </Button>
          <Button
            icon={<SyncOutlined />}
            size="small"
            onClick={() => handleSync(record.id)}
          >
            Sync
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this integration?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Integrations</h1>
          <p className="text-gray-400">Manage your platform integrations</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Integration
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={integrations}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title={editingIntegration ? 'Edit Integration' : 'Add Integration'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="name"
            label="Integration Name"
            rules={[{ required: true, message: 'Please input integration name!' }]}
          >
            <Input placeholder="Enter integration name" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Platform Type"
            rules={[{ required: true, message: 'Please select platform type!' }]}
          >
            <Select placeholder="Select platform">
              <Option value="SLACK">Slack</Option>
              <Option value="JIRA">Jira</Option>
              <Option value="AIRTABLE">Airtable</Option>
              <Option value="GITHUB">GitHub</Option>
              <Option value="TRELLO">Trello</Option>
              <Option value="NOTION">Notion</Option>
              <Option value="LARK">Lark</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="config"
            label="Configuration"
            rules={[{ required: true, message: 'Please input configuration!' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Enter configuration JSON"
            />
          </Form.Item>

          <Form.Item
            name="mapping"
            label="Field Mapping (Optional)"
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter field mapping JSON"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                {editingIntegration ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Integrations;
