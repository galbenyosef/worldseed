// index-inline-2 120 — plan
// Lines 61060-61101 of readable/index-inline-2.pretty.js (statement-aligned).
  const HORSE = {
    h: 1.6,
    len: 1.75,
    leg: 0.6,
    neck: 0.55,
    head: 0.42,
    horns: "none",
    run: 12,
    earsUp: true,
    neckW: 1.2,
  };
  const COATS = [
    { col: [116, 78, 50], belly: [138, 98, 68], mane: [44, 32, 26] },
    { col: [152, 88, 50], belly: [176, 118, 80], mane: [120, 64, 36] },
    { col: [150, 146, 140], belly: [182, 178, 172], mane: [92, 88, 86] },
    { col: [54, 48, 46], belly: [72, 64, 60], mane: [30, 26, 26] },
    { col: [178, 150, 104], belly: [204, 182, 140], mane: [70, 54, 40] },
  ];
  const RIDDEN = /tallback|shell|strider|white elk|horned goat|goats? as big/;

  // what the people of a place ride, and how far it carries you in a day
  function mountFor(people, seed = 1) {
    const beast =
      people && people.beast ? String(people.beast).toLowerCase() : "";
    const rnd = mulberry32((seed ^ 0x40e5) >>> 0);
    let name = "horse",
      plan;
    if (RIDDEN.test(beast)) {
      const g = grazerFor(beast, null);
      if (g) {
        name = g.name.replace(/oxen$/, "ox").replace(/s$/, "");
        plan = { ...g.plan, saddle: true };
      }
    }
    if (!plan) {
      const c = COATS[Math.floor(rnd() * COATS.length)];
      plan = { ...HORSE, ...c, horn: [40, 32, 28], saddle: true };
    }
    const kmDay = Math.round(40 + plan.run * 3);
    return { name, plan, kmDay, seed };
  }

