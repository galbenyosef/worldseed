// derive.mjs — rebuild the derived layers (readable/ + src/ + split-spec.json)
// from the WORLDSEED capture (PLAN §3/§5). The game is the itch.io HTML5 embed
// served from html-classic.itch.zone/html/19693588/ — a SINGLE self-contained
// HTML file (index.html, 1,970,079 B) whose whole game is inline: one big
// inline classic <script> (an IIFE that concatenates the author's ~71 source
// modules, each introduced by a `// ---- world/x.js ----` banner), one tiny
// inline module <script> (the three.js bootstrap import), and two inline
// <style> blocks. Capture-class; §0.4 fork-over-mirror was checked on
// 2026-10-13 — no public upstream repo exists (the itch page carries no repo
// link; a GitHub search finds nothing for the game or the author slug
// Generic-King), so the mirror stands.
//
// Pipeline:
//   inline <script> blocks  -> pinned prettier 3.9.6 (module API — the CLI
//                              respects .gitignore and can silently echo its
//                              input), rendered to fixpoint (format until the
//                              output stops changing, max 5 passes)
//                              -> readable/index-inline-N.pretty.js
//   inline <style> blocks   -> same method, css parser
//                              -> readable/index-inline-N.pretty.css
//   the classic script      -> statement-aligned slices of the IIFE body:
//                              parse the pretty, descend through the single
//                              `(() => { … })();` wrapper, cut only on
//                              top-level declaration boundaries in ~250-350
//                              line windows (oversized single declarations
//                              stay whole): src/index-inline-2-NN.js with the
//                              exact 2-line provenance header; the wrapper
//                              head (lines 1..first statement) is a wholeFile
//                              section and the `})();` closer a skipped
//                              section — both indexed, never sliced
//   the module script       -> one slice over its statements (plus its head
//                              comment as a wholeFile section)
//   every slice             -> parse-checked with
//                              `node --input-type=module --check -` and
//                              round-trips byte-exact to its readable range
//
// No vendor bytes are captured or derived: three.js is an EXTERNAL CDN import
// (https://cdnjs.cloudflare.com/ajax/libs/three.js/0.186.1/three.module.min.js)
// and the Google Fonts stylesheet is an external CDN link — per the fleet rule
// CDN dependencies stay CDN (socker precedent), recorded in split-spec.json
// notRendered and in README.md; the game degrades gracefully without either.
//
// usage: node tools/derive.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
// ── --check: prove the committed derived layer is current, writing NOTHING ─
// This tool used to ignore its command line entirely, so `node tools/derive.mjs
// --check` was a full in-place re-derivation: it rewrote readable/ + src/ +
// split-spec.json and (on a mirror whose derive does not re-apply the recorded
// rename map) stripped the rename layer off src/ -- damage that looks
// legitimate, because the files still parse. --check now runs the mirror's
// documented rebuild chain in a throwaway scratch copy OUTSIDE the mirror and
// compares the result with the committed tree; it writes nothing here.
if (process.argv.includes("--check")) {
  const { runDeriveCheck } = await import("./derive-check.mjs");
  process.exit(await runDeriveCheck());
}

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const PINNED = "3.9.6";
const MIN_WINDOW = 250;
const MAX_WINDOW = 350;
const TODAY = "2026-10-13";
const ROOT = ""; // capture sits at the repo root (the embed directory root)

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const readLines = (abs) => {
  const t = fs.readFileSync(abs, "utf8");
  const l = t.split("\n");
  if (l.length && l[l.length - 1] === "") l.pop();
  return l;
};
const linesOf = (text) => text.replace(/\n$/, "").split("\n");
const lineOf = (text, offset) => text.slice(0, offset).split("\n").length;

// ── pinned prettier (module API, exactly 3.9.6) ─────────────────────────
async function loadPrettier() {
  const candidates = [
    process.env.PRETTIER_MJS,
    path.join(proj, "node_modules", "prettier", "index.mjs"),
    "D:/repos/mirrors/metropolygonia/node_modules/prettier/index.mjs",
  ].filter(Boolean);
  for (const c of candidates) {
    if (!fs.existsSync(c)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(c), "package.json"), "utf8"));
      if (pkg.version !== PINNED) continue;
      const mod = (await import(pathToFileURL(c).href)).default;
      if (mod.version === PINNED) return { mod, at: c };
    } catch {
      /* try next */
    }
  }
  throw new Error(`pinned prettier ${PINNED} not found (set PRETTIER_MJS to its index.mjs)`);
}

// Render to fixpoint: format until the output stops changing (max 5 passes).
async function formatFixpoint(prettier, text, parser) {
  let cur = text;
  for (let pass = 1; pass <= 5; pass++) {
    const next = await prettier.format(cur, { parser });
    if (next === cur) return { out: next, passes: pass };
    cur = next;
  }
  throw new Error(`prettier ${parser} did not reach a fixpoint in 5 passes`);
}

// ── parse check: the exact standalone gate (ESM stdin) ──────────────────
function parses(text) {
  const r = spawnSync(process.execPath, ["--input-type=module", "--check", "-"], {
    input: text,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: r.status === 0, why: (r.stderr || "").trim().split("\n").slice(-3).join(" | ") };
}

// ── markers for titles (top tokens, lowercase; fleet convention) ────────
const STOP = new Set(
  ("function return typeof undefined object string number boolean prototype length value default " +
    "exports import this that with from then else case break continue delete instanceof constructor " +
    "arguments void null true false call apply name type text target window document globalthis self " +
    "require module async await yield static class const let var new for while switch throw try catch " +
    "finally extends super using debugger of in do if has own hasown get set")
    .split(" ")
    .filter(Boolean),
);
function markers(text, n = 2) {
  // URLs/identifiers living inside string literals are not code tokens — strip
  // quoted strings and comments before counting
  const code = text.replace(/`[^`]*`|"[^"\n]*"|'[^'\n]*'/g, " ").replace(/\/\/[^\n]*/g, " ");
  const counts = new Map();
  for (const m of code.matchAll(/[A-Za-z][A-Za-z0-9_]{2,}/g)) {
    const w = m[0].toLowerCase();
    if (STOP.has(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}
const markerText = (ms) => ms.map(([w, c]) => `${w}(${c})`).join(", ");

// ── windowize: cut only at statement starts; ≤350 lines, a single ───────
// ── oversized declaration is a window of its own ────────────────────────
function windowize(stmts) {
  const out = [];
  let cur = null;
  for (const s of stmts) {
    if (!cur) {
      cur = { first: s, last: s, count: 1, startLine: s.startLine, endLine: s.endLine };
      continue;
    }
    const projected = s.endLine - cur.startLine + 1;
    if (projected > MAX_WINDOW) {
      out.push(cur);
      cur = { first: s, last: s, count: 1, startLine: s.startLine, endLine: s.endLine };
    } else {
      cur.last = s;
      cur.count++;
      cur.endLine = s.endLine;
    }
  }
  if (cur) out.push(cur);
  return out;
}

// ── inline block scan (byte-exact, over the raw entry buffer) ───────────
function scanBlocks(buf) {
  const blocks = [];
  for (const [open, close, kind] of [
    ["<script", "</script", "script"],
    ["<style", "</style", "style"],
  ]) {
    let p = 0;
    let n = 0;
    while (true) {
      const i = buf.indexOf(open, p);
      if (i < 0) break;
      const after = buf[i + open.length];
      const boundary =
        after === 0x3e || after === 0x2f || after === 0x20 || after === 0x09 || after === 0x0a || after === 0x0d;
      if (!boundary) {
        p = i + open.length;
        continue;
      }
      const tagEnd = buf.indexOf(">", i);
      if (tagEnd < 0) break;
      const j = buf.indexOf(close, tagEnd + 1);
      if (j < 0) throw new Error(`unterminated <${kind}> opened at byte ${i}`);
      const tag = buf.subarray(i, tagEnd + 1).toString("utf8");
      const external = /\bsrc\s*=\s*["']/i.test(tag);
      if (external) {
        blocks.push({ kind, external: true, tag, openStart: i, contentStart: tagEnd + 1, contentEnd: j });
      } else {
        n++;
        const content = buf.subarray(tagEnd + 1, j);
        blocks.push({
          kind: /\btype\s*=\s*["']importmap["']/i.test(tag) ? "importmap" : kind,
          external: false,
          block: n,
          tag,
          openStart: i,
          contentStart: tagEnd + 1,
          contentEnd: j,
          bytes: content.length,
          sha256: sha256(content),
          text: content.toString("utf8"),
        });
      }
      p = j + close.length;
    }
  }
  return blocks.sort((a, b) => a.openStart - b.openStart);
}

// ── the external CDN dependencies (recorded, never captured) ────────────
const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.186.1/three.module.min.js";
const ITCH_HARNESS = "https://static.itch.io/htmlgame.js";

// ── content-anchored guards ─────────────────────────────────────────────
// classic script (inline script #2): the IIFE whose body is the whole game
const IIFE_HEAD_GUARD = (t) => /\(\(\) => \{/.test(t) && /"use strict";/.test(t) && /world\/rng\.js/.test(t);
const IIFE_CLOSER_GUARD = (t) => t.trim() === "})();";
const FIRST_STMT_GUARD = (t) => /function hashStr/.test(t);
const LAST_STMT_GUARD = (t) => /travelTo\(hashToSeed\(\)/.test(t) && /readSave\(\)/.test(t);
const CLASSIC_MIN_STMTS = 1000;
// module script (inline script #1): the three.js bootstrap
const MODULE_HEAD_GUARD = (t) => /three\.js drives the first-person view/.test(t);
const MODULE_IMPORT_GUARD = (t) => t.includes(THREE_URL) && /^import\s+\*\s+as\s+THREE/.test(t.trim());
// styles
const STYLE1_GUARD = (t) => /color-scheme: light/.test(t) && /safe-area-inset-top/.test(t);
const STYLE2_GUARD = (t) => /--space: #07061a/.test(t) && /Silkscreen/.test(t);

async function main() {
  const { mod: prettier, at } = await loadPrettier();
  console.log(`pinned prettier ${PINNED} (${at})`);

  const manifest = JSON.parse(fs.readFileSync(path.join(proj, ".upstream", "manifest.json"), "utf8"));
  const captured = Object.keys(manifest.files).map((r) => r.split(path.sep).join("/")).sort();
  const captureBytes = (rel) => {
    const abs = path.join(proj, rel);
    if (!fs.existsSync(abs)) throw new Error(`capture file missing: ${rel}`);
    const buf = fs.readFileSync(abs);
    if (sha256(buf) !== manifest.files[rel].sha256)
      throw new Error(`${rel} on disk does not match .upstream/manifest.json — re-verify the capture first`);
    return buf;
  };

  const readableDir = path.join(proj, "readable");
  const srcDir = path.join(proj, "src");
  fs.mkdirSync(readableDir, { recursive: true });
  fs.mkdirSync(srcDir, { recursive: true });
  const written = { readable: new Set(), src: new Set() };

  const sources = [];
  const sections = [];
  const notRendered = [];
  const inlineFiles = [];
  let slicedTotal = 0;
  let skippedTotal = 0;
  let wholeTotal = 0;

  const htmlRels = captured.filter((r) => /\.html$/i.test(r));

  // ── 1) inline <script>/<style> blocks: twins, slices, wholeFile ─────────
  const inlineMap = {
    note:
      "Content blocks of every inline <script>/<style> in the captured HTML documents. byteStart/byteEnd are content offsets (tags excluded, end exclusive) into the source document; sha256 is over those exact bytes. Blocks that are real JS/CSS were rendered to a readable twin with pinned prettier 3.9.6 (module API, rendered to fixpoint); script twins are further sliced into src/, style twins are wholeFile. External references (script src=, link rel=stylesheet) are not blocks — they are recorded in split-spec.json notRendered and left external by design.",
    sources: [],
  };

  for (const rel of htmlRels) {
    const buf = captureBytes(rel);
    const blocks = scanBlocks(buf);
    const inline = blocks.filter((b) => !b.external);
    const external = blocks.filter((b) => b.external);
    inlineFiles.push(rel);
    for (const b of external)
      console.log(`derive: ${rel}: external ${b.kind} (not captured/derived): ${b.tag.slice(0, 90)}`);
    // external <link> references (fonts CSS etc.) — recorded, never captured
    for (const m of buf.toString("utf8").matchAll(/<link\b[^>]*>/gi)) {
      const tag = m[0];
      const href = /\bhref\s*=\s*["']([^"']+)["']/.exec(tag)?.[1] ?? "";
      const relAttr = /\brel\s*=\s*["']?([^"'\s>]+)/.exec(tag)?.[1] ?? "";
      if (!href || !/^https?:/i.test(href)) continue;
      notRendered.push({
        capture: rel,
        kind: relAttr === "stylesheet" ? "external-stylesheet" : `external-link(${relAttr || "?"})`,
        url: href,
        rendered: false,
        reason:
          relAttr === "stylesheet"
            ? "external CDN stylesheet (Google Fonts) — a CDN dependency that stays CDN (fleet rule; socker precedent 2026-10-10); the game falls back to system fonts without it, so it is not backfilled into the capture"
            : "external preconnect hint — a connection warm-up, not content; not captured",
      });
      console.log(`derive: ${rel}: external link rel=${relAttr || "?"} (not captured): ${href.slice(0, 110)}`);
    }
    const entryRec = {
      source: rel,
      sourceBytes: buf.length,
      sourceSha256: manifest.files[rel].sha256,
      scripts: inline.filter((b) => b.kind === "script").length,
      styles: inline.filter((b) => b.kind === "style").length,
      dataBlocks: 0,
      blocks: [],
    };
    if (!inline.length) {
      console.log(`derive: ${rel}: no inline <script>/<style> content blocks — no inline twins`);
    } else {
      const entryTag = rel.replace(/\.html$/i, "").split("/").join("__");
      for (const b of inline) {
        const isImportmap = b.kind === "importmap";
        const DATA_TYPES = new Set(["application/ld+json", "application/json", "importmap", "speculationrules"]);
        const type = (/\btype\s*=\s*["']?([^"'\s>]+)/i.exec(b.tag)?.[1] ?? "").toLowerCase();
        if (b.kind === "script" && DATA_TYPES.has(type)) {
          entryRec.dataBlocks++;
          notRendered.push({
            capture: rel,
            kind: "inline-data",
            type,
            byteStart: b.contentStart,
            byteEnd: b.contentEnd,
            bytes: b.bytes,
            sha256: b.sha256,
            rendered: false,
            reason: `typed data block (<script type="${type}">) — data, not JS/CSS; recorded with range + sha256, no pretty pass`,
          });
          continue;
        }
        const tag = `${entryTag}-inline-${b.block}`;
        const twinExt = isImportmap ? "json" : b.kind === "style" ? "css" : "js";
        const parser = isImportmap ? "json" : b.kind === "style" ? "css" : "babel";
        const prettyFile = `${tag}.pretty.${twinExt}`;
        const { out: pretty, passes: prettyPasses } = await formatFixpoint(prettier, b.text, parser);
        if (pretty === b.text)
          throw new Error(`readable/${prettyFile} would be byte-identical to its capture source`);
        fs.writeFileSync(readableDir ? path.join(readableDir, prettyFile) : prettyFile, pretty);
        written.readable.add(prettyFile);
        const lines = linesOf(pretty);
        const prettyBuf = Buffer.from(pretty, "utf8");
        const sourceFile = `readable/${prettyFile}`;
        entryRec.blocks.push({
          kind: b.kind === "style" ? "style" : "code",
          tagOpen: b.tag.split(">")[0] + ">",
          byteStart: b.contentStart,
          byteEnd: b.contentEnd,
          bytes: b.bytes,
          sha256: b.sha256,
          file: sourceFile,
          parsedAs: parser,
          prettyPasses,
          prettyLines: lines.length,
          prettyBytes: prettyBuf.length,
          prettySha256: sha256(prettyBuf),
          note: `${lines.length} lines prettified from ${b.bytes} B of inline ${b.kind} #${b.block} (capture bytes ${b.contentStart}-${b.contentEnd} of ${rel})`,
        });

        if (b.kind === "style") {
          // stylesheet rule: wholeFile, never sliced
          if (b.block === 1 && !STYLE1_GUARD(pretty)) throw new Error(`${sourceFile}: style guard failed — readable changed shape`);
          if (b.block === 2 && !STYLE2_GUARD(pretty)) throw new Error(`${sourceFile}: style guard failed — readable changed shape`);
          wholeTotal++;
          sections.push({
            file: `${tag}.${twinExt}`,
            wholeFile: true,
            title: `${tag} — inline <style> block (whole-file, never sliced)`,
            desc: `Lines 1-${lines.length} of ${sourceFile}. Whole-file (stylesheet rule): the entry document's inline <style> #${b.block} (${b.bytes} B at bytes ${b.contentStart}-${b.contentEnd} of ${rel}) is indexed whole in readable/, never sliced.`,
            note: "whole-file (stylesheet, not sliced): CSS is indexed whole in readable/",
            startLine: 1,
            endLine: lines.length,
            sourceFile,
          });
          sources.push({
            sourceFile,
            capture: rel,
            captureKind: `inline-${b.kind}`,
            captureByteStart: b.contentStart,
            captureByteEnd: b.contentEnd,
            captureSha256: b.sha256,
            captureBytes: b.bytes,
            prettyLines: lines.length,
            prettyBytes: prettyBuf.length,
            prettySha256: sha256(prettyBuf),
            prettyPasses,
            fixpoint: true,
            tag,
            slices: 0,
            derived: "readable only (stylesheet, wholeFile)",
          });
          console.log(`derive: ${rel} inline ${b.kind} #${b.block} -> ${sourceFile} (${lines.length} lines, wholeFile stylesheet)`);
          continue;
        }

        // ── inline script: statement-aligned slicing ─────────────────────
        const dbg = await prettier.__debug.parse(pretty, { parser: "babel" });
        let rootBody = (dbg.ast.program || dbg.ast).body;
        let wrapper = null;
        if (rootBody.length === 1 && rootBody[0].type === "ExpressionStatement") {
          const e = rootBody[0].expression;
          if (
            e &&
            e.type === "CallExpression" &&
            e.callee &&
            e.callee.type === "ArrowFunctionExpression" &&
            e.callee.body &&
            e.callee.body.type === "BlockStatement"
          ) {
            wrapper = "IIFE";
            rootBody = e.callee.body.body;
          }
        }
        const stmts = rootBody.map((n) => ({
          node: n,
          startLine: lineOf(pretty, n.start),
          endLine: lineOf(pretty, n.end),
          text: pretty.slice(n.start, n.end),
        }));
        if (!stmts.length) throw new Error(`${sourceFile}: no sliceable statements`);
        for (let i = 1; i < stmts.length; i++)
          if (stmts[i].startLine <= stmts[i - 1].endLine)
            throw new Error(`${sourceFile}: statements ${i - 1}/${i} share a line — cannot slice at line boundaries`);

        const isClassic = tag === `${entryTag}-inline-2`;
        const isModule = tag === `${entryTag}-inline-1`;
        if (isClassic) {
          if (wrapper !== "IIFE") throw new Error(`${sourceFile}: expected the single-IIFE wrapper for the classic script`);
          if (stmts.length < CLASSIC_MIN_STMTS)
            throw new Error(`${sourceFile}: only ${stmts.length} statements — the IIFE body did not parse as expected`);
          if (!FIRST_STMT_GUARD(stmts[0].text))
            throw new Error(`${sourceFile}: first statement is not hashStr (world/rng.js)`);
          if (!LAST_STMT_GUARD(stmts[stmts.length - 1].text))
            throw new Error(`${sourceFile}: last statement is not the startup block (readSave/travelTo)`);
        }
        if (isModule && !MODULE_IMPORT_GUARD(stmts[0].text))
          throw new Error(`${sourceFile}: first statement is not the three.js bootstrap import`);

        const specials = [];
        const lastStmt = stmts[stmts.length - 1];
        if (stmts[0].startLine > 1) {
          const headText = lines.slice(0, stmts[0].startLine - 1).join("\n");
          if (isClassic && !IIFE_HEAD_GUARD(headText))
            throw new Error(`${sourceFile}: IIFE head guard failed — readable changed shape`);
          if (isModule && !MODULE_HEAD_GUARD(headText))
            throw new Error(`${sourceFile}: module head guard failed — readable changed shape`);
          specials.push({
            kind: "whole",
            file: `${tag}-head.js`,
            A: 1,
            B: stmts[0].startLine - 1,
            title: isClassic
              ? `${tag}-head — IIFE wrapper head ('use strict' + first module banner, whole-file, never sliced)`
              : `${tag}-head — module bootstrap header comment (whole-file, never sliced)`,
            body: isClassic
              ? "The classic script's IIFE opening (`(() => {`, `\"use strict\";`) and the leading `// ---- world/rng.js ----` banner comment — the wrapper the whole game lives inside; indexed whole-file in readable/, never sliced (its body statements are the src/ slices)."
              : "The module script's leading comment (`// three.js drives the first-person view; …`) — the external-import bootstrap's header; indexed whole-file in readable/, never sliced.",
          });
        }
        if (lastStmt.endLine < lines.length) {
          const tailText = lines.slice(lastStmt.endLine, lines.length).join("\n");
          if (isClassic && !IIFE_CLOSER_GUARD(tailText))
            throw new Error(`${sourceFile}: IIFE closer guard failed — readable changed shape`);
          specials.push({
            kind: "skip",
            file: `${tag}-tail.js`,
            A: lastStmt.endLine + 1,
            B: lines.length,
            title: `${tag}-tail — IIFE closer (not sliced)`,
            desc: `Lines ${lastStmt.endLine + 1}-${lines.length}. The IIFE's closing \`})();\` — a standalone tail carries no statements of its own, so it is indexed only.`,
          });
        }

        // runs of statements (no covered regions in this source) -> windows
        const slices = windowize(stmts);

        // blocks in line order, then re-tile so every line of the pretty is owned
        const blocksAll = [
          ...specials,
          ...slices.map((w) => ({ kind: "slice", A: w.startLine, B: w.endLine, count: w.count })),
        ].sort((a, b) => a.A - b.A);
        for (let i = 0; i < blocksAll.length; i++) {
          if (i === 0) blocksAll[i].A = 1;
          if (i + 1 < blocksAll.length) blocksAll[i].B = blocksAll[i + 1].A - 1;
          else blocksAll[i].B = lines.length;
        }

        let nn = 0;
        let perFileSkipped = 0;
        let perFileWhole = 0;
        for (const bl of blocksAll) {
          if (bl.kind === "slice") {
            nn++;
            const num = String(nn).padStart(2, "0");
            const body = lines.slice(bl.A - 1, bl.B).join("\n") + "\n";
            const ms = markers(body);
            const topWord = ms.length ? ms[0][0] : tag.toLowerCase();
            const oversized = bl.count === 1 && bl.B - bl.A + 1 > MAX_WINDOW;
            const file = `${tag}-${num}.js`;
            const sliceText =
              `// ${tag} ${num} — ${topWord}\n` +
              `// Lines ${bl.A}-${bl.B} of ${sourceFile} (statement-aligned).\n` +
              body;
            const chk = parses(sliceText);
            if (!chk.ok) throw new Error(`generated src/${file} does not parse standalone: ${chk.why}`);
            fs.writeFileSync(path.join(srcDir, file), sliceText);
            written.src.add(file);
            sections.push({
              file,
              title: `${tag} ${num} — ${topWord}`,
              desc: `${oversized ? "Oversized single declaration (kept whole). " : ""}Lines ${bl.A}-${bl.B}. Markers: ${markerText(ms)}.`,
              startLine: bl.A,
              endLine: bl.B,
              sourceFile,
            });
          } else if (bl.kind === "whole") {
            perFileWhole++;
            wholeTotal++;
            sections.push({
              file: bl.file,
              wholeFile: true,
              title: bl.title,
              desc: `Lines ${bl.A}-${bl.B} of ${sourceFile}: ${bl.body}`,
              note: "whole-file region (wrapper rule): indexed in readable/, never sliced",
              startLine: bl.A,
              endLine: bl.B,
              sourceFile,
            });
          } else {
            perFileSkipped++;
            skippedTotal++;
            sections.push({
              file: bl.file,
              skipped: true,
              title: bl.title,
              desc: bl.desc,
              startLine: bl.A,
              endLine: bl.B,
              sourceFile,
              firstLine: lines[bl.A - 1],
              lastLine: lines[bl.B - 1],
            });
          }
        }
        slicedTotal += nn;
        sources.push({
          sourceFile,
          capture: rel,
          captureKind: `inline-${b.kind}`,
          captureByteStart: b.contentStart,
          captureByteEnd: b.contentEnd,
          captureSha256: b.sha256,
          captureBytes: b.bytes,
          prettyLines: lines.length,
          prettyBytes: prettyBuf.length,
          prettySha256: sha256(prettyBuf),
          prettyPasses,
          fixpoint: true,
          tag,
          wrapper,
          statements: stmts.length,
          slices: nn,
          derived:
            `readable + ${nn} statement-aligned slice(s)` +
            (perFileWhole ? ` + ${perFileWhole} wholeFile region(s)` : "") +
            (perFileSkipped ? ` + ${perFileSkipped} skipped section(s)` : ""),
        });
        console.log(
          `derive: ${rel} inline ${b.kind} #${b.block} -> ${sourceFile} (${lines.length} lines, ${stmts.length} stmts, ${nn} slices, ${perFileWhole} wholeFile, ${perFileSkipped} skipped)`,
        );
      }
    }
    if (entryRec.blocks.length) inlineMap.sources.push(entryRec);
  }
  fs.writeFileSync(path.join(readableDir, "index-inline-map.json"), JSON.stringify(inlineMap, null, 2) + "\n");

  // external CDN imports recorded (never captured)
  notRendered.unshift(
    {
      capture: "index.html",
      kind: "external-import",
      url: THREE_URL,
      rendered: false,
      reason:
        "external ES-module import in the inline module script (three.js 0.186.1, pinned by the URL) — a CDN dependency that stays CDN (fleet rule; socker precedent 2026-10-10); no vendor bytes are captured or derived. The game degrades gracefully without it: the globe and everything else work without three.js.",
    },
    {
      capture: "index.html",
      kind: "external-script",
      url: ITCH_HARNESS,
      rendered: false,
      reason: "itch HTML5 harness on the frame document (resize/fullscreen) — platform chrome, not the game; left pointing at itch, never vendored.",
    },
  );

  // ── 2) prune orphan derived files (capture untouched) ──────────────────
  let pruned = 0;
  for (const [dir, keep, exts] of [
    [readableDir, written.readable, /\.(pretty\.js|pretty\.css)$/],
    [srcDir, written.src, /\.js$/],
  ]) {
    for (const f of fs.readdirSync(dir)) {
      if (exts.test(f) && !keep.has(f)) {
        fs.rmSync(path.join(dir, f));
        pruned++;
        console.log(`derive: pruned orphan derived file ${path.join(path.basename(dir), f)}`);
      }
    }
  }

  // ── 3) split-spec.json (2-space indent + trailing newline) ─────────────
  const jsSources = sources.filter((s) => s.sourceFile.endsWith(".pretty.js"));
  const cssSources = sources.filter((s) => s.sourceFile.endsWith(".pretty.css"));
  const slicedSources = jsSources.filter((s) => s.slices > 0);
  const bigSource = slicedSources.slice().sort((a, b) => b.slices - a.slices)[0];
  const firstSlices = sections.filter((s) => !s.wholeFile && !s.skipped);
  const spec = {
    project: "worldseed",
    kind: "statement-aligned-slices",
    defaultFile: `src/${firstSlices.filter((s) => s.sourceFile === bigSource.sourceFile)[0].file}`,
    note:
      `WORLDSEED is capture-class: the itch.io HTML5 embed served from https://html-classic.itch.zone/html/19693588/ — a SINGLE ` +
      `self-contained index.html (${manifest.files["index.html"].bytes} B) whose whole game is inline. §0.4 fork-over-mirror was checked on ` +
      TODAY +
      " — no public upstream repo exists (the itch page carries no repo link, and a GitHub search finds nothing for the game " +
      "or the author slug Generic-King), so the mirror stands. Derived pipeline: capture → pinned prettier 3.9.6 (module API, " +
      "default options, rendered to fixpoint (format until the output stops changing, max 5 passes) — never the CLI: it respects " +
      ".gitignore and can silently echo its input) → readable/index-inline-N.pretty.{js,css} per inline block (every pretty provably " +
      "NOT byte-identical to its capture source) → statement-aligned slices src/<tag>-NN.js of the two inline script blocks: the " +
      "classic script is one `(() => { … })();` IIFE wrapping the author's ~71 source modules (each introduced by a " +
      "`// ---- world/x.js ----` banner), so slices cut the IIFE BODY at top-level declaration boundaries in ~250-350 line windows " +
      "(oversized single declarations stay whole) with the exact 2-line provenance header; the IIFE wrapper head (opening + " +
      "'use strict' + first module banner) is a wholeFile section and the `})();` closer a skipped section, both indexed and never " +
      "sliced. Every slice parses standalone under `node --input-type=module --check -` and round-trips byte-exact to its recorded " +
      "readable line range. No vendor bytes exist in the capture to whole-file: three.js 0.186.1 is an EXTERNAL CDN ES-module import " +
      `(${THREE_URL}) and the fonts stylesheet an external CDN link — CDN dependencies stay CDN (fleet rule; socker precedent ` +
      "2026-10-10), recorded in notRendered and README.md; the game degrades gracefully without both. Identifiers in src/ are the " +
      "author's own names (the inline source is commented and human-written — no rename campaign needed). Capture bytes are " +
      "untouched by everything above; re-cut with `node tools/derive.mjs` after any capture refresh. `node tools/audit.js` is the gate.",
    renderOptions: {
      _default:
        "prettier 3.9.6, module API, default options, rendered to fixpoint (format until the output stops changing, max 5 passes) — never the CLI: it respects .gitignore and can silently echo its input",
      js: "parser babel, no plugins",
      passes: "format until fixpoint, max 5 (recorded per source as prettyPasses)",
      css: "parser css, no plugins",
      json: "parser json, no plugins (inline importmap blocks, if any)",
    },
    source:
      `readable/: ${jsSources.length} JS pretties (${slicedSources.length} script block(s) sliced) + ${cssSources.length} CSS pretties (wholeFile); ` +
      `src/: ${slicedSources.reduce((n, s) => n + s.slices, 0)} statement-aligned slices across ${slicedSources.length} script block(s); ` +
      `${sections.filter((s) => s.skipped).length} skipped section(s); ${sections.filter((s) => s.wholeFile).length} wholeFile section(s); ` +
      `capture: ${captured.length} file(s) under .upstream/manifest.json; inline scan: ${inlineFiles.join(", ")} ` +
      `(${inlineMap.sources.reduce((n, s) => n + s.blocks.length, 0)} inline content block(s)); derived ${TODAY}.`,
    inline: {
      scanned: inlineFiles,
      contentBlocks: inlineMap.sources.reduce((n, s) => n + s.blocks.length, 0),
      notRendered: notRendered.length,
      note:
        "the captured entry document carries 4 inline content blocks: <style> #1 (reset) and #2 (app CSS) render to readable/index-inline-{1,2}.pretty.css; " +
        "<script> #1 (module: the three.js CDN bootstrap) and #2 (classic: the whole game IIFE, ~74,979 pretty lines) render to " +
        "readable/index-inline-{1,2}.pretty.js and are sliced into src/. The itch chrome script (src=) and the Google Fonts <link> are " +
        "external references, not blocks: recorded in notRendered.",
    },
    externalDependencies: [
      { url: THREE_URL, kind: "es-module import (three.js 0.186.1)", vendored: false },
      { url: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Caveat:wght@500;700&family=Silkscreen:wght@400;700&display=swap", kind: "stylesheet (Google Fonts)", vendored: false },
      { url: "https://fonts.gstatic.com", kind: "preconnect (font files)", vendored: false },
      { url: "https://fonts.googleapis.com", kind: "preconnect", vendored: false },
      { url: ITCH_HARNESS, kind: "itch HTML5 harness script", vendored: false },
    ],
    sources,
    sections,
    notRendered,
  };
  fs.writeFileSync(path.join(proj, "split-spec.json"), JSON.stringify(spec, null, 2) + "\n");

  // ── 4) self-check (tools/audit.js is the authoritative gate) ────────────
  let bad = 0;
  const bySource = new Map();
  for (const s of sections) {
    if (!bySource.has(s.sourceFile)) bySource.set(s.sourceFile, []);
    bySource.get(s.sourceFile).push(s);
  }
  for (const [sourceFile, list] of bySource) {
    const lines = readLines(path.join(proj, sourceFile));
    const sorted = [...list].sort((a, b) => a.startLine - b.startLine);
    if (sorted[0].startLine !== 1) {
      console.error(`TILING FAIL ${sourceFile}: starts at line ${sorted[0].startLine}`);
      bad++;
    }
    for (let i = 1; i < sorted.length; i++)
      if (sorted[i].startLine !== sorted[i - 1].endLine + 1) {
        console.error(`TILING FAIL ${sourceFile}: gap/overlap at ${sorted[i].file}`);
        bad++;
      }
    if (sorted[sorted.length - 1].endLine !== lines.length) {
      console.error(`TILING FAIL ${sourceFile}: does not reach EOF (${lines.length})`);
      bad++;
    }
  }
  let parsed = 0;
  let ranged = 0;
  let roundOK = 0;
  for (const s of sections) {
    if (s.wholeFile || s.skipped) continue;
    ranged++;
    const abs = path.join(srcDir, s.file);
    const text = fs.readFileSync(abs, "utf8");
    const nl2 = text.indexOf("\n", text.indexOf("\n") + 1);
    const body = text.slice(nl2 + 1);
    const expected = readLines(path.join(proj, s.sourceFile)).slice(s.startLine - 1, s.endLine).join("\n") + "\n";
    if (body !== expected) {
      console.error(`ROUND-TRIP FAIL ${s.file}`);
      bad++;
    } else roundOK++;
    if (!parses(text).ok) {
      console.error(`PARSE FAIL src/${s.file}`);
      bad++;
    } else parsed++;
  }
  let prettyParsed = 0;
  for (const s of sources) {
    if (!s.sourceFile?.endsWith(".pretty.js")) continue;
    if (!parses(fs.readFileSync(path.join(proj, s.sourceFile), "utf8")).ok) {
      console.error(`PARSE FAIL ${s.sourceFile}`);
      bad++;
    } else prettyParsed++;
  }
  console.log(
    `derive: ${written.readable.size} readable file(s), ${written.src.size} src slices ` +
      `(${parsed}/${ranged} parse standalone, ${roundOK}/${ranged} round-trip byte-exact), ` +
      `${skippedTotal} skipped, ${wholeTotal} wholeFile, ${prettyParsed} pretty js parse clean, ` +
      `${notRendered.length} notRendered, ${pruned} orphan(s) pruned — self-check ${bad ? bad + " FAILURE(S)" : "clean"}`,
  );
  if (bad) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
