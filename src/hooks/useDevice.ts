import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

export interface Device {
  _id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'light' | 'fan';
  location: string;
  status: 'Online' | 'Offline';
  currentValue: number;
  unit: string;
  lastUpdated: string;
}

export const useDevices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchDevices, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return { devices, loading, error, refetch: fetchDevices };
};