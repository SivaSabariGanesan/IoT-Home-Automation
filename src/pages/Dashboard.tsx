import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu } from 'lucide-react';
import Button from '../components/Button';
import BluetoothControl from '../components/BluethoothControl';
import { useDevices } from '../hooks/useDevice';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { devices, loading, error } = useDevices();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button 
                className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu size={24} />
              </button>
              <h1 className="text-lg font-medium text-gray-900 ml-2 md:ml-0">IoT Hub</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <button className="p-1 text-gray-700 hover:text-primary-600 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 transform translate-x-1/2 -translate-y-1/2"></span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-700 text-white rounded-full flex items-center justify-center">
                    {user?.fullName.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-900 hidden lg:block">
                    {user?.fullName}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center text-sm"
                >
                  <LogOut size={16} className="mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
          <div className="px-4 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-700 text-white rounded-full flex items-center justify-center">
                  {user?.fullName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-900">{user?.fullName}</span>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-sm"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Welcome, {user?.fullName}!</h2>
          <p className="text-sm md:text-base text-gray-600">Control your IoT devices from one central dashboard.</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center p-4 bg-red-50 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            <BluetoothControl />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;