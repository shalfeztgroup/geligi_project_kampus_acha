import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../store/slices/authSlice';
import { RootState } from '../store';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.auth);

  const onFinish = async (values: any) => {
    try {
      if (isLogin) {
        await dispatch(login(values)).unwrap();
        message.success('Login successful!');
        navigate('/dashboard');
      } else {
        await dispatch(register(values)).unwrap();
        message.success('Registration successful!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      message.error(error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Title level={2} className="text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Title>
          <Text className="text-gray-400">
            {isLogin 
              ? 'Sign in to your Lark Integration account' 
              : 'Get started with Lark Integration platform'
            }
          </Text>
        </div>

        <Form
          name="auth"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
            />
          </Form.Item>

          {!isLogin && (
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please input your name!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your full name"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full"
              loading={loading}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Text className="text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <Button
            type="link"
            onClick={() => setIsLogin(!isLogin)}
            className="p-0"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
