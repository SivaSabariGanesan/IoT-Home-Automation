import Device from '../models/Device.js';
import DeviceData from '../models/DeviceData.js';

// Get all devices for user
export const getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.userId });
    res.status(200).json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get device data history
export const getDeviceHistory = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { hours = 24 } = req.query;

    const data = await DeviceData.find({
      deviceId,
      timestamp: { 
        $gte: new Date(Date.now() - hours * 60 * 60 * 1000) 
      }
    }).sort({ timestamp: 1 });

    res.status(200).json(data);
  } catch (error) {
    console.error('Get device history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update device data
export const updateDeviceData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { value } = req.body;

    // Update device current value and status
    const device = await Device.findByIdAndUpdate(
      deviceId,
      {
        currentValue: value,
        status: 'Online',
        lastUpdated: new Date()
      },
      { new: true }
    );

    // Save historical data point
    await DeviceData.create({
      deviceId,
      value
    });

    res.status(200).json(device);
  } catch (error) {
    console.error('Update device data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new device
export const createDevice = async (req, res) => {
  try {
    const { name, type, location, unit } = req.body;

    const device = await Device.create({
      name,
      type,
      location,
      unit,
      userId: req.userId
    });

    res.status(201).json(device);
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};