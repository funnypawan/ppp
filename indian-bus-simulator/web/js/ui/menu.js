/**
 * All menu screens: main menu, garage, customisation, map selection, career
 * mode, free drive, settings, achievements, daily rewards and the pause menu.
 */

import { BUS_SPECS, getBusSpec, seatCapacity } from '../vehicles/specs.js';
import { MAP_DEFS, getMapDef, WEATHER_TYPES, TIME_PHASES } from '../world/mapdefs.js';
import { MISSION_CATEGORIES, MISSIONS } from '../game/missions.js';
import {
  CUSTOM_CATALOG,
  DEFAULT_CUSTOMIZATION,
  catalogEntry,
  customizationPrice,
} from '../game/customization.js';
import { QUALITY_PRESETS } from '../core/settings.js';
import { ACHIEVEMENTS, dailyRewardState } from '../game/economy.js';
import { formatMoney } from '../util/math.js';

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function money(value) {
  return formatMoney(value);
}

export class MenuManager {
  constructor(app) {
    this.app = app;
    this.root = document.getElementById('ui-root');
    this.screens = new Map();
    this.current = 'loading';
    this.freeOptions = {
      busId: app.save.data.selectedBus,
      mapId: app.save.data.selectedMap,
      weather: 'clear',
      timeOfDay: 'day',
      trafficDensity: 0.6,
    };
    this._collectScreens();
    this._buildScreens();
    this._wireGlobal();
  }

  _collectScreens() {
    for (const node of this.root.querySelectorAll('[data-screen]')) {
      this.screens.set(node.dataset.screen, node);
    }
  }

  _screen(id) {
    return this.screens.get(id);
  }

  show(id) {
    for (const [key, node] of this.screens) {
      node.classList.toggle('active', key === id);
    }
    this.current = id;
    this.root.classList.toggle('in-game', id === 'play');
    if (id === 'menu' || id === 'garage' || id === 'customize') {
      this.app.setShowroomBus(
        id === 'customize'
          ? this.app.save.data.selectedBus
          : this.app.save.data.selectedBus
      );
    }
    if (id === 'garage') this._refreshGarage();
    if (id === 'customize') this._refreshCustomize();
    if (id === 'maps') this._refreshMaps();
    if (id === 'career') this._refreshCareer();
    if (id === 'free') this._refreshFree();
    if (id === 'settings') this._refreshSettings();
    if (id === 'achievements') this._refreshAchievements();
    if (id === 'rewards') this._refreshRewards();
    if (id === 'pause') this._refreshPauseStats();
  }

  toggleBigMap() {
    const modal = document.getElementById('big-map-modal');
    if (!modal) return;
    const isOpen = modal.classList.toggle('active');
    if (isOpen) this._ensureBigMap();
  }

  _ensureBigMap() {
    const canvas = document.getElementById('big-map-canvas');
    if (!canvas || !this.app.session) return;
    if (!this.bigMap) {
      // Lazy import avoids loading the minimap in menu-only sessions.
      import('../game/minimap.js').then((m) => {
        this.bigMap = new m.Minimap(canvas, this.app.session.map);
        this.bigMap.range = 420;
        this.bigMap.resize();
      });
    } else {
      this.bigMap.map = this.app.session.map;
      this.bigMap.resize();
    }
  }

  tick(dt) {
    if (this.bigMap && this.app.session) {
      const modal = document.getElementById('big-map-modal');
      if (modal && modal.classList.contains('active')) {
        this.bigMap.draw(
          { x: this.app.session.bus.physics.x, y: this.app.session.bus.physics.y, heading: this.app.session.bus.physics.yaw },
          this.app.session.traffic,
          this.app.session.gps.routeWorld
        );
      }
    }
  }

  _wireGlobal() {
    const exitBtn = document.getElementById('btn-exit');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        this._toast('Exit is disabled in the browser build — close the tab to quit.');
      });
    }
    const mapClose = document.getElementById('big-map-close');
    if (mapClose) {
      mapClose.addEventListener('click', () => this.toggleBigMap());
    }

    // Mission result buttons.
    const resultMenu = document.getElementById('btn-result-menu');
    if (resultMenu) resultMenu.addEventListener('click', () => this.app.exitToMenu());
    const resultNext = document.getElementById('btn-result-next');
    if (resultNext) {
      resultNext.addEventListener('click', () => {
        const completed = this.app.save.data.completedMissions;
        const next = MISSIONS.find((m) => !completed.includes(m.id));
        if (next) this.app.startCareer(next.id);
        else this.app.exitToMenu();
      });
    }
    const failMenu = document.getElementById('btn-fail-menu');
    if (failMenu) failMenu.addEventListener('click', () => this.app.exitToMenu());
    const failRetry = document.getElementById('btn-fail-retry');
    if (failRetry) {
      failRetry.addEventListener('click', () => {
        const s = this.app.session;
        if (!s) return this.app.exitToMenu();
        if (s.mode === 'career') this.app.startCareer(s.mission.id);
        else this.app.startFreeDrive(this.freeOptions);
      });
    }
  }

  _toast(message) {
    const toast = document.getElementById('menu-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2600);
  }

  /* ------------------------------------------------------------ builders */

  _buildScreens() {
    this._buildMenu();
    this._buildGarage();
    this._buildCustomize();
    this._buildMaps();
    this._buildCareer();
    this._buildFree();
    this._buildSettings();
    this._buildAchievements();
    this._buildRewards();
    this._buildPause();
  }

  _buildMenu() {
    const screen = this._screen('menu');
    if (!screen) return;
    screen.innerHTML = `
      <div class="menu-panel">
        <div class="brand">
          <div class="brand-mark">🚌</div>
          <div>
            <h1>Indian Bus Simulator</h1>
            <p class="brand-sub">3D • Realistic Driving • Offline</p>
          </div>
        </div>
        <nav class="menu-list">
          <button class="menu-btn primary" data-action="play"><span>▶</span> Play</button>
          <button class="menu-btn" data-action="career"><span>🏁</span> Career Mode</button>
          <button class="menu-btn" data-action="free"><span>🛣️</span> Free Drive</button>
          <button class="menu-btn" data-action="garage"><span>🔧</span> Bus Garage</button>
          <button class="menu-btn" data-action="customize"><span>🎨</span> Bus Customization</button>
          <button class="menu-btn" data-action="maps"><span>🗺️</span> Map Selection</button>
          <button class="menu-btn" data-action="rewards"><span>🎁</span> Daily Rewards</button>
          <button class="menu-btn" data-action="achievements"><span>🏆</span> Achievements</button>
          <button class="menu-btn" data-action="settings"><span>⚙️</span> Settings</button>
          <button class="menu-btn danger" id="btn-exit"><span>⏻</span> Exit</button>
        </nav>
        <div class="menu-footer">
          <span id="menu-money"></span>
          <span id="menu-bus"></span>
        </div>
      </div>
      <div class="menu-side">
        <div class="side-card" id="menu-tip"></div>
      </div>`;

    screen.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'play') {
          const mission = MISSIONS.find(
            (m) => !this.app.save.data.completedMissions.includes(m.id)
          );
          if (mission) this.app.startCareer(mission.id);
          else this.app.startFreeDrive();
        } else if (action === 'exit') {
          this._toast('Exit is disabled in the browser build.');
        } else {
          this.show(action);
        }
      });
    });
  }

  _buildGarage() {
    const screen = this._screen('garage');
    if (!screen) return;
    screen.innerHTML = `
      <div class="screen-head">
        <h2>Bus Garage</h2>
        <button class="ghost-btn" data-back="menu">← Back</button>
      </div>
      <div class="garage-layout">
        <div class="garage-list" id="garage-list"></div>
        <div class="garage-detail" id="garage-detail"></div>
      </div>`;
    screen.querySelector('[data-back]').addEventListener('click', () => this.show('menu'));
  }

  _refreshGarage() {
    const list = this._screen('garage').querySelector('#garage-list');
    const detail = this._screen('garage').querySelector('#garage-detail');
    if (!list) return;
    list.innerHTML = '';
    for (const spec of BUS_SPECS) {
      const unlocked = this.app.save.isBusUnlocked(spec.id);
      const item = el(
        'button',
        `garage-item ${unlocked ? '' : 'locked'} ${this.app.save.data.selectedBus === spec.id ? 'active' : ''}`
      );
      item.innerHTML = `
        <div class="garage-swatch" style="background:${spec.defaultPaint}"></div>
        <div class="garage-meta">
          <strong>${spec.name}</strong>
          <span>${spec.tagline}</span>
          <small>${spec.powerKw} kW • ${spec.seatRows * spec.seatsPerRow} seats • ${spec.mass / 1000} t</small>
        </div>
        <div class="garage-price">${unlocked ? (this.app.save.data.selectedBus === spec.id ? 'Selected' : 'Select') : money(spec.price)}</div>`;
      item.addEventListener('click', () => {
        if (unlocked) {
          this.app.save.data.selectedBus = spec.id;
          this.app.save.markDirty();
          this.app.setShowroomBus(spec.id);
          this._refreshGarage();
          this._toast(`${spec.name} selected`);
        } else if (this.app.unlockBus(spec.id)) {
          this.app.setShowroomBus(spec.id);
          this._refreshGarage();
          this._toast(`${spec.name} unlocked!`);
        } else {
          this._toast('Not enough money for this bus.');
        }
      });
      list.appendChild(item);
    }

    const spec = getBusSpec(this.app.save.data.selectedBus);
    detail.innerHTML = `
      <h3>${spec.name}</h3>
      <p class="muted">${spec.description}</p>
      <div class="stat-grid">
        <div><span>Engine</span><strong>${spec.powerKw} kW</strong></div>
        <div><span>Torque</span><strong>${spec.peakTorque} Nm</strong></div>
        <div><span>Top speed</span><strong>${spec.maxSpeedKmh} km/h</strong></div>
        <div><span>Gross weight</span><strong>${spec.mass} kg</strong></div>
        <div><span>Wheelbase</span><strong>${spec.wheelbase} m</strong></div>
        <div><span>Seats</span><strong>${seatCapacity(spec)}</strong></div>
        <div><span>Gears</span><strong>${spec.gearRatios.length}</strong></div>
        <div><span>Fuel tank</span><strong>${spec.fuelTank} L</strong></div>
      </div>`;
  }

  _buildCustomize() {
    const screen = this._screen('customize');
    if (!screen) return;
    screen.innerHTML = `
      <div class="screen-head">
        <h2>Bus Customization</h2>
        <div class="head-actions">
          <button class="ghost-btn" id="btn-reset-custom">Reset</button>
          <button class="ghost-btn" data-back="menu">← Back</button>
        </div>
      </div>
      <div class="custom-layout">
        <div class="custom-panel" id="custom-panel"></div>
        <div class="custom-info">
          <h3 id="custom-bus-name"></h3>
          <p class="muted" id="custom-summary"></p>
          <div class="custom-actions">
            <button class="menu-btn primary" id="btn-apply-custom">Apply</button>
          </div>
          <div class="license-row">
            <label>License plate</label>
            <input id="input-plate" maxlength="14" />
          </div>
        </div>
      </div>`;
    screen.querySelector('[data-back]').addEventListener('click', () => this.show('menu'));
    screen.querySelector('#btn-reset-custom').addEventListener('click', () => {
      this.app.save.setCustomization(this.app.save.data.selectedBus, { ...DEFAULT_CUSTOMIZATION });
      this._refreshCustomize();
      this._toast('Customization reset');
    });
    screen.querySelector('#btn-apply-custom').addEventListener('click', () => {
      const busId = this.app.save.data.selectedBus;
      const custom = this.app.save.getCustomization(busId);
      const plate = screen.querySelector('#input-plate').value.trim();
      this.app.save.setCustomization(busId, { ...custom, licensePlate: plate || custom.licensePlate });
      this.app.setShowroomBus(busId, this.app.save.getCustomization(busId));
      this._toast('Customization applied');
    });
  }

  _refreshCustomize() {
    const panel = this._screen('customize').querySelector('#custom-panel');
    if (!panel) return;
    const busId = this.app.save.data.selectedBus;
    const custom = this.app.save.getCustomization(busId);
    const spec = getBusSpec(busId);

    const groups = [
      { key: 'paint', label: 'Paint scheme', list: CUSTOM_CATALOG.paints, value: custom.paint },
      { key: 'bodyColor', label: 'Body colour', list: CUSTOM_CATALOG.bodyColors, value: custom.bodyColor },
      { key: 'interiorColor', label: 'Interior colour', list: CUSTOM_CATALOG.interiorColors, value: custom.interiorColor },
      { key: 'seatDesign', label: 'Seat design', list: CUSTOM_CATALOG.seatDesigns, value: custom.seatDesign },
      { key: 'wheels', label: 'Wheels', list: CUSTOM_CATALOG.wheels, value: custom.wheels },
      { key: 'rims', label: 'Rims', list: CUSTOM_CATALOG.rims, value: custom.rims },
      { key: 'headlights', label: 'Headlights', list: CUSTOM_CATALOG.headlights, value: custom.headlights },
      { key: 'horn', label: 'Horn', list: CUSTOM_CATALOG.horns, value: custom.horn },
      { key: 'windowTint', label: 'Window tint', list: CUSTOM_CATALOG.windowTints, value: null },
    ];

    panel.innerHTML = '';
    for (const group of groups) {
      const wrap = el('div', 'custom-group');
      wrap.appendChild(el('h4', null, group.label));
      const row = el('div', 'option-row');
      for (const option of group.list) {
        const active =
          group.key === 'windowTint'
            ? Math.abs(option.value - (custom.windowTint ?? 0.3)) < 0.01
            : custom[group.key] === option.id;
        const chip = el('button', `option-chip ${active ? 'active' : ''}`);
        chip.innerHTML = option.hex
          ? `<span class="chip-color" style="background:${option.hex}"></span>`
          : '';
        chip.appendChild(el('span', null, option.name));
        if (option.price > 0) chip.appendChild(el('small', null, money(option.price)));
        chip.addEventListener('click', () => {
          if (group.key === 'windowTint') {
            this.app.save.setCustomization(busId, { windowTint: option.value });
          } else {
            this.app.save.setCustomization(busId, { [group.key]: option.id });
          }
          this.app.setShowroomBus(busId, this.app.save.getCustomization(busId));
          this._refreshCustomize();
        });
        row.appendChild(chip);
      }
      wrap.appendChild(row);
      panel.appendChild(wrap);
    }

    // Stickers.
    const stickerWrap = el('div', 'custom-group');
    stickerWrap.appendChild(el('h4', null, 'Stickers'));
    const stickerRow = el('div', 'option-row');
    for (const sticker of CUSTOM_CATALOG.stickers) {
      const active = (custom.stickers || []).includes(sticker.id);
      const chip = el('button', `option-chip ${active ? 'active' : ''}`);
      chip.appendChild(el('span', null, sticker.name));
      if (sticker.price > 0) chip.appendChild(el('small', null, money(sticker.price)));
      chip.addEventListener('click', () => {
        const list = new Set(custom.stickers || []);
        if (sticker.id === 'none') list.clear();
        else if (list.has(sticker.id)) list.delete(sticker.id);
        else list.add(sticker.id);
        this.app.save.setCustomization(busId, { stickers: [...list] });
        this.app.setShowroomBus(busId, this.app.save.getCustomization(busId));
        this._refreshCustomize();
      });
      stickerRow.appendChild(chip);
    }
    stickerWrap.appendChild(stickerRow);
    panel.appendChild(stickerWrap);

    const screen = this._screen('customize');
    screen.querySelector('#custom-bus-name').textContent = spec.name;
    screen.querySelector('#input-plate').value = custom.licensePlate;
    const total = customizationPrice(this.app.save.getCustomization(busId));
    screen.querySelector('#custom-summary').textContent = `Selected upgrades: ${money(total)}`;
    this.app.setShowroomBus(busId, this.app.save.getCustomization(busId));
  }

  _buildMaps() {
    const screen = this._screen('maps');
    if (!screen) return;
    screen.innerHTML = `
      <div class="screen-head">
        <h2>Map Selection</h2>
        <button class="ghost-btn" data-back="menu">← Back</button>
      </div>
      <div class="map-grid" id="map-grid"></div>`;
    screen.querySelector('[data-back]').addEventListener('click', () => this.show('menu'));
  }

  _refreshMaps() {
    const grid = this._screen('maps').querySelector('#map-grid');
    grid.innerHTML = '';
    for (const def of MAP_DEFS) {
      const unlocked = this.app.save.isMapUnlocked(def.id);
      const card = el('div', `map-card ${unlocked ? '' : 'locked'}`);
      card.innerHTML = `
        <div class="map-preview" style="--sky:${def.palette.sky};--ground:${def.palette.ground};--road:${def.palette.road}">
          <span class="map-icon">${['🏙️', '🌾', '🛣️', '⛰️', '🏜️', '🌧️', '🌙'][MAP_DEFS.indexOf(def)]}</span>
        </div>
        <h3>${def.name}</h3>
        <p class="muted">${def.tagline}</p>
        <p class="muted small">${def.description}</p>
        <div class="map-meta">
          <span>Traffic: ${Math.round(def.trafficDensity * 100)}%</span>
          <span>${def.stopCount} stops</span>
        </div>
        <button class="menu-btn ${unlocked ? 'primary' : ''}">${unlocked ? 'Select' : `Unlock ${money(def.price)}`}</button>`;
      card.querySelector('button').addEventListener('click', () => {
        if (unlocked) {
          this.app.save.data.selectedMap = def.id;
          this.app.save.markDirty();
          this._toast(`${def.name} selected`);
          this._refreshMaps();
        } else if (this.app.unlockMap(def.id)) {
          this._toast(`${def.name} unlocked!`);
          this._refreshMaps();
        } else {
          this._toast('Not enough money for this map.');
        }
      });
      grid.appendChild(card);
    }
  }

  _buildCareer() {
    const screen = this._screen('career');
    if (!screen) return;
    screen.innerHTML = `
      <div class="screen-head">
        <h2>Career Mode</h2>
        <button class="ghost-btn" data-back="menu">← Back</button>
      </div>
      <div class="category-row" id="category-row"></div>
      <div class="mission-list" id="mission-list"></div>`;
    screen.querySelector('[data-back]').addEventListener('click', () => this.show('menu'));
  }

  _refreshCareer() {
    const catRow = this._screen('career').querySelector('#category-row');
    const list = this._screen('career').querySelector('#mission-list');
    catRow.innerHTML = '';
    const completed = this.app.save.data.completedMissions;
    for (const cat of MISSION_CATEGORIES) {
      const missions = MISSIONS.filter((m) => m.category === cat.id);
      const done = missions.filter((m) => completed.includes(m.id)).length;
      const chip = el('button', 'category-chip');
      chip.innerHTML = `<span>${cat.icon}</span> ${cat.name} <small>${done}/${missions.length}</small>`;
      chip.style.setProperty('--accent', cat.color);
      chip.addEventListener('click', () => {
        list.innerHTML = '';
        for (const mission of missions) {
          list.appendChild(this._missionCard(mission));
        }
      });
      catRow.appendChild(chip);
    }

    list.innerHTML = '';
    for (const mission of MISSIONS) {
      list.appendChild(this._missionCard(mission));
    }
  }

  _missionCard(mission) {
    const completed = this.app.save.data.completedMissions.includes(mission.id);
    const card = el('div', `mission-card ${completed ? 'completed' : ''}`);
    const cat = MISSION_CATEGORIES.find((c) => c.id === mission.category);
    card.innerHTML = `
      <div class="mission-head">
        <span class="mission-icon">${cat?.icon || '🎯'}</span>
        <div>
          <h3>${mission.title}</h3>
          <span class="muted small">${cat?.name || ''} • ${'★'.repeat(mission.difficulty)}${'☆'.repeat(4 - mission.difficulty)}</span>
        </div>
        <div class="mission-reward">${money(mission.reward)}</div>
      </div>
      <p class="muted">${mission.description}</p>
      <ul class="objective-list">
        ${mission.objectives.map((o) => `<li>${o.text}</li>`).join('')}
      </ul>
      <div class="mission-foot">
        <span class="muted small">Map: ${getMapDef(mission.map).name} • Bus: ${getBusSpec(mission.bus).name} • Limit ${Math.floor(mission.timeLimit / 60)} min</span>
        <button class="menu-btn primary">${completed ? 'Replay' : 'Start'}</button>
      </div>`;
    card.querySelector('button').addEventListener('click', () => {
      this.app.startCareer(mission.id);
    });
    return card;
  }

  _buildFree() {
    const screen = this._screen('free');
    if (!screen) return;
    screen.innerHTML = `
      <div class="screen-head">
        <h2>Free Drive</h2>
        <button class="ghost-btn" data-back="menu">← Back</button>
      </div>
      <div class="free-layout">
        <div class="free-panel" id="free-panel"></div>
        <div class="free-preview">
          <div class="preview-card" id="free-preview"></div>
          <button class="menu-btn primary big" id="btn-start-free">Start Driving</button>
        </div>
      </div>`;
    screen.querySelector('[data-back]').addEventListener('click', () => this.show('menu'));
    screen.querySelector('#btn-start-free').addEventListener('click', () => {
      this.app.startFreeDrive(this.freeOptions);
    });
  }

  _refreshFree() {
    const panel = this._screen('free').querySelector('#free-panel');
    const preview = this._screen('free').querySelector('#free-preview');
    const opts = this.freeOptions;
    panel.innerHTML = '';

    const section = (title, nodes) => {
      const wrap = el('div', 'option-group');
      wrap.appendChild(el('h4', null, title));
      const row = el('div', 'option-row');
      nodes.forEach((n) => row.appendChild(n));
      wrap.appendChild(row);
      panel.appendChild(wrap);
    };

    const busChips = BUS_SPECS.filter((b) => this.app.save.isBusUnlocked(b.id)).map((spec) => {
      const chip = el('button', `option-chip ${opts.busId === spec.id ? 'active' : ''}`);
      chip.innerHTML = `<span class="chip-color" style="background:${spec.defaultPaint}"></span><span>${spec.name}</span>`;
      chip.addEventListener('click', () => {
        opts.busId = spec.id;
        this._refreshFree();
      });
      return chip;
    });
    section('Bus', busChips);

    const mapChips = MAP_DEFS.filter((m) => this.app.save.isMapUnlocked(m.id)).map((def) => {
      const chip = el('button', `option-chip ${opts.mapId === def.id ? 'active' : ''}`);
      chip.appendChild(el('span', null, def.name));
      chip.addEventListener('click', () => {
        opts.mapId = def.id;
        this._refreshFree();
      });
      return chip;
    });
    section('Map', mapChips);

    const weatherChips = WEATHER_TYPES.map((w) => {
      const chip = el('button', `option-chip ${opts.weather === w.id ? 'active' : ''}`);
      chip.innerHTML = `<span>${w.icon}</span><span>${w.name}</span>`;
      chip.addEventListener('click', () => {
        opts.weather = w.id;
        this._refreshFree();
      });
      return chip;
    });
    section('Weather', weatherChips);

    const timeChips = TIME_PHASES.map((t) => {
      const chip = el('button', `option-chip ${opts.timeOfDay === t.id ? 'active' : ''}`);
      chip.innerHTML = `<span>${t.icon}</span><span>${t.name}</span>`;
      chip.addEventListener('click', () => {
        opts.timeOfDay = t.id;
        this._refreshFree();
      });
      return chip;
    });
    section('Time of day', timeChips);

    const density = el('input', 'slider');
    density.type = 'range';
    density.min = '0';
    density.max = '100';
    density.value = String(Math.round(opts.trafficDensity * 100));
    const densityLabel = el('span', 'muted', `${Math.round(opts.trafficDensity * 100)}% traffic`);
    density.addEventListener('input', () => {
      opts.trafficDensity = Number(density.value) / 100;
      densityLabel.textContent = `${density.value}% traffic`;
    });
    const densityRow = el('div', 'slider-row');
    densityRow.appendChild(density);
    densityRow.appendChild(densityLabel);
    const densityGroup = el('div', 'option-group');
    densityGroup.appendChild(el('h4', null, 'Traffic density'));
    densityGroup.appendChild(densityRow);
    panel.appendChild(densityGroup);

    const spec = getBusSpec(opts.busId);
    const def = getMapDef(opts.mapId);
    preview.innerHTML = `
      <h3>${spec.name}</h3>
      <p class="muted">${spec.description}</p>
      <div class="stat-grid small">
        <div><span>Map</span><strong>${def.name}</strong></div>
        <div><span>Weather</span><strong>${(WEATHER_TYPES.find((w) => w.id === opts.weather) || {}).name}</strong></div>
        <div><span>Traffic</span><strong>${Math.round(opts.trafficDensity * 100)}%</strong></div>
        <div><span>Power</span><strong>${spec.powerKw} kW</strong></div>
      </div>`;
  }

  _buildSettings() {
    const screen = this._screen('settings');
    if (!screen) return;
    screen.innerHTML = `
      <div class="screen-head">
        <h2>Settings</h2>
        <button class="ghost-btn" data-back="menu">← Back</button>
      </div>
      <div class="settings-layout">
        <div class="settings-panel" id="settings-panel"></div>
      </div>`;
    screen.querySelector('[data-back]').addEventListener('click', () => this.show('menu'));
  }

  _refreshSettings() {
    const panel = this._screen('settings').querySelector('#settings-panel');
    const settings = this.app.settings;
    panel.innerHTML = '';

    const group = (title) => {
      const wrap = el('div', 'option-group');
      wrap.appendChild(el('h4', null, title));
      panel.appendChild(wrap);
      return wrap;
    };

    // Graphics presets.
    const presetGroup = group('Graphics quality');
    const presetRow = el('div', 'option-row');
    for (const key of Object.keys(QUALITY_PRESETS)) {
      const chip = el('button', `option-chip ${settings.get('quality') === key ? 'active' : ''}`);
      chip.appendChild(el('span', null, QUALITY_PRESETS[key].name));
      chip.addEventListener('click', () => {
        settings.setPreset(key);
        this.app.renderer.shadowMap.enabled = settings.get('shadows');
        this.app._resize();
        this._refreshSettings();
      });
      presetRow.appendChild(chip);
    }
    presetGroup.appendChild(presetRow);

    const slider = (parent, label, key, min, max, step, format) => {
      const row = el('div', 'slider-row');
      const input = el('input', 'slider');
      input.type = 'range';
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(settings.get(key));
      const value = el('span', 'muted', format(settings.get(key)));
      input.addEventListener('input', () => {
        const v = Number(input.value);
        settings.set(key, v);
        value.textContent = format(v);
        if (key === 'pixelRatio' || key === 'antialias') this.app._resize();
        if (key === 'fpsLimit') this.app.settings.persist();
      });
      row.appendChild(el('label', null, label));
      row.appendChild(input);
      row.appendChild(value);
      parent.appendChild(row);
    };

    const gfx = group('Graphics');
    slider(gfx, 'Resolution scale', 'pixelRatio', 0.5, 2, 0.05, (v) => `${Math.round(v * 100)}%`);
    slider(gfx, 'FPS limit', 'fpsLimit', 30, 60, 5, (v) => `${v} fps`);
    slider(gfx, 'Camera sensitivity', 'cameraSensitivity', 0.4, 2, 0.1, (v) => v.toFixed(1));

    const shadowRow = el('div', 'option-row');
    for (const q of ['low', 'high', 'ultra']) {
      const chip = el('button', `option-chip ${settings.get('shadowQuality') === q ? 'active' : ''}`);
      chip.appendChild(el('span', null, q[0].toUpperCase() + q.slice(1)));
      chip.addEventListener('click', () => {
        settings.set('shadowQuality', q);
        this.app.session?.sky.setShadowQuality(q);
        this._refreshSettings();
      });
      shadowRow.appendChild(chip);
    }
    gfx.appendChild(el('label', null, 'Shadow quality'));
    gfx.appendChild(shadowRow);

    const aaRow = el('div', 'option-row');
    for (const [label, value] of [['Off', false], ['On', true]]) {
      const chip = el('button', `option-chip ${settings.get('antialias') === value ? 'active' : ''}`);
      chip.appendChild(el('span', null, label));
      chip.addEventListener('click', () => {
        settings.set('antialias', value);
        this._refreshSettings();
      });
      aaRow.appendChild(chip);
    }
    gfx.appendChild(el('label', null, 'Anti-aliasing'));
    gfx.appendChild(aaRow);

    // Audio.
    const audioGroup = group('Audio');
    const audioRow = el('div', 'option-row');
    for (const [label, value] of [['Off', false], ['On', true]]) {
      const chip = el('button', `option-chip ${settings.get('audio') === value ? 'active' : ''}`);
      chip.appendChild(el('span', null, label));
      chip.addEventListener('click', () => {
        settings.set('audio', value);
        this.app.audio.setEnabled(value);
        this._refreshSettings();
      });
      audioRow.appendChild(chip);
    }
    audioGroup.appendChild(audioRow);
    slider(audioGroup, 'Master volume', 'masterVolume', 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`);
    this.app.audio.setVolume(settings.get('masterVolume'));

    // Gameplay.
    const playGroup = group('Gameplay');
    const gearRow = el('div', 'option-row');
    for (const [label, value] of [['Manual', false], ['Automatic', true]]) {
      const chip = el('button', `option-chip ${settings.get('autoGearbox') === value ? 'active' : ''}`);
      chip.appendChild(el('span', null, label));
      chip.addEventListener('click', () => {
        settings.set('autoGearbox', value);
        if (this.app.session) this.app.session.bus.physics.autoGearbox = value;
        this._refreshSettings();
      });
      gearRow.appendChild(chip);
    }
    playGroup.appendChild(el('label', null, 'Gearbox'));
    playGroup.appendChild(gearRow);

    // Control layout.
    const ctrlGroup = group('Touch control layout');
    const ctrlRow = el('div', 'option-row');
    const editBtn = el('button', 'option-chip');
    editBtn.appendChild(el('span', null, 'Edit layout (in game)'));
    editBtn.addEventListener('click', () => {
      this._toast('Open a drive, tap EDIT LAYOUT on the pause menu to move the controls.');
    });
    const resetBtn = el('button', 'option-chip');
    resetBtn.appendChild(el('span', null, 'Reset layout'));
    resetBtn.addEventListener('click', () => {
      this.app.input.setLayout(null);
      this.app.hud.applyLayout(this.app.input.getLayout());
      this.app.settings.set('controlLayout', null);
      this._toast('Control layout reset');
    });
    ctrlRow.appendChild(editBtn);
    ctrlRow.appendChild(resetBtn);
    ctrlGroup.appendChild(ctrlRow);
  }

  _buildAchievements() {
    const screen = this._screen('achievements');
    if (!screen) return;
    screen.innerHTML = `
      <div class="screen-head">
        <h2>Achievements</h2>
        <button class="ghost-btn" data-back="menu">← Back</button>
      </div>
      <div class="achievement-grid" id="achievement-grid"></div>`;
    screen.querySelector('[data-back]').addEventListener('click', () => this.show('menu'));
  }

  _refreshAchievements() {
    const grid = this._screen('achievements').querySelector('#achievement-grid');
    const stats = this.app.save.data.stats;
    grid.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
      const unlocked = !!this.app.save.data.achievements[a.id];
      const card = el('div', `achievement-card ${unlocked ? 'unlocked' : ''}`);
      card.innerHTML = `
        <div class="ach-icon">${unlocked ? '🏅' : '🔒'}</div>
        <h3>${a.name}</h3>
        <p class="muted small">${a.description}</p>
        <div class="ach-reward">${money(a.reward)}</div>`;
      grid.appendChild(card);
    }
    const summary = el('div', 'stat-strip');
    summary.innerHTML = `
      <div><span>Distance</span><strong>${stats.distanceKm.toFixed(1)} km</strong></div>
      <div><span>Passengers</span><strong>${stats.passengersDelivered}</strong></div>
      <div><span>Trips</span><strong>${stats.trips}</strong></div>
      <div><span>Fares</span><strong>${money(stats.totalFares)}</strong></div>
      <div><span>Top speed</span><strong>${stats.topSpeedKmh} km/h</strong></div>`;
    grid.appendChild(summary);
  }

  _buildRewards() {
    const screen = this._screen('rewards');
    if (!screen) return;
    screen.innerHTML = `
      <div class="screen-head">
        <h2>Daily Rewards</h2>
        <button class="ghost-btn" data-back="menu">← Back</button>
      </div>
      <div class="reward-panel" id="reward-panel"></div>`;
    screen.querySelector('[data-back]').addEventListener('click', () => this.show('menu'));
  }

  _refreshRewards() {
    const panel = this._screen('rewards').querySelector('#reward-panel');
    const state = this.app.dailyRewardInfo();
    panel.innerHTML = `
      <p class="muted">Claim a bonus every day. The streak resets if you miss a day.</p>
      <div class="reward-row">
        ${state.available
          ? `<div class="reward-today big">
               <div class="reward-day">Day ${state.day}</div>
               <div class="reward-amount">${money(state.amount)}</div>
               <div class="muted">${state.label}</div>
               <button class="menu-btn primary" id="btn-claim">Claim</button>
             </div>`
          : `<div class="reward-today big">
               <div class="reward-day">Day ${state.day}</div>
               <div class="muted">${state.label}</div>
             </div>`}
      </div>
      <div class="reward-strip">
        ${Array.from({ length: 7 }, (_, i) => {
          const amount = [500, 750, 1000, 1500, 2000, 3000, 5000][i];
          const claimed = !state.available && i < state.day - 1;
          const current = state.available && i === state.day - 1;
          return `<div class="reward-cell ${claimed ? 'claimed' : ''} ${current ? 'current' : ''}">
            <span>Day ${i + 1}</span><strong>${money(amount)}</strong></div>`;
        }).join('')}
      </div>`;
    const claim = panel.querySelector('#btn-claim');
    if (claim) {
      claim.addEventListener('click', () => {
        const today = Math.floor(Date.now() / 86400000);
        const result = dailyRewardState(this.app.save.data.daily, today);
        if (!result.available) return;
        this.app.save.data.daily.lastClaimDay = today;
        this.app.save.data.daily.streak = result.nextStreak;
        this.app.save.addMoney(result.amount);
        this.app.save.markDirty();
        this._toast(`Claimed ${money(result.amount)}!`);
        this._refreshRewards();
      });
    }
  }

  _buildPause() {
    const screen = this._screen('pause');
    if (!screen) return;
    screen.innerHTML = `
      <div class="pause-panel">
        <h2>Paused</h2>
        <div class="pause-stats" id="pause-stats"></div>
        <div class="menu-list">
          <button class="menu-btn primary" id="btn-resume"><span>▶</span> Resume</button>
          <button class="menu-btn" id="btn-pause-settings"><span>⚙️</span> Settings</button>
          <button class="menu-btn" id="btn-pause-layout"><span>✋</span> Edit Control Layout</button>
          <button class="menu-btn" id="btn-pause-restart"><span>↻</span> Restart Mission</button>
          <button class="menu-btn danger" id="btn-quit"><span>⏻</span> Exit to Main Menu</button>
        </div>
      </div>`;
    screen.querySelector('#btn-resume').addEventListener('click', () => this.app.resume());
    screen.querySelector('#btn-pause-settings').addEventListener('click', () => this.show('settings'));
    screen.querySelector('#btn-pause-layout').addEventListener('click', () => {
      this.app.hud.setEditingLayout(true);
      this._toast('Drag the controls into place, then press Done.');
      this.app.resume();
    });
    screen.querySelector('#btn-pause-restart').addEventListener('click', () => {
      const s = this.app.session;
      if (!s) return;
      if (s.mode === 'career') this.app.startCareer(s.mission.id);
      else this.app.startFreeDrive(this.freeOptions);
    });
    screen.querySelector('#btn-quit').addEventListener('click', () => this.app.exitToMenu());
  }

  _refreshPauseStats() {
    const node = document.getElementById('pause-stats');
    const s = this.app.session;
    if (!node || !s) return;
    node.innerHTML = `
      <div><span>Distance</span><strong>${s.distanceKm.toFixed(2)} km</strong></div>
      <div><span>Passengers</span><strong>${s.passengers.onboard}</strong></div>
      <div><span>Fares</span><strong>${money(s.passengers.totalFares)}</strong></div>
      <div><span>Collisions</span><strong>${s.collisions}</strong></div>
      <div><span>Fuel left</span><strong>${Math.round(s.bus.physics.fuel)} L</strong></div>
      <div><span>Damage</span><strong>${Math.round(s.bus.physics.damage * 100)}%</strong></div>`;
  }
}
