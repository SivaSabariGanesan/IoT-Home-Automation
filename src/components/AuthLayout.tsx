import React, { ReactNode } from 'react';
import { Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in">
        <div className="bg-primary-900 p-6 flex flex-col items-center">
          <div className="flex items-center text-white mb-4">
            <Cpu size={32} className="mr-2" />
            <h1 className="text-2xl font-bold">IoT Hub</h1>
          </div>
          <h2 className="text-xl font-semibold text-white text-center">{title}</h2>
          <p className="text-primary-100 mt-1 text-center text-sm md:text-base">{subtitle}</p>
        </div>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
      <div className="mt-6 text-sm text-gray-600 flex flex-wrap justify-center gap-4 px-4">
        <Link to="/" className="hover:text-primary-700 transition-colors">Login</Link>
        <Link to="/register" className="hover:text-primary-700 transition-colors">Register</Link>
        <Link to="/forgot-password" className="hover:text-primary-700 transition-colors">Forgot Password</Link>
      </div>
    </div>
  );
};

export default AuthLayout;