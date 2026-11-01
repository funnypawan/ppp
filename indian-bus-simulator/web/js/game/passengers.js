/**
 * Passenger system: waiting passengers at bus stops, boarding, seating,
 * destinations, satisfaction and fares.
 */

import { clamp, clamp01, lerp } from '../util/math.js';
import { passengerFare } from './economy.js';
import { seatCapacity } from '../vehicles/specs.js';

export class PassengerSystem {
  constructor(map, spec, options = {}) {
    this.map = map;
    this.spec = spec;
    this.capacity = seatCapacity(spec) + (spec.standingCapacity || 0);
    this.passengers = [];
    this.onboard = 0;
    this.satisfaction = 1;
    this.totalFares = 0;
    this.delivered = 0;
    this.boardingAnimations = [];
    this.onEvent = options.onEvent || (() => {});
    this._initWaiting();
  }

  _initWaiting() {
    for (const stop of this.map.stops) {
      stop.waiting = 3 + Math.floor(Math.random() * 6);
      stop.boarded = 0;
      stop.alighted = 0;
    }
  }

  get waitingTotal() {
    return this.map.stops.reduce((sum, s) => sum + s.waiting, 0);
  }

  /** Nearest stop to a position within `radius` metres. */
  nearestStop(x, y, radius = 12) {
    let best = null;
    let bestDist = radius;
    for (const stop of this.map.stops) {
      const d = Math.hypot(stop.x - x, stop.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = stop;
      }
    }
    return best;
  }

  /**
   * @param {number} dt
   * @param {object} bus { x, y, speed, doorsOpen }
   * @param {object} opts { canBoard }
   */
  update(dt, bus, opts = {}) {
    // Harsh driving knocks passenger satisfaction down.
    const harsh = Math.max(0, Math.abs(bus.lateralG || 0) - 0.25) +
      Math.max(0, Math.abs(bus.longitudinalG || 0) - 0.55);
    if (harsh > 0) {
      this.satisfaction = clamp01(this.satisfaction - harsh * dt * 0.08);
    } else {
      this.satisfaction = clamp01(this.satisfaction + dt * 0.004);
    }

    const stop = this.nearestStop(bus.x, bus.y, 14);
    this.activeStop = stop;

    if (!stop || !bus.doorsOpen) return null;

    const stopped = Math.abs(bus.speed) < 0.6;
    if (!stopped) return null;

    let boarded = 0;
    if (stop.waiting > 0 && this.onboard < this.capacity) {
      const maxBoard = Math.min(stop.waiting, this.capacity - this.onboard, opts.boardRate || 3);
      for (let i = 0; i < maxBoard; i++) {
        const destination = this._pickDestination(stop);
        if (!destination) break;
        stop.waiting -= 1;
        stop.boarded += 1;
        this.onboard += 1;
        this.passengers.push({
          id: `p${Math.random().toString(36).slice(2, 9)}`,
          from: stop.id,
          to: destination.id,
          satisfaction: 1,
          boardProgress: 0,
        });
        boarded += 1;
      }
      if (boarded > 0) {
        this.onEvent('board', { count: boarded, stop });
      }
    }

    let alighted = 0;
    const leaving = this.passengers.filter((p) => p.to === stop.id);
    for (const p of leaving) {
      const fare = passengerFare(this._tripDistance(p), p.satisfaction);
      this.totalFares += fare;
      this.delivered += 1;
      stop.alighted += 1;
      this.onboard = Math.max(0, this.onboard - 1);
      alighted += 1;
    }
    if (alighted > 0) {
      this.passengers = this.passengers.filter((p) => p.to !== stop.id);
      this.onEvent('alight', { count: alighted, stop, fare: this.totalFares });
    }

    return { boarded, alighted, stop };
  }

  _pickDestination(origin) {
    const others = this.map.stops.filter((s) => s.id !== origin.id);
    if (!others.length) return null;
    return others[Math.floor(Math.random() * others.length)];
  }

  _tripDistance(passenger) {
    const from = this.map.stops.find((s) => s.id === passenger.from);
    const to = this.map.stops.find((s) => s.id === passenger.to);
    if (!from || !to) return 2;
    return Math.hypot(to.x - from.x, to.y - from.y) / 1000;
  }

  /** Average satisfaction of the passengers currently on board. */
  averageSatisfaction() {
    if (!this.passengers.length) return this.satisfaction;
    const sum = this.passengers.reduce((acc, p) => acc + p.satisfaction, 0);
    return lerp(this.satisfaction, sum / this.passengers.length, 0.5);
  }

  get isFull() {
    return this.onboard >= this.capacity;
  }
}
