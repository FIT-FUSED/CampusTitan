import { Platform } from 'react-native';

// For physical device testing, use your laptop's local IP address
// You can find this by running 'ipconfig getifaddr en0' on Mac
const LOCAL_IP = '10.149.124.163';

const BASE_URL = Platform.OS === 'web'
    ? 'http://localhost:5001/api'
    : `http://${LOCAL_IP}:5001/api`;

export default {
    BASE_URL,
    AUTH_URL: `${BASE_URL}/auth`,
};
