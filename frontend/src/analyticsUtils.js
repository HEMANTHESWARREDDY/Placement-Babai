import { API_BASE_URL } from './config';

export const recordSessionJoin = async (sessionId) => {
    if (!sessionId) return;
    try {
        await fetch(`${API_BASE_URL}/api/analytics/join/session/${sessionId}`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error recording session join:', error);
    }
};
