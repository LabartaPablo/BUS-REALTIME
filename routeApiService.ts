export interface RouteStop {
    stop_id: string;
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
    stop_sequence: number;
    arrival_time: string;
    departure_time: string;
}

export interface RouteShape {
    shape_pt_lat: number;
    shape_pt_lon: number;
    shape_pt_sequence: number;
}

export interface RouteDetails {
    route: {
        route_id: string;
        route_short_name: string;
        route_long_name: string;
        route_color: string;
        trip_headsign: string;
    };
    stops: RouteStop[];
    shape: RouteShape[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export async function fetchRouteDetails(routeShortName: string): Promise<RouteDetails | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/routes/${routeShortName}`);

        if (!response.ok) {
            console.warn(`Route ${routeShortName} not found`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching route details:', error);
        return null;
    }
}
