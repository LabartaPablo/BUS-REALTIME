
import { BusRoute, Stop } from './types';

export const MOCK_ROUTES: BusRoute[] = [
  {
    id: 'r1',
    number: '145',
    destination: 'Heuston Station',
    nextStop: 'Leeson Street Upper',
    status: 'On Time',
    arrivalTime: '8 mins',
    occupancy: 'Plenty of seats',
    color: '#137fec'
  },
  {
    id: 'r2',
    number: '46A',
    destination: 'Phoenix Park',
    nextStop: 'St. Stephen\'s Green',
    status: 'Delayed',
    arrivalTime: '12 mins',
    occupancy: 'Standing room',
    color: '#FFC72C'
  },
  {
    id: 'r3',
    number: '155',
    destination: 'Ikea',
    nextStop: 'O\'Connell St',
    status: 'On Time',
    arrivalTime: '6 mins',
    occupancy: 'Plenty of seats',
    color: '#137fec'
  }
];

export const MOCK_STOPS: Stop[] = [
  { id: '271', name: 'O\'Connell Street Upper', isAccessible: true, coords: { x: 250, y: 450 } },
  { id: '272', name: 'Westmoreland Street', isAccessible: true, coords: { x: 180, y: 600 } },
  { id: '273', name: 'D\'Olier Street', isAccessible: false, coords: { x: 220, y: 300 } }
];

export const MAP_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCcVNJqiQduBUGklf4z8OhLneGkbTL3nQhobIAK_DI19Q39od3hqwoSmfcw7SsHcQVNqJ5X5mjRlL8RW2-EeaGUvl4Es0ftiKcc0PPakz11R3xAA1Q_B9-DGee8cu9cjxgcwpy5wdALcTKTH_oqqSM5Bmp_Aw_5BVu7cV1W0G4KBvG7jrbOSGO8Yz4VpKSG6pTBEJXek4050-Z20sjTwWXNtFpv_tkbfdMPnNQy_qNeSEH8gclgrESm95VRKGnvpdTb-e6WjkjPKA";
