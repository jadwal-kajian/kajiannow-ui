import axios from 'axios';

const config = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    accept: "application/json",
    Authorization: "Bearer kullubid'atindholaalah"
  },
});

export default config;
