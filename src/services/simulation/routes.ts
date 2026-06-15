import type { Route } from './types'

export const aircraftRoutes: Route[] = [
  {
    id: 'AC-001',
    waypoints: [
      { latitude: 32.456, longitude: 35.789, altitude: 9144, speed: 490 },
      { latitude: 34.000, longitude: 30.000, altitude: 9144, speed: 520 },
      { latitude: 35.500, longitude: 28.500, altitude: 9144, speed: 500 },
      { latitude: 36.200, longitude: 31.800, altitude: 9144, speed: 480 },
      { latitude: 34.300, longitude: 33.900, altitude: 9144, speed: 490 },
    ],
  },
  {
    id: 'AC-002',
    waypoints: [
      { latitude: 31.123, longitude: 121.456, altitude: 18288, speed: 575 },
      { latitude: 28.500, longitude: 123.500, altitude: 18800, speed: 560 },
      { latitude: 25.000, longitude: 122.000, altitude: 19100, speed: 550 },
      { latitude: 24.500, longitude: 120.000, altitude: 18800, speed: 570 },
      { latitude: 27.000, longitude: 120.500, altitude: 18500, speed: 580 },
    ],
  },
  {
    id: 'AC-003',
    waypoints: [
      { latitude: 55.678, longitude: 12.345, altitude: 12192, speed: 890 },
      { latitude: 57.000, longitude: 14.500, altitude: 12500, speed: 920 },
      { latitude: 58.500, longitude: 16.000, altitude: 12800, speed: 900 },
      { latitude: 57.500, longitude: 18.500, altitude: 12500, speed: 870 },
      { latitude: 56.000, longitude: 16.000, altitude: 12200, speed: 890 },
    ],
  },
  {
    id: 'AC-004',
    waypoints: [
      { latitude: 24.567, longitude: 54.890, altitude: 10668, speed: 780 },
      { latitude: 25.500, longitude: 56.000, altitude: 10668, speed: 760 },
      { latitude: 26.800, longitude: 54.000, altitude: 10668, speed: 740 },
      { latitude: 25.000, longitude: 53.000, altitude: 10668, speed: 770 },
    ],
  },
  {
    id: 'AC-005',
    waypoints: [
      { latitude: -12.789, longitude: 96.234, altitude: 7620, speed: 640 },
      { latitude: -10.500, longitude: 98.000, altitude: 7620, speed: 620 },
      { latitude: -9.000, longitude: 95.000, altitude: 7620, speed: 650 },
      { latitude: -11.000, longitude: 93.500, altitude: 7620, speed: 660 },
    ],
  },
  {
    id: 'AC-006',
    waypoints: [
      { latitude: 33.234, longitude: 44.567, altitude: 305, speed: 260 },
      { latitude: 34.000, longitude: 45.000, altitude: 305, speed: 240 },
      { latitude: 35.000, longitude: 44.000, altitude: 305, speed: 250 },
      { latitude: 34.200, longitude: 43.200, altitude: 305, speed: 260 },
    ],
  },
  {
    id: 'AC-007',
    waypoints: [
      { latitude: -38.123, longitude: 145.678, altitude: 15240, speed: 900 },
      { latitude: -36.500, longitude: 148.000, altitude: 15500, speed: 920 },
      { latitude: -37.000, longitude: 150.000, altitude: 15800, speed: 880 },
      { latitude: -39.000, longitude: 148.500, altitude: 15500, speed: 910 },
    ],
  },
  {
    id: 'AC-008',
    waypoints: [
      { latitude: 41.890, longitude: -85.123, altitude: 10668, speed: 720 },
      { latitude: 43.000, longitude: -83.000, altitude: 10668, speed: 700 },
      { latitude: 44.500, longitude: -84.500, altitude: 10668, speed: 730 },
      { latitude: 43.000, longitude: -86.500, altitude: 10668, speed: 740 },
    ],
  },
  {
    id: 'AC-009',
    waypoints: [
      { latitude: 16.456, longitude: -3.789, altitude: 7620, speed: 230 },
      { latitude: 15.000, longitude: -2.000, altitude: 7620, speed: 220 },
      { latitude: 14.000, longitude: -4.000, altitude: 7620, speed: 240 },
      { latitude: 15.500, longitude: -5.500, altitude: 7620, speed: 230 },
    ],
  },
  {
    id: 'AC-010',
    waypoints: [
      { latitude: 35.678, longitude: 139.012, altitude: 152, speed: 170 },
      { latitude: 36.500, longitude: 140.500, altitude: 152, speed: 160 },
      { latitude: 37.000, longitude: 139.000, altitude: 152, speed: 175 },
      { latitude: 36.000, longitude: 138.000, altitude: 152, speed: 170 },
    ],
  },
]

export const maritimeRoutes: Route[] = [
  {
    id: 'MV-001',
    waypoints: [
      { latitude: 26.012, longitude: 56.789, altitude: 0, speed: 18 },
      { latitude: 27.200, longitude: 55.500, altitude: 0, speed: 16 },
      { latitude: 26.800, longitude: 54.200, altitude: 0, speed: 14 },
      { latitude: 25.500, longitude: 55.000, altitude: 0, speed: 17 },
    ],
  },
  {
    id: 'MV-002',
    waypoints: [
      { latitude: 33.567, longitude: 131.234, altitude: 0, speed: 14 },
      { latitude: 34.500, longitude: 129.800, altitude: 0, speed: 13 },
      { latitude: 33.800, longitude: 128.000, altitude: 0, speed: 12 },
      { latitude: 32.500, longitude: 129.500, altitude: 0, speed: 14 },
    ],
  },
  {
    id: 'MV-003',
    waypoints: [
      { latitude: -42.123, longitude: 176.345, altitude: 0, speed: 12 },
      { latitude: -41.500, longitude: 174.800, altitude: 0, speed: 11 },
      { latitude: -42.500, longitude: 173.500, altitude: 0, speed: 10 },
      { latitude: -43.000, longitude: 175.000, altitude: 0, speed: 12 },
    ],
  },
  {
    id: 'MV-004',
    waypoints: [
      { latitude: 1.234, longitude: 103.890, altitude: 0, speed: 20 },
      { latitude: 2.000, longitude: 104.500, altitude: 0, speed: 18 },
      { latitude: 2.500, longitude: 103.000, altitude: 0, speed: 19 },
      { latitude: 1.500, longitude: 102.800, altitude: 0, speed: 20 },
    ],
  },
  {
    id: 'MV-005',
    waypoints: [
      { latitude: 12.456, longitude: 68.901, altitude: 0, speed: 22 },
      { latitude: 13.500, longitude: 70.000, altitude: 0, speed: 20 },
      { latitude: 14.000, longitude: 69.000, altitude: 0, speed: 21 },
      { latitude: 13.000, longitude: 68.000, altitude: 0, speed: 22 },
    ],
  },
  {
    id: 'MV-006',
    waypoints: [
      { latitude: 40.789, longitude: 4.567, altitude: 0, speed: 16 },
      { latitude: 41.500, longitude: 6.000, altitude: 0, speed: 15 },
      { latitude: 42.000, longitude: 5.000, altitude: 0, speed: 14 },
      { latitude: 41.200, longitude: 3.800, altitude: 0, speed: 16 },
    ],
  },
  {
    id: 'MV-007',
    waypoints: [
      { latitude: 48.901, longitude: -5.678, altitude: 0, speed: 10 },
      { latitude: 49.500, longitude: -4.000, altitude: 0, speed: 11 },
      { latitude: 50.000, longitude: -5.500, altitude: 0, speed: 10 },
      { latitude: 49.200, longitude: -6.800, altitude: 0, speed: 10 },
    ],
  },
  {
    id: 'MV-008',
    waypoints: [
      { latitude: 56.789, longitude: 10.234, altitude: 0, speed: 15 },
      { latitude: 57.500, longitude: 11.500, altitude: 0, speed: 14 },
      { latitude: 58.000, longitude: 10.500, altitude: 0, speed: 13 },
      { latitude: 57.200, longitude: 9.500, altitude: 0, speed: 15 },
    ],
  },
  {
    id: 'MV-009',
    waypoints: [
      { latitude: 18.234, longitude: 114.567, altitude: 0, speed: 20 },
      { latitude: 19.000, longitude: 115.500, altitude: 0, speed: 18 },
      { latitude: 19.500, longitude: 114.000, altitude: 0, speed: 19 },
      { latitude: 18.500, longitude: 113.500, altitude: 0, speed: 20 },
    ],
  },
  {
    id: 'MV-010',
    waypoints: [
      { latitude: 31.567, longitude: 32.345, altitude: 0, speed: 8 },
      { latitude: 32.000, longitude: 33.000, altitude: 0, speed: 9 },
      { latitude: 32.500, longitude: 32.000, altitude: 0, speed: 8 },
      { latitude: 31.800, longitude: 31.500, altitude: 0, speed: 8 },
    ],
  },
]
