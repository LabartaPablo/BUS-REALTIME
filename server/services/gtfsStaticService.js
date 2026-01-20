import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GTFSStaticService {
    constructor() {
        this.routes = new Map();
        this.agencies = new Map();
        this.loaded = false;
    }

    async loadStaticData() {
        try {
            console.log('📂 Loading GTFS Static data...');

            // Load routes
            await this.loadRoutes();

            // Load agencies
            await this.loadAgencies();

            this.loaded = true;
            console.log(`✅ Loaded ${this.routes.size} routes and ${this.agencies.size} agencies`);
        } catch (error) {
            console.error('❌ Error loading GTFS Static:', error);
            throw error;
        }
    }

    async loadRoutes() {
        const routesPath = path.join(__dirname, '../data/routes.txt');
        const content = fs.readFileSync(routesPath, 'utf-8');
        const lines = content.split('\n');
        const headers = lines[0].split(',');

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(',');
            const route = {};

            headers.forEach((header, index) => {
                route[header.trim()] = values[index]?.trim() || '';
            });

            this.routes.set(route.route_id, {
                id: route.route_id,
                shortName: route.route_short_name,
                longName: route.route_long_name,
                type: route.route_type,
                color: route.route_color ? `#${route.route_color}` : null,
                textColor: route.route_text_color ? `#${route.route_text_color}` : null,
                agencyId: route.agency_id
            });
        }
    }

    async loadAgencies() {
        const agenciesPath = path.join(__dirname, '../data/agency.txt');
        const content = fs.readFileSync(agenciesPath, 'utf-8');
        const lines = content.split('\n');
        const headers = lines[0].split(',');

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(',');
            const agency = {};

            headers.forEach((header, index) => {
                agency[header.trim()] = values[index]?.trim() || '';
            });

            this.agencies.set(agency.agency_id, {
                id: agency.agency_id,
                name: agency.agency_name,
                url: agency.agency_url,
                timezone: agency.agency_timezone
            });
        }
    }

    getRoute(routeId) {
        return this.routes.get(routeId) || null;
    }

    getRouteName(routeId) {
        const route = this.routes.get(routeId);
        return route ? route.shortName : routeId;
    }

    getRouteColor(routeId) {
        const route = this.routes.get(routeId);
        if (!route) return '#007bff'; // Default blue

        // If route has explicit color, use it
        if (route.color) return route.color;

        // Otherwise, determine by route pattern
        const shortName = route.shortName;

        // Spine routes (C and G series) - Green
        if (shortName.startsWith('C') || shortName.startsWith('G')) {
            return '#00D06E';
        }

        // Orbital routes (N series) - Green
        if (shortName.startsWith('N')) {
            return '#00D06E';
        }

        // Dublin Bus (agency 978) - Yellow
        if (route.agencyId === '978') {
            return '#FFD700';
        }

        // Go-Ahead and others - Blue
        return '#007bff';
    }

    getAgency(agencyId) {
        return this.agencies.get(agencyId) || null;
    }

    isLoaded() {
        return this.loaded;
    }
}

// Singleton instance
const gtfsStatic = new GTFSStaticService();

export default gtfsStatic;
