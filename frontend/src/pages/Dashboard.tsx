import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Spin } from 'antd';
import { 
  IntegrationOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  SyncOutlined,
  WebhookOutlined
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import { dashboardAPI } from '../services/api';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7');

  const { data: overview, isLoading: overviewLoading } = useQuery(
    'dashboard-overview',
    () => dashboardAPI.getOverview(),
    { refetchInterval: 30000 }
  );

  const { data: metrics, isLoading: metricsLoading } = useQuery(
    ['dashboard-metrics', timeRange],
    () => dashboardAPI.getMetrics({ days: timeRange })
  );

  const { data: activity, isLoading: activityLoading } = useQuery(
    ['dashboard-activity', timeRange],
    () => dashboardAPI.getActivity({ days: timeRange })
  );

  if (overviewLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const syncChartData = {
    labels: metrics?.dailySyncs?.map((item: any) => item.date) || [],
    datasets: [
      {
        label: 'Successful',
        data: metrics?.dailySyncs?.filter((item: any) => item.status === 'SUCCESS')?.map((item: any) => item.count) || [],
        borderColor: '#52c41a',
        backgroundColor: 'rgba(82, 196, 26, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Failed',
        data: metrics?.dailySyncs?.filter((item: any) => item.status === 'FAILED')?.map((item: any) => item.count) || [],
        borderColor: '#ff4d4f',
        backgroundColor: 'rgba(255, 77, 79, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const webhookChartData = {
    labels: metrics?.dailyWebhooks?.map((item: any) => item.date) || [],
    datasets: [
      {
        label: 'Processed',
        data: metrics?.dailyWebhooks?.filter((item: any) => item.processed)?.map((item: any) => item.count) || [],
        backgroundColor: '#1890ff',
      },
      {
        label: 'Pending',
        data: metrics?.dailyWebhooks?.filter((item: any) => !item.processed)?.map((item: any) => item.count) || [],
        backgroundColor: '#faad14',
      },
    ],
  };

  const integrationStatusData = {
    labels: ['Active', 'Inactive', 'Error'],
    datasets: [
      {
        data: [
          overview?.metrics?.activeIntegrations || 0,
          (overview?.metrics?.totalIntegrations || 0) - (overview?.metrics?.activeIntegrations || 0),
          0
        ],
        backgroundColor: ['#52c41a', '#8c8c8c', '#ff4d4f'],
      },
    ],
  };

  const recentSyncsColumns = [
    {
      title: 'Integration',
      dataIndex: ['integration', 'name'],
      key: 'integration',
    },
    {
      title: 'Type',
      dataIndex: ['integration', 'type'],
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          SUCCESS: 'green',
          FAILED: 'red',
          PENDING: 'orange',
          RETRYING: 'blue',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration ? `${duration}ms` : '-',
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your integrations and data sync status</p>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Integrations"
              value={overview?.metrics?.totalIntegrations || 0}
              prefix={<IntegrationOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Integrations"
              value={overview?.metrics?.activeIntegrations || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={overview?.metrics?.successRate || 0}
              suffix="%"
              prefix={<SyncOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Webhooks"
              value={overview?.metrics?.totalWebhooks || 0}
              prefix={<WebhookOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="Sync Activity" className="h-80">
            <Line data={syncChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Webhook Activity" className="h-80">
            <Bar data={webhookChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={8}>
          <Card title="Integration Status" className="h-80">
            <Doughnut data={integrationStatusData} options={{ responsive: true, maintainAspectRatio: false }} />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="Recent Sync Activity" className="h-80">
            <Table
              dataSource={overview?.recentSyncs || []}
              columns={recentSyncsColumns}
              pagination={false}
              size="small"
              scroll={{ y: 200 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Activity Timeline */}
      <Card title="Recent Activity">
        <div className="space-y-4">
          {activity?.slice(0, 10).map((item: any, index: number) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-800 rounded">
              <div className={`w-2 h-2 rounded-full ${
                item.type === 'sync' 
                  ? (item.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500')
                  : (item.processed ? 'bg-blue-500' : 'bg-yellow-500')
              }`} />
              <div className="flex-1">
                <div className="text-white">
                  {item.type === 'sync' 
                    ? `Sync ${item.status.toLowerCase()} for ${item.integration?.name}`
                    : `Webhook received from ${item.platform}`
                  }
                </div>
                <div className="text-gray-400 text-sm">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
              <Tag color={item.type === 'sync' ? 'blue' : 'green'}>
                {item.type.toUpperCase()}
              </Tag>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
