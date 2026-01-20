export interface StopData {
    stop_id: string;
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
}

export interface ScheduleEntry {
    trip_id: string;
    arrival_time: string;
    route_short_name: string;
    route_color: string;
    trip_headsign: string;
    scheduled_time: string;
    estimated_time: string;
    delay_seconds: number;
}

// Use environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export async function fetchStops(limit = 500): Promise<StopData[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stops?limit=${limit}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Error fetching stops:', error);
        return [];
    }
}

export async function fetchStopSchedule(stopId: string): Promise<ScheduleEntry[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule/${stopId}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.schedule || [];
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return [];
    }
}
