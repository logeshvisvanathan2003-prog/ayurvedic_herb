import axios from 'axios'

// Local dev (npm run dev): no VITE_API_URL set → falls back to '/api',
// which Vite's dev-server proxy forwards to localhost:5000 (see vite.config.ts).
// Production build (npm run build, e.g. on Render): VITE_API_URL is baked in
// at build time as an environment variable, pointing at the real deployed
// backend — there's no dev-server proxy once this is a static build, so it
// needs the full absolute URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('ayurveda-auth')
    if (stored) {
      const { state } = JSON.parse(stored)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    }
  } catch {}
  return config
})

export default api