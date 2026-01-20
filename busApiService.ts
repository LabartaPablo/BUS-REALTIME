export interface BusPosition {
    id: string;
    lat: number;
    lng: number;
    route_short_name: string;
    route_color?: string;
    bearing: number;
    headsign?: string;
    agency_id?: string;
}

export async function fetchBusPositions(): Promise<BusPosition[]> {
    try {
        // Call the backend API
        const response = await fetch('http://localhost:3001/api/live-positions');

        if (!response.ok) {
            console.warn('Backend not available, using local mock data');
            return generateMockBusPositions();
        }

        const buses: BusPosition[] = await response.json();
        console.log(`Received ${buses.length} bus positions from backend`);
        return buses;
    } catch (error) {
        console.error('Error fetching from backend:', error);
        return generateMockBusPositions();
    }
}

// Generate mock bus positions for Dublin area
function generateMockBusPositions(): BusPosition[] {
    const dublinCenter = { lat: 53.3498, lng: -6.2603 };
    const routes = ['1', '4', '7', '9', '11', '13', '14', '15', '16', '26', '27', '33', '37', '38', '39', '40', '41', '46A', '122', '123', '145', '155', 'C1', 'C2', 'C3', 'C4', 'G1', 'G2', 'N4', 'N6'];
    const headsigns = ['City Centre', 'Heuston Station', 'Bray', 'Howth', 'Phoenix Park', 'Airport'];

    return Array.from({ length: 50 }).map((_, i) => ({
        id: `bus-${i}`,
        lat: dublinCenter.lat + (Math.random() - 0.5) * 0.05,
        lng: dublinCenter.lng + (Math.random() - 0.5) * 0.08,
        route_short_name: routes[Math.floor(Math.random() * routes.length)],
        bearing: Math.floor(Math.random() * 360),
        headsign: headsigns[Math.floor(Math.random() * headsigns.length)],
        agency_id: Math.random() > 0.4 ? '978' : '3'
    }));
}
