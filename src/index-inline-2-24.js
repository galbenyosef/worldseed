// index-inline-2 24 — arc
// Lines 8152-8222 of readable/index-inline-2.pretty.js (statement-aligned).
  const CITY_STATES = ["thriving", "halfempty", "building", "fallen"];
  function buildCity(
    rng,
    arc,
    peoples,
    settlements,
    planet,
    old,
    key,
    force = null,
  ) {
    const w = { thriving: 0.32, halfempty: 0.2, building: 0.26, fallen: 0.22 };
    const lean =
      {
        dragon: { fallen: 0.6 },
        haunted: { fallen: 0.55 },
        blight: { halfempty: 0.5 },
        siege: { thriving: 1.5 },
        dawn: { building: 0.45 },
        sundered: { halfempty: 0.3, fallen: 0.25 },
        fading: { halfempty: 0.3, building: 0.2 },
        sleeper: { thriving: 0.2 },
      }[arc.kind] || {};
    for (const [k, v] of Object.entries(lean)) w[k] += v;
    let x = rng.float() * Object.values(w).reduce((a, b) => a + b, 0),
      state = "thriving";
    for (const k of CITY_STATES) {
      x -= w[k];
      if (x <= 0) {
        state = k;
        break;
      }
    }
    if (force && CITY_STATES.includes(force)) state = force;
    if (state !== "fallen") {
      // the besieged capital; else the capital of the people with the most towns
      let s =
        arc.kind === "siege" &&
        arc.where &&
        arc.where.id != null &&
        settlements[arc.where.id] === arc.where
          ? arc.where
          : null;
      if (!s) {
        const size = (o) => settlements.filter((t) => t.owner === o).length;
        s =
          settlements
            .filter((t) => t.type === "capital")
            .sort(
              (a, b) => size(b.owner) - size(a.owner) || b.score - a.score,
            )[0] || null;
      }
      if (s) {
        s.great = state;
        return { state, town: s.id, name: s.name, people: s.owner };
      }
      state = "fallen";
    }
    // fallen: the old capital the dragon burned keeps the name it had; else one in the old tongue
    const name =
      arc.kind === "dragon"
        ? old.nameFor(planet.seedKey + "/oldcity", 2, 2)
        : old.nameFor(key + "/greatcity", 2, 3);
    const near =
      (arc.kind === "dragon" || arc.kind === "haunted") &&
      arc.lair &&
      arc.lair.dir
        ? arc.lair.dir
        : null;
    return { state: "fallen", name, near, people: -1, dir: null };
  }
