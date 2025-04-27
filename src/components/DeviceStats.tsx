import React from 'react';
import { Device } from '../hooks/useDevice';
import { Power, Thermometer, Fan, Droplets } from 'lucide-react';

interface DeviceStatsProps {
  devices: Device[];
}

const DeviceStats = ({ devices }: DeviceStatsProps) => {
  const getDevicesByType = (type: string) => 
    devices.filter(d => d.type === type);

  const getAverageValue = (type: string) => {
    const typeDevices = getDevicesByType(type);
    if (!typeDevices.length) return 0;
    return typeDevices.reduce((acc, dev) => acc + dev.currentValue, 0) / typeDevices.length;
  };

  const stats = [
    {
      title: 'Active Devices',
      value: devices.filter(d => d.status === 'Online').length,
      total: devices.length,
      icon: Power,
      color: 'bg-green-100 text-green-700'
    },
    {
      title: 'Temperature',
      value: getAverageValue('temperature').toFixed(1),
      unit: '°C',
      icon: Thermometer,
      color: 'bg-red-100 text-red-700'
    },
    {
      title: 'Humidity',
      value: getAverageValue('humidity').toFixed(0),
      unit: '%',
      icon: Droplets,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      title: 'Active Fans',
      value: getDevicesByType('fan').filter(d => d.currentValue > 0).length,
      total: getDevicesByType('fan').length,
      icon: Fan,
      color: 'bg-amber-100 text-amber-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 transform transition-all duration-500 hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">{stat.title}</h3>
            <div className={`p-2 ${stat.color} rounded-full`}>
              <stat.icon size={18} />
            </div>
          </div>
          <div className="flex items-end">
            <span className="text-3xl font-bold text-gray-800">
              {stat.value}
              {stat.unit && <span className="text-lg ml-1">{stat.unit}</span>}
            </span>
            {stat.total && (
              <span className="ml-2 text-sm text-gray-600">
                of {stat.total}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeviceStats;