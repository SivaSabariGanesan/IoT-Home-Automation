import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { requestPasswordReset, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    try {
      await requestPasswordReset(email);
      toast.success('Password reset OTP sent to your email');
      navigate('/reset-password', { state: { email } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset OTP');
    }
  };

  return (
    <AuthLayout 
      title="Forgot Password" 
      subtitle="Enter your email to reset your password"
    >
      <form onSubmit={handleSubmit} className="animate-slide-up">
        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          error={error}
          autoComplete="email"
        />
        
        <Button
          type="submit"
          isLoading={loading}
          className="w-full mb-4"
        >
          Send Reset Code
        </Button>
        
        <p className="text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/" className="text-primary-700 hover:text-primary-800 font-medium">
            Back to login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;