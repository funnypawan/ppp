# Game design

## 1. Core loop

```
choose a bus → pick a map → drive → pick up passengers → drop them off →
earn fares and mission rewards → unlock buses, maps and customisation → repeat
```

Every system feeds the loop: passengers pay, missions pay more, safe driving
pays best (time bonus and a no-collision bonus), damage and speeding cost
money, and the daily reward ladder keeps a returning player coming back.

## 2. The eight buses

| Bus | Body | Mass | Seats | Character |
| --- | --- | --- | --- | --- |
| Sarathi City Bus | city | 9 200 kg | 40 + 18 standing | Workhorse: slow to rev, strong brakes, tight turning |
| Rathore Luxury Coach | coach | 12 000 kg | 49 | Smooth, fast, heavier steering |
| Rajdhani Sleeper | sleeper | 11 500 kg | 36 berths | Sleeper layout, long-haul gearing |
| Yatra Tourist | tourist | 10 400 kg | 45 | Tour bus, balanced |
| Vidyalaya School Bus | school | 7 800 kg | 36 | Light, quick off the line, yellow livery |
| Chhota Mini | mini | 5 600 kg | 26 | Tiny, nimble, ideal for village lanes |
| Double Decker | double | 15 500 kg | 90 | Heavy, slow to accelerate, upper deck |
| Meridian Volvo-inspired | volvo | 13 200 kg | 55 | Fastest top speed, long wheelbase |

Every bus differs in mass, wheelbase, tyre radius, peak torque, gear ratios,
final drive, brake torque, retarder, steering lock and seating layout, so the
handling is genuinely different, not cosmetic.

## 3. The seven maps

| Map | Layout | Traffic | Weather / time | Highlights |
| --- | --- | --- | --- | --- |
| Indian City | concentric ring roads + radial spokes | 70 % | clear, 09:30 | Ring road, bazaar lanes, flyovers, petrol pumps, bus depot |
| Indian Village | loop around a centre + field tracks | 30 % | clear, 07:30 | Paddy green ground, mud lanes, banyan trees |
| National Highway | 26 node expressway + service roads | 85 % | clear, 12:00 | Bridge, toll plaza, truck stops, 6 lanes |
| Mountain Roads | switchback climb to a plateau | 25 % | fog, 08:00 | Hairpins, rock faces, river gorge, hill station |
| Desert Roads | long straights with bends | 20 % | clear, 15:00 | Dunes, chai dhaba, heat haze, fuel scarcity |
| Rainy City | city layout, wet palette | 80 % | heavy rain, 16:00 | Rain particles, spray, low grip, glowing signals |
| Night Highway | highway layout, dark palette | 45 % | clear, 01:30 | Headlights, sodium lamps, star field, reflective studs |

## 4. Career mode

Ten missions spread over nine categories:

| Category | Missions |
| --- | --- |
| City driving | *First Shift*, *Bazaar Traffic* |
| Village driving | *Village Circuit* |
| Highway driving | *Express Run* |
| Long distance | *Overnight Haul* |
| Mountain | *Hill Station Climb* |
| Night | *Midnight Service* |
| Rain | *Monsoon Routes* |
| Passenger transport | *Standing Room* |
| Parking | *Depot Bay* |

Each mission defines the map, the bus, a time limit, a reward and a list of
objectives (deliver N passengers, cover N km, never exceed a speed limit,
finish without a collision, keep satisfaction above a threshold, park in the
bay). The tracker pays the base reward plus a time bonus plus a 20 % clean
driving bonus.

## 5. Economy

| Item | Value |
| --- | --- |
| Passenger fare | `₹5 + ₹12/km`, multiplied by the satisfaction factor (0.8 - 1.2) |
| Running cost | `₹3.5/km` maintenance + diesel at `₹92/l` |
| Speeding fine | ₹100 / ₹250 / ₹500 / ₹1000 depending on the excess |
| Signal violation | ₹500 |
| Collision | `₹250 + ₹1500` per damage point |
| Daily reward | ₹500 → ₹5 000 over a seven day streak |

Unlocks: buses from ₹180 000 to ₹1 200 000, maps from ₹25 000 to ₹200 000.
Money is earned from fares, mission rewards, the daily ladder and the clean
driving bonus.

## 6. Controls

**Touch (default layout)**

| Control | Position | Action |
| --- | --- | --- |
| Accelerator | bottom right | throttle |
| Brake | left of the accelerator | service brake |
| Steering | bottom left | steer left / right |
| Horn, headlights, indicator | above the steering buttons | horn, lights, blinking indicator |
| Door | above the steering buttons | open/close the plug doors |
| Camera | next to the door button | cycle the six cameras |
| D/N, REV, handbrake | above the pedals | gear selector, reverse, handbrake |

**Keyboard (desktop testing)**

`W`/`↑` throttle · `S`/`↓` brake · `A`/`D` steer · `Space` handbrake ·
`Q`/`E` reverse/drive · `H` horn · `L` headlights · `C` camera · `O` doors ·
`Z`/`X` indicators.

## 7. Cameras

| Mode | Description |
| --- | --- |
| Chase | Behind and above the bus, leans into corners, FOV widens with speed |
| Close | Tight chase for city driving |
| Interior | Driver's eye view behind the steering wheel |
| Top down | 42 m above the bus, useful for parking |
| Bonnet | On the bonnet looking forward |
| Cinematic | Slow orbit around the bus |

All transitions are exponentially smoothed, and the sensitivity setting scales
the look-around rate.

## 8. Weather and time of day

Six weather presets (sunny, cloudy, light rain, heavy rain, fog, snow) change
the grip multiplier (1.00 → 0.55), the fog density, the sky colour and the
precipitation. The day/night cycle moves the sun, the ambient light, the
street lamp glow and the headlights (which switch on automatically at dusk).
