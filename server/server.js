import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import NTAService from './services/ntaService.js';
import gtfsStatic from './services/gtfsStaticService.js';
import db from './services/databaseService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NTA_API_KEY = process.env.NTA_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
let ntaService;

async function initializeServices() {
    console.log('🚀 Initializing services...');

    // Load GTFS Static data first
    await gtfsStatic.loadStaticData();

    // Then start NTA polling
    if (NTA_API_KEY && NTA_API_KEY !== 'your_nta_api_key_here') {
        ntaService = new NTAService(NTA_API_KEY, gtfsStatic);
        ntaService.startPolling(30);
    } else {
        console.warn('⚠️  NTA_API_KEY not configured. Using mock data only.');
    }
}

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        ntaConnected: !!ntaService,
        gtfsLoaded: gtfsStatic.isLoaded(),
        ...(ntaService && ntaService.getPositions())
    });
});

app.get('/api/live-positions', (req, res) => {
    if (!ntaService) {
        return res.json(generateMockPositions());
    }

    const data = ntaService.getPositions();
    res.json(data.positions);
});

// Get all stops
app.get('/api/stops', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 1000;
        const stops = db.getAllStops(limit);
        res.json(stops);
    } catch (error) {
        console.error('Stops error:', error);
        res.status(500).json({ error: 'Failed to fetch stops' });
    }
});

// Get schedule for a specific stop
app.get('/api/schedule/:stopId', (req, res) => {
    try {
        const { stopId } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        const stopInfo = db.getStopInfo(stopId);
        if (!stopInfo) {
            return res.status(404).json({ error: 'Stop not found' });
        }

        const schedule = db.getStopSchedule(stopId, limit);

        res.json({
            stop: stopInfo,
            schedule: schedule
        });
    } catch (error) {
        console.error('Schedule error:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

// Mock data generator
function generateMockPositions() {
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

// Start server
app.listen(PORT, async () => {
    console.log(`🚌 Dublin Transit Backend running on http://localhost:${PORT}`);
    console.log(`📍 API endpoints:`);
    console.log(`   - GET /api/live-positions`);
    console.log(`   - GET /api/health`);

    // Initialize services after server starts
    await initializeServices();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    if (ntaService) {
        ntaService.stopPolling();
    }
    process.exit(0);
});
