import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import axios from 'axios';
import { API_URL } from '../config';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [resending, setResending] = useState(false);
  const { verifyOTP, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get email from location state
    const email = location.state?.email;
    if (!email) {
      navigate('/');
      return;
    }
    setEmail(email);

    // Timer for resend button
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location, navigate]);

  const handleResendOTP = async () => {
    try {
      setResending(true);
      await axios.post(`${API_URL}/api/auth/resend-otp`, { email });
      toast.success('OTP resent successfully');
      setTimeLeft(60);
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    
    try {
      await verifyOTP(email, otp);
      toast.success('Email verified successfully');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
      setError('Invalid OTP');
    }
  };

  return (
    <AuthLayout 
      title="Verify Your Email" 
      subtitle="Enter the OTP code sent to your email"
    >
      <div className="text-center mb-6 animate-fade-in">
        <p className="text-gray-600">
          We've sent a verification code to <span className="font-medium">{email}</span>
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="animate-slide-up">
        <Input
          label="Verification Code"
          id="otp"
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value);
            setError('');
          }}
          error={error}
          className="text-center text-2xl tracking-widest"
          maxLength={6}
        />
        
        <Button
          type="submit"
          isLoading={loading}
          className="w-full mb-4"
        >
          Verify Email
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Didn't receive the code?
          </p>
          
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-500">
              Resend code in {timeLeft} seconds
            </p>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleResendOTP}
              isLoading={resending}
              className="text-sm"
            >
              Resend Verification Code
            </Button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
};

export default VerifyOTP;