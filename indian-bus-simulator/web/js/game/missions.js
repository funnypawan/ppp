/**
 * Career mode: mission catalogue plus a runtime tracker that evaluates
 * objectives against live gameplay events.
 *
 * Pure logic — the game feeds it events, it decides success/failure.
 */

export const MISSION_CATEGORIES = [
  { id: 'city', name: 'City Driving', icon: '🏙️', color: '#f2a33c' },
  { id: 'village', name: 'Village Driving', icon: '🌾', color: '#7bb661' },
  { id: 'highway', name: 'Highway Driving', icon: '🛣️', color: '#4d9de0' },
  { id: 'long_distance', name: 'Long Distance Routes', icon: '🗺️', color: '#9b6bd6' },
  { id: 'mountain', name: 'Mountain Driving', icon: '⛰️', color: '#8c9aa5' },
  { id: 'night', name: 'Night Driving', icon: '🌙', color: '#5b6ee1' },
  { id: 'rain', name: 'Rain Driving', icon: '🌧️', color: '#4aa3c7' },
  { id: 'passenger', name: 'Passenger Transport', icon: '🧍', color: '#e0604a' },
  { id: 'parking', name: 'Parking Challenges', icon: '🅿️', color: '#6f7c8a' },
];

export const MISSIONS = [
  // ------------------------------------------------------------------ city
  {
    id: 'm_city_01',
    category: 'city',
    title: 'First Shift',
    description: 'Start your career on the Ring Road. Pick up waiting passengers and drop them at the depot.',
    map: 'indian_city',
    bus: 'city_public',
    difficulty: 1,
    timeLimit: 420,
    reward: 4000,
    objectives: [
      { type: 'passengers', count: 6, text: 'Deliver 6 passengers' },
      { type: 'speedLimit', limit: 60, text: 'Never exceed 60 km/h' },
    ],
  },
  {
    id: 'm_city_02',
    category: 'city',
    title: 'Bazaar Traffic',
    description: 'Thread the old bazaar lanes, stop at three halts and keep your passengers calm.',
    map: 'indian_city',
    bus: 'mini_bus',
    difficulty: 2,
    timeLimit: 360,
    reward: 7000,
    objectives: [
      { type: 'passengers', count: 10, text: 'Deliver 10 passengers' },
      { type: 'speedLimit', limit: 45, text: 'Never exceed 45 km/h' },
    ],
  },
  {
    id: 'm_city_03',
    category: 'city',
    title: 'Rush Hour Express',
    description: 'Evening peak traffic on the main avenue. Do not brake the schedule with harsh driving.',
    map: 'indian_city',
    bus: 'city_public',
    difficulty: 3,
    timeLimit: 300,
    reward: 12000,
    objectives: [
      { type: 'passengers', count: 16, text: 'Deliver 16 passengers' },
      { type: 'smooth', text: 'Finish without a single collision' },
    ],
  },
  // ---------------------------------------------------------------- village
  {
    id: 'm_village_01',
    category: 'village',
    title: 'Village Circuit',
    description: 'Collect villagers from the fields and carry them to the weekly market.',
    map: 'indian_village',
    bus: 'mini_bus',
    difficulty: 1,
    timeLimit: 420,
    reward: 6000,
    objectives: [{ type: 'passengers', count: 8, text: 'Deliver 8 passengers' }],
  },
  {
    id: 'm_village_02',
    category: 'village',
    title: 'Pottery Route',
    description: 'A narrow route through the pottery hamlet. Careful with the walls.',
    map: 'indian_village',
    bus: 'mini_bus',
    difficulty: 2,
    timeLimit: 360,
    reward: 9000,
    objectives: [
      { type: 'passengers', count: 12, text: 'Deliver 12 passengers' },
      { type: 'damage', limit: 0.25, text: 'Keep body damage below 25%' },
    ],
  },
  // ---------------------------------------------------------------- highway
  {
    id: 'm_highway_01',
    category: 'highway',
    title: 'Express Run',
    description: 'Get the coach onto the expressway and cover 18 km without losing time.',
    map: 'national_highway',
    bus: 'volvo_inspired',
    difficulty: 2,
    timeLimit: 300,
    reward: 15000,
    objectives: [
      { type: 'distance', distanceKm: 18, text: 'Cover 18 km' },
      { type: 'speedLimit', limit: 100, text: 'Never exceed 100 km/h' },
    ],
  },
  {
    id: 'm_highway_02',
    category: 'highway',
    title: 'Toll to Toll',
    description: 'Pass every toll plaza at a legal speed and keep the coach on schedule.',
    map: 'national_highway',
    bus: 'luxury_coach',
    difficulty: 3,
    timeLimit: 330,
    reward: 22000,
    objectives: [
      { type: 'distance', distanceKm: 26, text: 'Cover 26 km' },
      { type: 'passengers', count: 14, text: 'Deliver 14 passengers' },
    ],
  },
  // ---------------------------------------------------------- long distance
  {
    id: 'm_long_01',
    category: 'long_distance',
    title: 'Overnight Haul',
    description: 'A sleeper bus run across three towns. Passenger comfort matters more than speed.',
    map: 'national_highway',
    bus: 'sleeper_buses',
    difficulty: 3,
    timeLimit: 600,
    reward: 28000,
    objectives: [
      { type: 'passengers', count: 18, text: 'Deliver 18 passengers' },
      { type: 'satisfaction', min: 0.6, text: 'Keep passenger satisfaction above 60%' },
    ],
  },
  {
    id: 'm_long_02',
    category: 'long_distance',
    title: 'Cross Country',
    description: 'Two hundred kilometres of highway, one bus, one deadline.',
    map: 'national_highway',
    bus: 'volvo_inspired',
    difficulty: 4,
    timeLimit: 720,
    reward: 45000,
    objectives: [
      { type: 'distance', distanceKm: 60, text: 'Cover 60 km' },
      { type: 'passengers', count: 30, text: 'Deliver 30 passengers' },
    ],
  },
  // --------------------------------------------------------------- mountain
  {
    id: 'm_mountain_01',
    category: 'mountain',
    title: 'Hill Station Climb',
    description: 'Take the tourist bus up to the hill station. Use the engine brake on the way down.',
    map: 'mountain_road',
    bus: 'tourist_bus',
    difficulty: 2,
    timeLimit: 480,
    reward: 18000,
    objectives: [
      { type: 'passengers', count: 12, text: 'Deliver 12 passengers' },
      { type: 'speedLimit', limit: 50, text: 'Never exceed 50 km/h' },
    ],
  },
  {
    id: 'm_mountain_02',
    category: 'mountain',
    title: 'Ghat Road Master',
    description: 'Hairpin bends on a mountain highway. Precision beats bravery.',
    map: 'mountain_road',
    bus: 'tourist_bus',
    difficulty: 4,
    timeLimit: 420,
    reward: 35000,
    objectives: [
      { type: 'passengers', count: 16, text: 'Deliver 16 passengers' },
      { type: 'damage', limit: 0.15, text: 'Keep body damage below 15%' },
    ],
  },
  // ------------------------------------------------------------------ night
  {
    id: 'm_night_01',
    category: 'night',
    title: 'Midnight Service',
    description: 'A quiet highway run after midnight. The road is yours, the fatigue is real.',
    map: 'night_highway',
    bus: 'luxury_coach',
    difficulty: 2,
    timeLimit: 420,
    reward: 20000,
    objectives: [
      { type: 'distance', distanceKm: 22, text: 'Cover 22 km' },
      { type: 'speedLimit', limit: 90, text: 'Never exceed 90 km/h' },
    ],
  },
  {
    id: 'm_night_02',
    category: 'night',
    title: 'Sleeping Passenger Run',
    description: 'Collect the night-shift workers from the factory gate.',
    map: 'night_highway',
    bus: 'sleeper_buses',
    difficulty: 3,
    timeLimit: 480,
    reward: 30000,
    objectives: [{ type: 'passengers', count: 20, text: 'Deliver 20 passengers' }],
  },
  // ------------------------------------------------------------------- rain
  {
    id: 'm_rain_01',
    category: 'rain',
    title: 'Monsoon Routes',
    description: 'Heavy rain on the city ring road. Brake early, brake smoothly.',
    map: 'rainy_city',
    bus: 'city_public',
    difficulty: 3,
    timeLimit: 480,
    reward: 24000,
    objectives: [
      { type: 'passengers', count: 12, text: 'Deliver 12 passengers' },
      { type: 'smooth', text: 'Finish without a single collision' },
    ],
  },
  {
    id: 'm_rain_02',
    category: 'rain',
    title: 'Storm Highway',
    description: 'Standing water, low grip and 80 km/h visibility.',
    map: 'rainy_city',
    bus: 'volvo_inspired',
    difficulty: 4,
    timeLimit: 540,
    reward: 42000,
    objectives: [
      { type: 'distance', distanceKm: 25, text: 'Cover 25 km' },
      { type: 'damage', limit: 0.2, text: 'Keep body damage below 20%' },
    ],
  },
  // -------------------------------------------------------------- passenger
  {
    id: 'm_pax_01',
    category: 'passenger',
    title: 'Standing Room',
    description: 'Double decker capacity test — fill the upper deck and keep everyone seated.',
    map: 'indian_city',
    bus: 'double_decker',
    difficulty: 3,
    timeLimit: 420,
    reward: 26000,
    objectives: [
      { type: 'passengers', count: 24, text: 'Deliver 24 passengers' },
      { type: 'satisfaction', min: 0.65, text: 'Keep satisfaction above 65%' },
    ],
  },
  {
    id: 'm_pax_02',
    category: 'passenger',
    title: 'School Trip',
    description: 'The school bus run: twelve children, one tight route, zero incidents.',
    map: 'indian_village',
    bus: 'school_bus',
    difficulty: 2,
    timeLimit: 360,
    reward: 12000,
    objectives: [
      { type: 'passengers', count: 12, text: 'Deliver 12 passengers' },
      { type: 'smooth', text: 'Finish without a single collision' },
    ],
  },
  // --------------------------------------------------------------- parking
  {
    id: 'm_park_01',
    category: 'parking',
    title: 'Depot Bay',
    description: 'Reverse into the depot bay within 60 seconds without touching the wall.',
    map: 'indian_city',
    bus: 'city_public',
    difficulty: 2,
    timeLimit: 120,
    reward: 15000,
    objectives: [{ type: 'park', text: 'Park in the marked bay' }],
  },
  {
    id: 'm_park_02',
    category: 'parking',
    title: 'Reverse Parking',
    description: 'A classic reverse-parking challenge in the old city market.',
    map: 'indian_city',
    bus: 'school_bus',
    difficulty: 3,
    timeLimit: 150,
    reward: 22000,
    objectives: [
      { type: 'park', text: 'Reverse park in the bay' },
      { type: 'damage', limit: 0.05, text: 'Keep body damage below 5%' },
    ],
  },
];

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));

export function missionsByCategory(category) {
  return MISSIONS.filter((m) => m.category === category);
}

export function categoryOf(missionId) {
  const m = MISSION_BY_ID[missionId];
  return m ? m.category : null;
}

/**
 * Runtime tracker for one mission attempt.
 * Feed it events from the game loop and read `status` / `progressText`.
 */
export class MissionSession {
  constructor(mission, options = {}) {
    this.mission = mission;
    this.elapsed = 0;
    this.status = 'running'; // running | complete | failed
    this.failReason = '';
    this.passengersDelivered = 0;
    this.passengersPicked = 0;
    this.distanceKm = 0;
    this.startDistance = options.startDistance || 0;
    this.collisions = 0;
    this.maxDamage = 0;
    this.speedViolations = 0;
    this.satisfactionSum = 0;
    this.satisfactionCount = 0;
    this.parked = false;
    this.parkTime = 0;
    this.reward = 0;
    this.rewardBreakdown = null;
    this.distanceAtStart = 0;
    this.wrongSignal = 0;
  }

  get objectives() {
    return this.mission.objectives || [];
  }

  onPassengerPicked() {
    this.passengersPicked += 1;
  }

  onPassengerDropped(satisfaction = 1) {
    this.passengersDelivered += 1;
    this.satisfactionSum += satisfaction;
    this.satisfactionCount += 1;
  }

  onCollision(damage) {
    this.collisions += 1;
    this.maxDamage = Math.max(this.maxDamage, damage);
  }

  onSpeedViolation() {
    this.speedViolations += 1;
  }

  onParked(reverse = false) {
    this.parked = true;
    this.parkedInReverse = reverse;
    this.parkTime = this.elapsed;
  }

  /** @param {number} dt seconds @param {object} ctx { speedKmh, damage, satisfaction, odometerKm } */
  update(dt, ctx) {
    if (this.status !== 'running') return this.status;
    this.elapsed += dt;
    const limit = this.mission.timeLimit;
    if (limit && this.elapsed > limit) {
      this.status = 'failed';
      this.failReason = 'Time limit exceeded';
      return this.status;
    }
    if (ctx) {
      this.maxDamage = Math.max(this.maxDamage, ctx.damage || 0);
    }
    for (const obj of this.objectives) {
      if (obj.type === 'passengers' && this.passengersDelivered >= obj.count) continue;
      if (obj.type === 'distance' && this.distanceKm >= obj.distanceKm) continue;
      if (obj.type === 'speedLimit' && this.speedViolations === 0) continue;
      if (obj.type === 'smooth' && this.collisions === 0) continue;
      if (obj.type === 'damage' && this.maxDamage < obj.limit) continue;
      if (obj.type === 'satisfaction' && this.averageSatisfaction >= obj.min) continue;
      if (obj.type === 'park' && this.parked) continue;
      // Not every objective satisfied yet.
      return 'running';
    }
    this.status = 'complete';
    this._award();
    return this.status;
  }

  get averageSatisfaction() {
    if (this.satisfactionCount === 0) return 1;
    return this.satisfactionSum / this.satisfactionCount;
  }

  _award() {
    const base = this.mission.reward || 0;
    const timeBonus = Math.round(base * 0.25 * Math.max(0, 1 - this.elapsed / (this.mission.timeLimit || 1)));
    const smoothBonus = this.collisions === 0 ? Math.round(base * 0.2) : 0;
    const total = base + timeBonus + smoothBonus;
    this.reward = total;
    this.rewardBreakdown = { base, timeBonus, smoothBonus, total };
  }

  /** Human readable objective progress, used by the HUD. */
  progressText() {
    return this.objectives
      .map((obj) => {
        switch (obj.type) {
          case 'passengers':
            return `${obj.text} (${this.passengersDelivered}/${obj.count})`;
          case 'distance':
            return `${obj.text} (${this.distanceKm.toFixed(1)}/${obj.distanceKm} km)`;
          case 'speedLimit':
            return `${obj.text}${this.speedViolations ? ' — VIOLATED' : ''}`;
          case 'smooth':
            return `${obj.text}${this.collisions ? ' — FAILED' : ''}`;
          case 'damage':
            return `${obj.text} (${Math.round(this.maxDamage * 100)}%)`;
          case 'satisfaction':
            return `${obj.text} (${Math.round(this.averageSatisfaction * 100)}%)`;
          case 'park':
            return `${obj.text}${this.parked ? ' — DONE' : ''}`;
          default:
            return obj.text;
        }
      })
      .join('  •  ');
  }

  get timeRemaining() {
    if (!this.mission.timeLimit) return Infinity;
    return Math.max(0, this.mission.timeLimit - this.elapsed);
  }
}
