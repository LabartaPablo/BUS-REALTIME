# Dublin Transit Radar Backend - Quick Start

## 📋 Prerequisites

1. **Get NTA API Key** (REQUIRED for real data):
   - Visit: https://developer.nationaltransport.ie/
   - Register and create an API key
   - Copy your key

## 🚀 Running the Backend

### Step 1: Configure API Key
```bash
cd server
nano .env   # or use any editor
```

Replace` with your actual NTA API key.

### Step 2: Start Server
```bash
npm start
```

You should see:
```
🚌 Dublin Transit Backend running on http://localhost:3001
✅ Fetched X vehicle positions
```

## Testing

Visit: http://localhost:3001/api/health

You should see JSON with current bus count.

## Without NTA API Key

The server will work with mock data. To get REAL buses, you MUST register for the API key.

## Next Steps

1. Keep backend running (`npm start`)
2. In another terminal, run frontend (`npm run dev` in root directory)
3. Visit http://localhost:3000 - buses will now be real!
