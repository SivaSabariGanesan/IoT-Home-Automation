import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { resetPassword, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const email = location.state?.email;
    if (!email) {
      navigate('/forgot-password');
      return;
    }
    setEmail(email);
  }, [location, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.otp) newErrors.otp = 'OTP is required';
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      await resetPassword(email, formData.newPassword, formData.otp);
      toast.success('Password reset successful');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password reset failed');
    }
  };

  return (
    <AuthLayout 
      title="Reset Password" 
      subtitle="Enter your OTP and new password"
    >
      <form onSubmit={handleSubmit} className="animate-slide-up">
        <Input
          label="Verification Code"
          id="otp"
          name="otp"
          type="text"
          placeholder="Enter OTP from email"
          value={formData.otp}
          onChange={handleChange}
          error={errors.otp}
          className="text-center"
        />
        
        <Input
          label="New Password"
          id="newPassword"
          name="newPassword"
          type="password"
          placeholder="••••••••"
          value={formData.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          autoComplete="new-password"
        />
        
        <Input
          label="Confirm New Password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        
        <Button
          type="submit"
          isLoading={loading}
          className="w-full mb-4"
        >
          Reset Password
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

export default ResetPassword;