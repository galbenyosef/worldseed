// index-inline-2 125 — slots
// Lines 62432-62740 of readable/index-inline-2.pretty.js (statement-aligned).
  const tEsc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const $t = (id) => document.getElementById(id);
  // "12 sticks", "a copper knife", "a worn flint axe"
  const stackWords = (s) =>
    s.n > 1 ? `${s.n} ${lowerName(s.id, s.n)}` : itemName(s.id, 1, s.worn);
  const firstLine = (t) => {
    const m = /^[^.!?]*[.!?]/.exec(t || "");
    return m ? m[0] : t || "";
  };

  class TradeUI {
    constructor(hooks) {
      this.hooks = hooks; // { act(kind, arg), close() }
      this.sure = null; // the button that is asking "sure?"
      $t("tradeClose").addEventListener("click", () => this.hooks.close());
      $t("gTrade").addEventListener("click", (e) => {
        if (e.target === $t("gTrade")) this.hooks.close();
      });
      $t("gTrade").addEventListener("pointerdown", (e) => e.stopPropagation());
    }
    get open() {
      return !$t("gTrade").hidden;
    }
    // ctx: { mode: 'trade' | 'chest' | 'stall', title, sub, stock: [{ id, n, price }], chest: [slots], cap, house, stall, traffic }
    show(pack, ctx) {
      this.pack = pack;
      this.ctx = ctx;
      this.sure = null;
      this.log = ctx.log || "";
      $t("gTrade").hidden = false;
      this.render();
      $t("tradeClose").focus({ preventScroll: true });
    }
    hide() {
      $t("gTrade").hidden = true;
      this.sure = null;
    }
    say(msg) {
      this.log = msg;
      const el = $t("tradeLog");
      if (el) el.textContent = msg;
    }
    row(icon, name, small, buttons, smallCls = "") {
      return `<div class="popt"><div class="what"><img src="${icon}" alt=""><div><span>${tEsc(name)}</span>${small ? `<small${smallCls ? ` class="${smallCls}"` : ""}>${small}</small>` : ""}</div></div><span class="pacts">${buttons}</span></div>`;
    }
    btn(act, arg, label, opts = {}) {
      const key = act + ":" + arg,
        sure = this.sure === key;
      const dis = opts.off ? ' aria-disabled="true"' : "";
      return `<button type="button" class="btn mini${opts.primary || sure ? " primary" : ""}" data-tact="${act}" data-targ="${tEsc(arg)}"${opts.ask ? ' data-ask="1"' : ""}${dis}>${tEsc(sure ? "Sure? " + label : label)}</button>`;
    }
    render() {
      const pk = this.pack,
        c = this.ctx;
      if (!pk || !c) return;
      $t("tradeTitle").textContent = c.title || "";
      $t("tradeSub").textContent = c.sub || "";
      $t("tradePurse").innerHTML =
        `<img src="${itemIcon("purse")}" alt=""><span>${pk.coins ? tEsc(coinWords(pk.coins)) + " in your purse" : "Your purse is empty"}</span>`;
      let L = "",
        Rh = "";
      const full = pk.slots.length >= pk.size;
      if (c.mode === "trade") {
        $t("tradeLeftLabel").textContent = c.stockLabel || "For sale";
        for (let i = 0; i < c.stock.length; i++) {
          const o = c.stock[i],
            it = ITEMS[o.id];
          const room = pk.room(o.id) >= o.n;
          const poor = pk.coins < o.price;
          const why = !room
            ? "No room in your satchel"
            : poor
              ? `You need ${coinWords(o.price - pk.coins)} more`
              : tEsc(firstLine(it.desc));
          L += this.row(
            itemIcon(o.id),
            o.n > 1 ? `${o.n} ${lowerName(o.id, o.n)}` : itemName(o.id),
            why,
            this.btn("buy", i, `Buy · ${o.price}`, {
              off: !room || poor,
              primary: room && !poor,
            }),
            room && !poor ? "tdesc" : "",
          );
        }
        if (!c.stock.length)
          L = '<p class="phint">Nothing to sell you today.</p>';
        $t("tradeRightLabel").textContent = "Your satchel";
        for (let i = 0; i < pk.slots.length; i++) {
          const s = pk.slots[i];
          if (!sellable(s.id)) {
            Rh += this.row(
              itemIcon(s.id, !!s.worn),
              stackWords(s),
              ITEMS[s.id].kind === "quest"
                ? "Not yours to sell"
                : "Not for sale",
              "",
            );
            continue;
          }
          const sp = c.sell || sellPrice,
            one = sp(s, 1),
            all = sp(s, s.n);
          let b = "";
          if (one >= 1)
            b += this.btn(
              "sell",
              i,
              s.n > 1 ? `Sell one · ${one}` : `Sell · ${one}`,
              { ask: one >= 8 },
            );
          if (s.n > 1 && all >= 1)
            b += this.btn("sellall", i, `All · ${all}`, { ask: all >= 8 });
          Rh += this.row(
            itemIcon(s.id, !!s.worn),
            stackWords(s),
            all < 1
              ? "Not worth a coin"
              : s.n > 1 && one < 1
                ? "Only worth a coin by the lot"
                : "",
            b,
          );
        }
        if (!pk.slots.length)
          Rh = '<p class="phint">Nothing in your satchel.</p>';
        $t("tradeHouse").hidden = true;
      } else if (c.mode === "stall") {
        // your stall: what is out on it, what each lot asks, and how soon it is likely to go
        const st = c.stall,
          goods = st.goods;
        $t("tradeLeftLabel").textContent =
          `On your stall · ${goods.length} of ${c.cap}`;
        if (goods.length)
          L =
            '<p class="phint">Tap a price to ask more or less: cheap sells quickest, dear slowest.</p>';
        for (let i = 0; i < goods.length; i++) {
          const s = slotFrom(goods[i].s);
          if (!s) continue;
          const lv = goods[i].lv || "fair",
            price = lotPrice(s, lv);
          L += this.row(
            itemIcon(s.id, !!s.worn),
            stackWords(s),
            tEsc(
              `${LEVEL_WORD[lv]}: ${waitWords(saleRate(price, c.traffic, lv))}`,
            ),
            this.btn("price", i, `${price} · ${lv}`) +
              this.btn("unstock", i, "Take back"),
          );
        }
        if (!goods.length)
          L =
            '<p class="phint">Nothing out on it. Put out what you want sold: it goes for what it is worth, less a tenth for the keeper. A trader only gives half.</p>';
        $t("tradeRightLabel").textContent = "Your satchel";
        for (let i = 0; i < pk.slots.length; i++) {
          const s = pk.slots[i];
          if (!sellable(s.id)) {
            Rh += this.row(
              itemIcon(s.id, !!s.worn),
              stackWords(s),
              ITEMS[s.id].kind === "quest"
                ? "Not yours to sell"
                : "Not for sale",
              "",
            );
            continue;
          }
          Rh += this.row(
            itemIcon(s.id, !!s.worn),
            stackWords(s),
            `Worth about ${coinWords(lotPrice(s, "fair"))}`,
            this.btn("stock", i, "Put out", { off: goods.length >= c.cap }),
          );
        }
        if (!pk.slots.length)
          Rh = '<p class="phint">Nothing in your satchel.</p>';
        // what has sold, newest first
        const led = st.ledger.slice(-4).reverse(),
          sold = st.sold || 0;
        const head = sold
          ? `Sold so far: ${sold} lot${sold === 1 ? "" : "s"}, for ${coinWords(st.earned || 0)} after the keeper’s tenth.`
          : "Nothing sold yet.";
        const lines = led.map(
          (e) =>
            `${e.n > 1 ? `${e.n} ${lowerName(e.id, e.n)}` : itemName(e.id, 1, e.worn)} · ${coinWords(e.net)} · to ${e.who}`,
        );
        $t("tradeHouse").hidden = false;
        $t("tradeHouse").innerHTML =
          `<div class="prow tledger"><img src="${itemIcon("deedstall")}" alt=""><span>${tEsc(head)}${lines.length ? `<small>${lines.map(tEsc).join("<br>")}</small>` : ""}</span></div>`;
      } else {
        // your chest at home
        const ch = c.chest;
        $t("tradeLeftLabel").textContent =
          `In the chest · ${ch.length} of ${c.cap}`;
        for (let i = 0; i < ch.length; i++)
          L += this.row(
            itemIcon(ch[i].id, !!ch[i].worn),
            stackWords(ch[i]),
            "",
            this.btn("take", i, "Take", { off: full && pk.room(ch[i].id) < 1 }),
          );
        if (!ch.length)
          L =
            '<p class="phint">Empty. Whatever you put in here stays here, safe, until you come back for it.</p>';
        $t("tradeRightLabel").textContent =
          `Your satchel · ${pk.slots.length} of ${pk.size}`;
        for (let i = 0; i < pk.slots.length; i++) {
          const s = pk.slots[i],
            it = ITEMS[s.id];
          const canPut =
            ch.length < c.cap ||
            ch.some(
              (q) =>
                q.id === s.id &&
                q.wear == null &&
                !q.worn &&
                q.tag == null &&
                s.wear == null &&
                !s.worn &&
                s.tag == null &&
                q.n < it.stack,
            );
          Rh += this.row(
            itemIcon(s.id, !!s.worn),
            stackWords(s),
            it.kind === "quest" ? "Carried for someone else" : "",
            it.kind === "quest"
              ? ""
              : this.btn("put", i, "Put in", { off: !canPut }),
          );
        }
        if (!pk.slots.length)
          Rh = '<p class="phint">Nothing in your satchel.</p>';
        // the house itself
        const h = c.house;
        $t("tradeHouse").hidden = !h;
        if (h)
          $t("tradeHouse").innerHTML =
            `<div class="prow"><img src="${itemIcon(h.deedId)}" alt=""><span>${tEsc(h.words)}</span><span class="pacts">${this.btn("takedown", 0, "Take the house down", { ask: true })}</span></div>`;
      }
      $t("tradeLeft").innerHTML = L;
      $t("tradeRight").innerHTML = Rh;
      $t("tradeLog").textContent = this.log;
      this.wire();
    }
    wire() {
      $t("gTrade")
        .querySelectorAll("[data-tact]")
        .forEach((b) => {
          b.onclick = () => {
            if (b.getAttribute("aria-disabled") === "true") return;
            const act = b.dataset.tact,
              arg = b.dataset.targ,
              key = act + ":" + arg;
            // something worth a fair bit: ask once more
            if (b.dataset.ask && this.sure !== key) {
              this.sure = key;
              this.render();
              return;
            }
            this.sure = null;
            this.hooks.act(act, +arg);
          };
        });
    }
  }

  // ---- ui/sound.js ----
  // ============================================================
  // SOUND — little blips and bleeps, the way a handheld made them: pulse
  // waves at its three widths (thin, narrow, square) and a hiss of noise,
  // shaped by a quick rise and fall. No sound files: every sound is made on
  // the spot from a few numbers. Text that types out ticks as it goes, each
  // voice at its own pitch; picking things up chirps, coin rings, a blow
  // thuds, good news gets a little tune and danger a low warning.
  // Browsers only let a page make sound once you have clicked or pressed
  // something, so it wakes on the first touch. Off and on with M, or from
  // the menu; the choice is remembered.
  // ============================================================

  const SND_KEY = "worldseed.sound";
  // equal temperament from A4: n semitones up (or down)
  const semi = (f, n) => f * Math.pow(2, n / 12);
  const NOTE = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    A5: 880.0,
    B5: 987.77,
    C6: 1046.5,
    E6: 1318.5,
    G6: 1568.0,
  };

