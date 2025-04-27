import React, { useState, useEffect } from 'react';
import { Bluetooth, Send, Lightbulb, Fan, Mic, Chrome, FileText, Code, Calculator, FileEdit, Youtube, Volume2, Power, Search, Mail, MessageCircle, Bot } from 'lucide-react';
import Button from './Button';
import toast from 'react-hot-toast';
import axios from 'axios';
import { VOICE_CONTROL_URL } from '../config';

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

const APP_COMMANDS = {
  'open chrome': { icon: Chrome, message: 'Opening Chrome' },
  'close chrome': { icon: Chrome, message: 'Closing Chrome' },
  'open notepad': { icon: FileText, message: 'Opening Notepad' },
  'close notepad': { icon: FileText, message: 'Closing Notepad' },
  'open vscode': { icon: Code, message: 'Opening VS Code' },
  'close vscode': { icon: Code, message: 'Closing VS Code' },
  'open calculator': { icon: Calculator, message: 'Opening Calculator' },
  'close calculator': { icon: Calculator, message: 'Closing Calculator' },
  'open word': { icon: FileEdit, message: 'Opening Word' },
  'close word': { icon: FileEdit, message: 'Closing Word' },
  'youtube search play': { icon: Youtube, message: 'Searching YouTube' },
  'close youtube': { icon: Youtube, message: 'Closing YouTube' },
  'volume up': { icon: Volume2, message: 'Increasing volume' },
  'volume down': { icon: Volume2, message: 'Decreasing volume' },
  'shutdown': { icon: Power, message: 'Shutting down system' },
  'open whatsapp': { icon: MessageCircle, message: 'Opening WhatsApp Web' },
  'open gmail': { icon: Mail, message: 'Opening Gmail' },
  'open chatgpt': { icon: Bot, message: 'Opening ChatGPT' }
};

const DEVICE_COMMANDS = [
  { command: 'light on', icon: Lightbulb, label: 'Light ON' },
  { command: 'light off', icon: Lightbulb, label: 'Light OFF' },
  { command: 'motor on', icon: Fan, label: 'Motor ON' },
  { command: 'motor off', icon: Fan, label: 'Motor OFF' }
];

const BluetoothControl = () => {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [command, setCommand] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<{ links: string[]; titles: string[] } | null>(null);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'device' | 'app'>('device');
  const [showAllCommands, setShowAllCommands] = useState(false);

  useEffect(() => {
    const getVolumeLevel = async () => {
      try {
        const response = await axios.post(`${VOICE_CONTROL_URL}/api/command`, {
          command: 'get volume'
        });
        if (response.data.volume !== undefined) {
          setVolumeLevel(response.data.volume);
        }
      } catch (error) {
        console.error('Failed to get volume level:', error);
      }
    };

    getVolumeLevel();
  }, []);

  const connectBluetooth = async () => {
    try {
      setIsConnecting(true);
      
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [{
          name: 'ESP32Voice'
        }],
        optionalServices: [SERVICE_UUID]
      });

      const server = await bluetoothDevice.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      const service = await server.getPrimaryService(SERVICE_UUID);
      const char = await service.getCharacteristic(CHARACTERISTIC_UUID);
      
      setDevice(bluetoothDevice);
      setCharacteristic(char);
      toast.success('Connected to ESP32');

      bluetoothDevice.addEventListener('gattserverdisconnected', () => {
        setDevice(null);
        setCharacteristic(null);
        toast.error('Device disconnected');
      });

    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        toast.error('No device selected. Please try again.');
      } else if (error.name === 'SecurityError') {
        toast.error('Bluetooth permission denied. Please enable Bluetooth access.');
      } else if (error.name === 'NetworkError') {
        toast.error('Device connection failed. Please try again.');
      } else {
        console.error('Bluetooth connection error:', error);
        toast.error('Failed to connect: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const sendCommand = async (cmd: string) => {
    try {
      const response = await axios.post(`${VOICE_CONTROL_URL}/api/command`, {
        command: cmd
      });

      if (response.data.success) {
        if (response.data.volume !== undefined) {
          setVolumeLevel(response.data.volume);
        }

        if (response.data.results) {
          setYoutubeResults(response.data.results);
        }

        setRecentCommands(prev => [cmd, ...prev].slice(0, 5));
        
        const appCommand = APP_COMMANDS[cmd.toLowerCase()];
        if (appCommand) {
          toast.success(appCommand.message);
        } else {
          toast.success('Command executed successfully');
        }
      } else {
        toast.error(response.data.error || 'Command failed');
      }

      if (cmd.includes('light') || cmd.includes('motor')) {
        if (!characteristic) {
          toast.error('Device not connected');
          return;
        }

        const encoder = new TextEncoder();
        const commandBytes = encoder.encode(cmd);
        await characteristic.writeValue(commandBytes);
      }
      
      setCommand('');
    } catch (error: any) {
      console.error('Failed to send command:', error);
      toast.error('Failed to send command: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      await sendCommand(`chrome search ${searchQuery}`);
      setSearchQuery('');
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    }
  };

  const startVoiceRecognition = async () => {
    try {
      setIsListening(true);
      
      const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const voiceCommand = event.results[0][0].transcript.toLowerCase();
        setCommand(voiceCommand);
        sendCommand(voiceCommand);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Failed to recognize speech');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error('Voice recognition error:', error);
      toast.error('Voice recognition not supported in this browser');
      setIsListening(false);
    }
  };

  const disconnect = async () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setDevice(null);
    setCharacteristic(null);
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-2 md:space-y-0">
        <h3 className="text-lg font-medium text-gray-900">ESP32 Control Panel</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Volume2 size={18} className="text-gray-600" />
            <div className="w-16 md:w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${volumeLevel}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{volumeLevel}%</span>
          </div>
          <div className={`w-3 h-3 rounded-full ${device ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>

      {!device ? (
        <Button
          onClick={connectBluetooth}
          isLoading={isConnecting}
          className="w-full mb-4"
        >
          <Bluetooth className="mr-2" size={18} />
          Connect to ESP32
        </Button>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter voice command..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="flex gap-2">
              <Button 
                onClick={() => sendCommand(command)} 
                disabled={!command}
                className="flex-1 md:flex-none"
              >
                <Send size={18} className="mr-2" />
                Send
              </Button>
              <Button
                onClick={startVoiceRecognition}
                disabled={isListening}
                variant={isListening ? 'primary' : 'outline'}
                className={`flex-1 md:flex-none ${isListening ? 'animate-pulse' : ''}`}
              >
                <Mic size={18} className="mr-2" />
                {isListening ? 'Listening...' : 'Voice'}
              </Button>
            </div>
          </div>

          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                activeTab === 'device'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('device')}
            >
              Device Controls
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                activeTab === 'app'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('app')}
            >
              App Controls
            </button>
          </div>

          {activeTab === 'device' ? (
            <div className="grid grid-cols-2 gap-2">
              {DEVICE_COMMANDS.map((cmd, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => sendCommand(cmd.command)}
                  className="flex items-center justify-center"
                >
                  <cmd.icon size={18} className="mr-2" />
                  {cmd.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search on Chrome..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <Button type="submit" disabled={!searchQuery.trim()} className="w-full md:w-auto">
                  Search
                </Button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(APP_COMMANDS).map(([cmd, { icon: Icon, message }]) => (
                  <Button
                    key={cmd}
                    variant="outline"
                    onClick={() => sendCommand(cmd)}
                    className="flex items-center justify-center text-sm"
                  >
                    <Icon size={16} className="mr-2 shrink-0" />
                    <span className="truncate">{cmd}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {youtubeResults && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">YouTube Results</h4>
              <div className="space-y-2">
                {youtubeResults.titles.map((title, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 line-clamp-1">{title}</span>
                    <Button
                      variant="outline"
                      onClick={() => sendCommand(`play video ${index + 1}`)}
                      className="text-xs py-1 px-2 ml-2 shrink-0"
                    >
                      Play
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentCommands.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Commands</h4>
              <div className="space-y-2">
                {recentCommands.map((cmd, index) => {
                  const appCommand = APP_COMMANDS[cmd.toLowerCase()];
                  const Icon = appCommand?.icon;
                  return (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      {Icon && <Icon size={14} className="mr-2 shrink-0" />}
                      <span className="line-clamp-1">{cmd}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm mt-4">
            <span className="text-gray-600">
              Connected to: {device.name || 'ESP32 Device'}
            </span>
            <button
              onClick={disconnect}
              className="text-red-600 hover:text-red-700"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BluetoothControl;