// Helper function to interpolate between two bearing angles
// Handles 360° wrap-around properly
export function interpolateBearing(from: number, to: number, progress: number): number {
    let delta = to - from;

    // Handle 360° wrap - choose shortest path
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    return (from + delta * progress + 360) % 360;
}

// Linear interpolation helper
export function lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
}
