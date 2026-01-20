
export interface BusRoute {
  id: string;
  number: string;
  destination: string;
  nextStop: string;
  status: 'On Time' | 'Delayed' | 'Cancelled' | 'Scheduled';
  arrivalTime: string;
  occupancy: 'Plenty of seats' | 'Standing room' | 'Full';
  color: string;
}

export interface Stop {
  id: string;
  name: string;
  isAccessible: boolean;
  coords: { x: number; y: number };
}

export type Screen = 'MAP' | 'ROUTE_DETAIL' | 'STOP_DETAIL';
