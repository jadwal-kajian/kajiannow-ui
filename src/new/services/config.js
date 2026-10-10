import axios from 'axios';

// No key here: this repository and the site's JavaScript are public. The
// endpoints the site calls are public too; see docs/API.md.
const config = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    accept: "application/json",
  },
});

export default config;
