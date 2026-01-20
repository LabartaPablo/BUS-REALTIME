import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseService {
  constructor() {
    const dbPath = path.join(__dirname, '../database/dublin_transit.db');
    this.db = new Database(dbPath, { readonly: true });
    this.db.pragma('journal_mode = WAL');
    console.log('📚 Database service initialized');
  }

  getStopSchedule(stopId, limit = 20) {
    const query = `
      SELECT 
        st.trip_id,
        st.arrival_time,
        st.departure_time,
        st.stop_sequence,
        t.trip_headsign,
        t.direction_id,
        r.route_short_name,
        r.route_color,
        r.route_id
      FROM stop_times st
      JOIN trips t ON st.trip_id = t.trip_id
      JOIN routes r ON t.route_id = r.route_id
      WHERE st.stop_id = ?
        AND st.arrival_time >= ?
      ORDER BY st.arrival_time
      LIMIT ?
    `;

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}:00`;

    const results = this.db.prepare(query).all(stopId, currentTime, limit);

    return results.map(row => ({
      ...row,
      route_color: row.route_color ? `#${row.route_color}` : '#007bff',
      scheduled_time: row.arrival_time,
      estimated_time: row.arrival_time,
      delay_seconds: 0
    }));
  }

  getStopInfo(stopId) {
    const query = 'SELECT * FROM stops WHERE stop_id = ?';
    return this.db.prepare(query).get(stopId);
  }

  getAllStops(limit = 500) {
    // Return only Dublin area stops (approximate bounding box)
    const query = `
      SELECT stop_id, stop_name, stop_lat, stop_lon 
      FROM stops 
      WHERE stop_lat BETWEEN 53.2 AND 53.5
        AND stop_lon BETWEEN -6.5 AND -6.0
        AND stop_lat IS NOT NULL 
        AND stop_lon IS NOT NULL
      LIMIT ?
    `;
    return this.db.prepare(query).all(limit);
  }

  close() {
    this.db.close();
  }
}

export default new DatabaseService();
