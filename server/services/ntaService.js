import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import fetch from 'node-fetch';

const NTA_BASE_URL = 'https://api.nationaltransport.ie/gtfsr/v2';
const ENDPOINTS = {
    vehiclePositions: `${NTA_BASE_URL}/Vehicles`,
    tripUpdates: `${NTA_BASE_URL}/TripUpdates`,
    serviceAlerts: `${NTA_BASE_URL}/ServiceAlerts`
};

class NTAService {
    constructor(apiKey, gtfsStatic = null) {
        this.apiKey = apiKey;
        this.gtfsStatic = gtfsStatic;
        this.cache = {
            positions: [],
            lastUpdate: null
        };
        this.pollingInterval = null;
    }

    async fetchProtobuf(endpoint) {
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'x-api-key': this.apiKey,
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`NTA API error: ${response.status} ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
                new Uint8Array(buffer)
            );

            return feed;
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error.message);
            throw error;
        }
    }

    async fetchVehiclePositions() {
        try {
            const feed = await this.fetchProtobuf(ENDPOINTS.vehiclePositions);

            const positions = feed.entity
                .filter(entity => entity.vehicle && entity.vehicle.position)
                .map(entity => {
                    const vehicle = entity.vehicle;
                    const position = vehicle.position;
                    const trip = vehicle.trip || {};

                    const routeId = trip.routeId || 'Unknown';

                    return {
                        id: entity.id,
                        lat: position.latitude,
                        lng: position.longitude,
                        bearing: position.bearing || 0,
                        route_id: routeId,
                        route_short_name: this.gtfsStatic ? this.gtfsStatic.getRouteName(routeId) : routeId,
                        route_color: this.gtfsStatic ? this.gtfsStatic.getRouteColor(routeId) : '#007bff',
                        trip_id: trip.tripId,
                        direction_id: trip.directionId !== undefined ? trip.directionId : null,
                        headsign: trip.directionId === 0 ? 'Inbound' : 'Outbound',
                        agency_id: '978',
                        timestamp: vehicle.timestamp || Date.now() / 1000
                    };
                });

            this.cache.positions = positions;
            this.cache.lastUpdate = new Date();

            console.log(`✅ Fetched ${positions.length} vehicle positions`);
            return positions;
        } catch (error) {
            console.error('Error processing vehicle positions:', error);
            return this.cache.positions; // Return cached data on error
        }
    }

    startPolling(intervalSeconds = 30) {
        console.log(`🚀 Starting NTA polling every ${intervalSeconds} seconds...`);

        // Initial fetch
        this.fetchVehiclePositions();

        // Set up interval
        this.pollingInterval = setInterval(() => {
            this.fetchVehiclePositions();
        }, intervalSeconds * 1000);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            console.log('⏹️  Stopped NTA polling');
        }
    }

    getPositions() {
        return {
            positions: this.cache.positions,
            lastUpdate: this.cache.lastUpdate,
            count: this.cache.positions.length
        };
    }
}

export default NTAService;
