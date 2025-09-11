import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, message } from 'antd';
import { ReloadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchWebhooks, retryFailedWebhooks, deleteOldWebhooks } from '../store/slices/webhookSlice';

const { Option } = Select;

const Webhooks: React.FC = () => {
  const dispatch = useDispatch();
  const { webhooks, loading, stats } = useSelector((state: RootState) => state.webhook);
  const [filters, setFilters] = useState({
    platform: '',
    processed: undefined as boolean | undefined,
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    dispatch(fetchWebhooks(filters));
    dispatch(fetchWebhooks());
  }, [dispatch, filters]);

  const handleRetryFailed = async () => {
    try {
      await dispatch(retryFailedWebhooks()).unwrap();
      message.success('Failed webhooks retry initiated');
    } catch (error: any) {
      message.error(error || 'Failed to retry webhooks');
    }
  };

  const handleDeleteOld = async () => {
    try {
      await dispatch(deleteOldWebhooks(30)).unwrap();
      message.success('Old webhooks deleted successfully');
    } catch (error: any) {
      message.error(error || 'Failed to delete old webhooks');
    }
  };

  const columns = [
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => <Tag color="blue">{platform.toUpperCase()}</Tag>,
    },
    {
      title: 'Event Type',
      dataIndex: 'eventType',
      key: 'eventType',
    },
    {
      title: 'Status',
      dataIndex: 'processed',
      key: 'processed',
      render: (processed: boolean) => (
        <Tag color={processed ? 'green' : 'orange'}>
          {processed ? 'Processed' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Integration',
      dataIndex: ['integration', 'name'],
      key: 'integration',
      render: (name: string) => name || 'N/A',
    },
    {
      title: 'Received',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Processed At',
      dataIndex: 'processedAt',
      key: 'processedAt',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              Modal.info({
                title: 'Webhook Payload',
                content: (
                  <pre className="webhook-log">
                    {JSON.stringify(record.payload, null, 2)}
                  </pre>
                ),
                width: 800,
              });
            }}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Webhooks</h1>
          <p className="text-gray-400">Monitor incoming webhook events</p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRetryFailed}
          >
            Retry Failed
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={handleDeleteOld}
          >
            Clean Old
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Space wrap>
          <Input
            placeholder="Search webhooks..."
            style={{ width: 200 }}
          />
          <Select
            placeholder="Platform"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, platform: value || '' })}
          >
            <Option value="slack">Slack</Option>
            <Option value="jira">Jira</Option>
            <Option value="airtable">Airtable</Option>
            <Option value="github">GitHub</Option>
            <Option value="trello">Trello</Option>
            <Option value="notion">Notion</Option>
          </Select>
          <Select
            placeholder="Status"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, processed: value })}
          >
            <Option value={true}>Processed</Option>
            <Option value={false}>Pending</Option>
          </Select>
        </Space>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {stats.recentCount || 0}
              </div>
              <div className="text-gray-400">Last 24h</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {stats.byPlatform?.filter((s: any) => s.processed)?.reduce((sum: number, s: any) => sum + s._count, 0) || 0}
              </div>
              <div className="text-gray-400">Processed</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {stats.byPlatform?.filter((s: any) => !s.processed)?.reduce((sum: number, s: any) => sum + s._count, 0) || 0}
              </div>
              <div className="text-gray-400">Pending</div>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <Table
          columns={columns}
          dataSource={webhooks}
          loading={loading}
          rowKey="id"
          pagination={{
            current: filters.page,
            pageSize: filters.limit,
            total: webhooks.length,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, pageSize) => {
              setFilters({ ...filters, page, limit: pageSize || 20 });
            },
          }}
        />
      </Card>
    </div>
  );
};

export default Webhooks;
