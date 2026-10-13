// index-inline-2 31 — arch
// Lines 10162-10238 of readable/index-inline-2.pretty.js (statement-aligned).
  function styleFor(people, rng) {
    const arch = people ? people.arch : "isle";
    const T = TRADITION[arch] || TRADITION.isle;
    const wallKind = rng.pick(T.walls);
    const roofKind = rng.pick(T.roofs);
    const roofMat =
      roofKind === "dome"
        ? "dome"
        : roofKind === "flat"
          ? arch === "ash"
            ? "ember"
            : "turf"
          : arch === "canopy" || arch === "grass"
            ? wallKind === "hide"
              ? "hide"
              : "thatch"
            : arch === "stone"
              ? rng.pick(["slate", "slate", "tile"])
              : arch === "frost"
                ? rng.pick(["turf", "shingle", "shingle"])
                : arch === "ash"
                  ? "ember"
                  : arch === "isle"
                    ? rng.pick(["tile", "thatch"])
                    : rng.pick(["thatch", "tile", "shingle", "slate"]);
    const pick = (arr) => arr[rng.int(0, arr.length - 1)];
    return {
      arch,
      wallKind,
      roofKind,
      roofMat,
      wall: pick(WALLS[wallKind]),
      roof: pick(ROOFS[roofMat]),
      wood: pick(WOODS),
      upperWall: wallKind === "frame" ? pick(WALLS.frame) : null,
      base:
        wallKind === "basalt" || wallKind === "darkstone"
          ? [70, 64, 72]
          : [120, 114, 120],
      upper: T.upper,
      stilts: T.stilts,
      floors: T.floors,
      pitch: T.pitch * (0.85 + rng.float() * 0.3),
      overhang: T.overhang,
      round: T.round,
      chimney: T.chimney || 0,
      smoke: !!T.smoke,
      storeyH: 2.7 + rng.float() * 0.5,
    };
  }

  // every people builds the same way everywhere; cache it on the story
  function peopleStyle(story, people) {
    story._styles = story._styles || new Map();
    const key = people ? people.id : -1;
    if (!story._styles.has(key))
      story._styles.set(
        key,
        styleFor(people, new Rng(hashInt(key + 11, 4099, story.seedHash || 1))),
      );
    return story._styles.get(key);
  }

  const TOWN_SIZE = {
    capital: 30,
    town: 18,
    port: 14,
    village: 9,
    monastery: 5,
    outpost: 4,
  };

  // whose names a town's people have: their people's, or (in a free town that belongs to nobody) the old tongue's
  const NO_LANG = { person: () => "Aru" };
  const townLang = (story, people) =>
    (people && people.lang) || story.old || NO_LANG;
  // lay a town out in metres around its centre (x east, z south)
