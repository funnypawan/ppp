/**
 * GPS navigation: routes the bus along the road graph and produces simple
 * "turn left in 120 m" instructions for the HUD.
 */

import { wrapAngle, angleDelta } from '../util/math.js';

export class GpsNavigator {
  constructor(network) {
    this.network = network;
    this.route = [];
    this.routeWorld = [];
    this.destination = null;
    this.currentIndex = 0;
    this.instruction = 'Follow the road';
    this.distanceToTurn = 0;
    this.distanceToDestination = 0;
  }

  setDestination(x, y) {
    this.destination = { x, y };
    const nearest = this.network.nearestEdgePoint(x, y);
    if (!nearest) return null;
    const goalNode = this._closestNode(nearest);
    const startNode = this._closestNodeToPlayer();
    let nodes = startNode !== null ? this.network.findRoute(startNode, goalNode) : null;
    if (!nodes) nodes = [goalNode];
    this.route = nodes;
    this.routeWorld = nodes.map((n) => ({ x: this.network.nodes[n].x, y: this.network.nodes[n].y }));
    this.currentIndex = 0;
    return this.routeWorld;
  }

  _closestNode(point) {
    const net = this.network;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < net.nodes.length; i++) {
      const d = Math.hypot(net.nodes[i].x - point.x, net.nodes[i].y - point.y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  _closestNodeToPlayer() {
    return this._lastNode ?? 0;
  }

  /**
   * @param {object} bus { x, y, heading }
   * @returns {object} guidance
   */
  update(bus) {
    if (!this.routeWorld.length) {
      this.instruction = 'No route';
      return this.guidance(0);
    }

    // Advance the route cursor past waypoints we have already passed.
    let bestIndex = this.currentIndex;
    let bestDist = Infinity;
    for (let i = 0; i < this.routeWorld.length; i++) {
      const d = Math.hypot(this.routeWorld[i].x - bus.x, this.routeWorld[i].y - bus.y);
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }
    this.currentIndex = bestIndex;

    const next = this.routeWorld[Math.min(bestIndex + 1, this.routeWorld.length - 1)];
    const current = this.routeWorld[bestIndex];
    if (!next) {
      this.instruction = 'Arrive at destination';
      return this.guidance(0);
    }

    const dx = next.x - current.x;
    const dy = next.y - current.y;
    const legLength = Math.hypot(dx, dy) || 1;
    const legHeading = Math.atan2(dy, dx);
    const turn = angleDelta(bus.heading, legHeading);

    this.distanceToTurn = Math.hypot(next.x - bus.x, next.y - bus.y);
    this.distanceToDestination = this.destination
      ? Math.hypot(this.destination.x - bus.x, this.destination.y - bus.y)
      : 0;

    if (this.destination && this.distanceToDestination < 25) {
      this.instruction = 'Arrive at destination';
    } else if (Math.abs(turn) < 0.35) {
      this.instruction = 'Continue straight';
    } else if (turn > 0) {
      this.instruction = 'Turn left';
    } else {
      this.instruction = 'Turn right';
    }
    void legLength;
    return this.guidance(this.distanceToTurn);
  }

  guidance(distance) {
    return {
      instruction: this.instruction,
      distance: Math.round(distance),
      totalDistance: Math.round(this.distanceToDestination),
    };
  }

  /** Nearest node to a world position (used when re-planning). */
  nodeNear(x, y) {
    return this._closestNode({ x, y });
  }
}
