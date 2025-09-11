import React from 'react';
import { Card, Form, Input, Button, message, Avatar, Upload } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updateProfile } from '../store/slices/authSlice';

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state: RootState) => state.auth);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      await dispatch(updateProfile(values)).unwrap();
      message.success('Profile updated successfully');
    } catch (error: any) {
      message.error(error || 'Failed to update profile');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Profile Information">
          <Form
            form={form}
            layout="vertical"
            initialValues={user}
            onFinish={onFinish}
          >
            <Form.Item label="Avatar">
              <div className="flex items-center space-x-4">
                <Avatar
                  size={64}
                  icon={<UserOutlined />}
                  src={user?.avatar}
                />
                <Upload
                  name="avatar"
                  listType="text"
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />}>Change Avatar</Button>
                </Upload>
              </div>
            </Form.Item>

            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please input your name!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
            >
              <Input disabled />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Update Profile
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Account Information">
          <div className="space-y-4">
            <div>
              <label className="text-gray-400">User ID</label>
              <div className="text-white font-mono">{user?.id}</div>
            </div>
            <div>
              <label className="text-gray-400">Role</label>
              <div className="text-white">{user?.role}</div>
            </div>
            <div>
              <label className="text-gray-400">Member Since</label>
              <div className="text-white">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="API Configuration" className="mt-6">
        <div className="space-y-4">
          <div>
            <label className="text-gray-400">API Base URL</label>
            <div className="text-white font-mono">
              {import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}
            </div>
          </div>
          <div>
            <label className="text-gray-400">WebSocket URL</label>
            <div className="text-white font-mono">
              {import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
