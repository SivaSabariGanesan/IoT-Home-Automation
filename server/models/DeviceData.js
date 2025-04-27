import mongoose from 'mongoose';

const DeviceDataSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const DeviceData = mongoose.model('DeviceData', DeviceDataSchema);

export default DeviceData;