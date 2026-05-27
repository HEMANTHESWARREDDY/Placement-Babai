// Using the direct EC2 IP since Amplify does not allow proxying to HTTP endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.placementbabai.online';
