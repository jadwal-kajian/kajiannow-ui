import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    accept: 'application/json',
  },
});

export default axiosInstance;
