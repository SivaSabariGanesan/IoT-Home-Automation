import express from 'express';
import { 
  getDevices, 
  getDeviceHistory, 
  updateDeviceData,
  createDevice
} from '../controllers/DeviceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getDevices);
router.get('/:deviceId/history', getDeviceHistory);
router.post('/:deviceId/data', updateDeviceData);
router.post('/', createDevice);

export default router;