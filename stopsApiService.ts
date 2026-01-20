export interface StopData {
    stop_id: string;
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
}
trip_id: string;
arrival_time: string;
route_short_name: string;
route_color: string;
trip_headsign: string;
scheduled_time: string;
estimated_time: string;
delay_seconds: number;
}

export async function fetchStops(limit = 500): Promise<Stop[]> {
    try {
        const response = await fetch(`http://localhost:3001/api/stops?limit=${limit}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Error fetching stops:', error);
        return [];
    }
}

export async function fetchStopSchedule(stopId: string): Promise<ScheduleEntry[]> {
    try {
        const response = await fetch(`http://localhost:3001/api/schedule/${stopId}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.schedule || [];
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return [];
    }
}
