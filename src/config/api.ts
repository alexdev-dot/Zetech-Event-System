// src/config/api.ts
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://your-railway-backend-url.railway.app' 
    : 'http://localhost:3001');

export const API_BASE_URL = API_URL;
