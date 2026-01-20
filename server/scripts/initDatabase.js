import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../database/dublin_transit.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

console.log('🗄️  Initializing SQLite database...');

// Read and execute schema
const schemaPath = path.join(__dirname, '../database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

console.log('✅ Database schema created');

// Import CSV helper
function importCSV(tableName, csvPath, columns) {
    if (!fs.existsSync(csvPath)) {
        console.warn(`⚠️  File not found: ${csvPath}`);
        return 0;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    let imported = 0;
    const batchSize = 1000;
    let batch = [];

    const placeholders = columns.map(() => '?').join(',');
    const insertStmt = db.prepare(`INSERT OR REPLACE INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders})`);

    const insertMany = db.transaction((rows) => {
        for (const row of rows) {
            insertStmt.run(...row);
        }
    });

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = columns.map(col => {
            const index = headers.indexOf(col);
            return index >= 0 ? values[index] : null;
        });

        batch.push(row);

        if (batch.length >= batchSize) {
            insertMany(batch);
            imported += batch.length;
            batch = [];

            if (imported % 10000 === 0) {
                console.log(`   ${tableName}: ${imported.toLocaleString()} rows...`);
            }
        }
    }

    if (batch.length > 0) {
        insertMany(batch);
        imported += batch.length;
    }

    console.log(`✅ ${tableName}: ${imported.toLocaleString()} rows imported`);
    return imported;
}

// Import GTFS data
const dataDir = path.join(__dirname, '../data');

console.log('\n📥 Importing GTFS Static data...\n');

// Import in dependency order
importCSV('routes', path.join(dataDir, 'routes.txt'),
    ['route_id', 'agency_id', 'route_short_name', 'route_long_name', 'route_type', 'route_color', 'route_text_color']);

importCSV('trips', path.join(dataDir, 'trips.txt'),
    ['trip_id', 'route_id', 'service_id', 'trip_headsign', 'direction_id', 'shape_id']);

importCSV('stops', path.join(dataDir, 'stops.txt'),
    ['stop_id', 'stop_name', 'stop_lat', 'stop_lon', 'location_type']);

console.log('\n⏳ Importing stop_times (this may take 2-5 minutes)...\n');
importCSV('stop_times', path.join(dataDir, 'stop_times.txt'),
    ['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence']);

importCSV('calendar', path.join(dataDir, 'calendar.txt'),
    ['service_id', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'start_date', 'end_date']);

console.log('\n🎉 GTFS import complete!\n');

// Print stats
const stats = db.prepare('SELECT name, (SELECT COUNT(*) FROM ' + db.prepare('SELECT name FROM sqlite_master WHERE type="table"').pluck().get() + ') as count FROM sqlite_master WHERE type="table"').all();
console.log('📊 Database statistics:');
['routes', 'trips', 'stops', 'stop_times', 'calendar'].forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get();
    console.log(`   ${table}: ${count.toLocaleString()} rows`);
});

db.close();
console.log('\n✅ Database ready at:', dbPath);
