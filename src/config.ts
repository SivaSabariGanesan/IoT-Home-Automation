// Get the local IP for API access
const getBaseUrl = () => {
    if (import.meta.env.DEV) {
      // In development, use the local network IP
      return `http://${window.location.hostname}:5000`;
    }
    return '/api'; // In production, use relative path
  };
  
  const getVoiceControlUrl = () => {
    if (import.meta.env.DEV) {
      // In development, use the local network IP
      return `http://${window.location.hostname}:5001`;
    }
    return '/voice-control'; // In production, use relative path
  };
  
  export const API_URL = getBaseUrl();
  export const VOICE_CONTROL_URL = getVoiceControlUrl();