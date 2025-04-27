import React from 'react';
import { Device } from '../hooks/useDevice';
import { Thermometer, Fan, Power, Droplets } from 'lucide-react';
import Button from './Button';

interface DeviceGridProps {
  devices: Device[];
}

const DeviceGrid = ({ devices }: DeviceGridProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'temperature': return Thermometer;
      case 'humidity': return Droplets;
      case 'fan': return Fan;
      default: return Power;
    }
  };

  const formatValue = (device: Device) => {
    return `${device.currentValue}${device.unit}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devices.map(device => {
        const Icon = getIcon(device.type);
        
        return (
          <div 
            key={device._id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{device.name}</h3>
                  <p className="text-xs text-gray-500">{device.location}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  device.status === 'Online' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {device.status}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                {formatValue(device)}
              </span>
              <Button variant="outline" className="text-xs py-1 px-3">
                Control
              </Button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Last updated: {new Date(device.lastUpdated).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DeviceGrid;