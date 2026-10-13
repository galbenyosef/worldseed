// index-inline-2 165 — state
// Lines 74846-74977 of readable/index-inline-2.pretty.js (statement-aligned).
  window.worldseed = {
    Planet,
    renderer,
    state,
    planet: null,
    story: null,
    get ground() {
      return ground;
    },
    G,
    landOn,
    leaveGround,
    lookFor: (people, name) => lookFromName(people, name, null),
    taleFor: (s) => taleFor(state.story, ground.siteIx, s),
    cavePlan,
    needs: {
      questsOf,
      questPlace,
      wayToTown,
      portFor,
      farByRoad,
      farBySea,
      farMenu,
      goFar,
      setOff,
      hireMount,
      beginVigil,
      endVigil,
      payQuest,
      needsHtml,
      showPaper,
      relicQuestIn,
      talk,
      useCave,
      lifeData,
    },
    rp: {
      askName,
      repGain,
      standingK,
      townNear,
      openTrade,
      tradeAct,
      standingHtml,
      helloFor,
      questDone,
      die,
    },
    sfx,
    fx,
    swingLook,
    magic: {
      fluteOpen,
      fluteClose,
      fluteNote,
      castSong,
      songTakes,
      giveBless,
      endBless,
      blessNow,
      blessed,
      hermitTalk,
      heartSpot,
      renderBless,
    },
    frame: (dt, ts, skip) => {
      if (G.on && ground && !G.glimpse) groundFrame(dt, ts, skip);
    },
    moonsAt,
    weatherAt,
    days: {
      townDay: (s, d) => townDay(state.story, s, d),
      dayUse,
      dayFolkTalk,
      dayTitle: (s, ev) => dayTitle(state.story, s, ev),
    },
    begin: { beginningFor, beginInfo, roofTalk },
    townPlan: (s) => townPlan(state.story, s),
    sitePlan: (s) => sitePlan(state.story, s),
    MeshBuf,
    farm: {
      setUpGrow,
      setUpYard,
      useField,
      useTrough,
      useCoop,
      useBeast,
      fieldVerb,
      troughVerb,
      coopVerb,
      beastVerb,
      buyBeast,
      farmCheck,
      wrightTalk,
      packAct,
    },
    yard: {
      rideOut,
      raidCheck,
      drawWater,
      useHives,
      hivesVerb,
      currentTarget,
      targetVerb,
    },
    work: {
      setUpWork,
      openPack,
      closePack,
      siteVerb,
      useSite,
      buyDeed,
      homeIsRound,
      takeDownHome,
      packUI: () => packUI,
      roundOwner: () =>
        (state.story.peoples || []).findIndex(
          (pp) => peopleStyle(state.story, pp).round >= 0.5,
        ),
      squareOwner: () =>
        (state.story.peoples || []).findIndex(
          (pp) => peopleStyle(state.story, pp).round < 0.5,
        ),
    },
  };
  layout();
  requestAnimationFrame(tick);
  // the world named in the link; else the one your life is on; else a good one to start on, a new one each time
  {
    const sv0 = readSave();
    travelTo(hashToSeed() || (sv0 && sv0.seed) || firstWorld(), true);
  }
