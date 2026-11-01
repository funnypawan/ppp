/**
 * Economy, daily rewards, achievements and pricing rules.
 * Pure logic so it can be unit tested without a renderer.
 */

import { BUS_SPECS } from '../vehicles/specs.js';

export const DAILY_REWARDS = [
  { day: 1, amount: 500, label: 'Daily fuel voucher' },
  { day: 2, amount: 750, label: 'Daily fuel voucher' },
  { day: 3, amount: 1000, label: 'Daily fuel voucher' },
  { day: 4, amount: 1500, label: 'Daily fuel voucher' },
  { day: 5, amount: 2000, label: 'Daily fuel voucher' },
  { day: 6, amount: 3000, label: 'Daily fuel voucher' },
  { day: 7, amount: 5000, label: 'Weekly bonus payout' },
];

export const ACHIEVEMENTS = [
  { id: 'first_trip', name: 'First Route', description: 'Complete your first passenger trip', reward: 1000, check: (s) => s.trips >= 1 },
  { id: 'ten_trips', name: 'Regular Service', description: 'Complete 10 passenger trips', reward: 2500, check: (s) => s.trips >= 10 },
  { id: 'hundred_trips', name: 'Road Legend', description: 'Complete 100 passenger trips', reward: 15000, check: (s) => s.trips >= 100 },
  { id: 'first_passenger', name: 'Fare Collected', description: 'Deliver your first passenger', reward: 500, check: (s) => s.passengersDelivered >= 1 },
  { id: 'hundred_passengers', name: 'Crowd Favourite', description: 'Deliver 100 passengers', reward: 8000, check: (s) => s.passengersDelivered >= 100 },
  { id: 'distance_100', name: 'Kilometre Club', description: 'Drive 100 km', reward: 2000, check: (s) => s.distanceKm >= 100 },
  { id: 'distance_1000', name: 'High Mileage', description: 'Drive 1000 km', reward: 12000, check: (s) => s.distanceKm >= 1000 },
  { id: 'perfect_10', name: 'Smooth Operator', description: 'Finish 10 trips without a single collision', reward: 4000, check: (s) => s.perfectDrives >= 10 },
  { id: 'night_driver', name: 'Night Shift', description: 'Complete a trip at night', reward: 1500, check: (s) => s.nightTrips >= 0 },
  { id: 'garage_owner', name: 'Garage Owner', description: 'Own three different buses', reward: 6000, check: (s, ctx) => ctx.busCount >= 3 },
  { id: 'clean_record', name: 'Clean Record', description: 'Earn 5,000 in fares', reward: 3000, check: (s) => s.totalFares >= 5000 },
];

export const FARE_PER_KM = 12;
export const FARE_BASE = 5;
export const MAINTENANCE_PER_KM = 3.5;
export const FUEL_PRICE_PER_LITRE = 92;

/** Fare for a passenger covering `distanceKm`. */
export function passengerFare(distanceKm, satisfaction = 1) {
  const base = FARE_BASE + distanceKm * FARE_PER_KM;
  // A happy passenger rounds up, an angry one tips less.
  const tip = 1 + (satisfaction - 0.5) * 0.4;
  return Math.max(1, Math.round(base * tip));
}

/** Running cost of a trip in rupees. */
export function tripRunningCost(distanceKm, litresUsed) {
  return Math.round(distanceKm * MAINTENANCE_PER_KM + litresUsed * FUEL_PRICE_PER_LITRE);
}

/** Fine for breaking a speed limit. */
export function speedFine(limitKmh, actualKmh) {
  const excess = actualKmh - limitKmh;
  if (excess <= 0) return 0;
  if (excess <= 10) return 100;
  if (excess <= 20) return 250;
  if (excess <= 30) return 500;
  return 1000;
}

/** Traffic fine for jumping a red light. */
export function signalFine() {
  return 500;
}

/** Fine for hitting a parked vehicle / property. */
export function collisionFine(damageAmount) {
  return Math.round(250 + damageAmount * 1500);
}

export function busUnlockPrice(busId) {
  const spec = BUS_SPECS.find((b) => b.id === busId);
  return spec ? spec.price : 0;
}

export function canAfford(money, price) {
  return money >= price;
}

/**
 * Daily reward logic.
 * @param {object} dailyState { lastClaimDay: number, streak: number }
 * @param {number} todayDays since epoch (local day number)
 */
export function dailyRewardState(dailyState, todayDays) {
  const last = dailyState.lastClaimDay || 0;
  const streak = dailyState.streak || 0;
  if (last === todayDays) {
    return { available: false, day: (streak % 7) + 1, amount: 0, label: 'Come back tomorrow' };
  }
  const continued = last === todayDays - 1;
  const nextStreak = continued ? streak + 1 : 1;
  const reward = DAILY_REWARDS[(nextStreak - 1) % DAILY_REWARDS.length];
  return {
    available: true,
    day: nextStreak,
    amount: reward.amount,
    label: reward.label,
    nextStreak,
  };
}

export function claimDailyReward(dailyState, todayDays) {
  const state = dailyRewardState(dailyState, todayDays);
  if (!state.available) return { claimed: false, ...state };
  dailyState.lastClaimDay = todayDays;
  dailyState.streak = state.nextStreak;
  return { claimed: true, ...state };
}

/** Evaluate achievements against the current stats + context. */
export function evaluateAchievements(achievementState, stats, context = {}) {
  const unlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (achievementState[a.id]) continue;
    let ok = false;
    try {
      ok = a.check(stats, context);
    } catch (err) {
      ok = false;
    }
    if (ok) {
      achievementState[a.id] = Date.now();
      unlocked.push(a);
    }
  }
  return unlocked;
}

/** Level curve: every level needs a bit more XP. */
export function levelForXp(xp) {
  let level = 1;
  let need = 1000;
  let remaining = xp;
  while (remaining >= need && level < 60) {
    remaining -= need;
    level += 1;
    need = Math.round(need * 1.18);
  }
  return { level, xpIntoLevel: remaining, xpForNext: need };
}
