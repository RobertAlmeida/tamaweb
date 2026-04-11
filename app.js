/**
 * app.js – TamaWEB v2.0: Lógica principal do bichinho virtual
 * ════════════════════════════════════════════════════════════
 * Vanilla JS. Sem frameworks.
 * Melhorias v2.0:
 *  - 4 espécies (blob, cat, dino, ghost) com sprites únicos
 *  - Mini-jogo de reflexo para brincar
 *  - Botão de remédio quando doente
 *  - Modal de evolução animado
 *  - Efeitos de partículas no canvas
 *  - Sistema de recordes
 *  - Indicador de nuvem no header
 *  - Valores numéricos nas barras
 *  - Modo noturno automático
 *  - Humor mais detalhado
 */

// ─────────────────────────────────────────────────────────────────
// 1. CONFIGURAÇÃO
// ─────────────────────────────────────────────────────────────────

const CFG = {
  TICK_MS:        10_000,   // 10 s reais = 1 tick de jogo
  DECAY: { hunger: 4, happy: 3, energy: 2, hygiene: 2 },
  ALERT_LOW:      25,
  CRITICAL_LOW:   10,
  EVOLVE_CHILD:   18,
  EVOLVE_TEEN:    60,
  EVOLVE_ADULT:   180,
  EVENT_CHANCE:   0.08,
  SICK_TICKS_LIMIT: 20,
  SAVE_INTERVAL_MS: 15_000,
  ANIM_INTERVAL_MS: 140,
};

const STAGES = ["egg", "baby", "child", "teen", "adult"];

const MSGS = {
  feed:        ["Nhom nhom!", "Que delícia!", "Mais um, plz!"],
  play:        ["Eba! Diversão!", "Uhuul!", "Vamos jogar!"],
  sleep:       ["Boa noite...", "Zzz...", "Sonhos lindos!"],
  bathe:       ["Que frescura...", "Limpinho!", "Splaaash!"],
  medicine:    ["Ui, que amargo!", "Tomando remédio...", "Me cura!"],
  sick:        ["Me sinto mal...", "Achoo!", "Tô doente :("],
  heal:        ["Curado! Yay!", "De volta à vida!", "Me sinto ótimo!"],
  evolve:      ["Evoluí!! 🎉", "Ficou maior!", "Uau que crescimento!"],
  hungry:      ["Tô com FOME!", "Me alimenta!", "Barrigão vazio..."],
  bored:       ["Tô tedioso...", "Brinca comigo!", "Nada pra fazer..."],
  tired:       ["Tô cansado...", "Quero dormir...", "ZzZz..."],
  dirty:       ["Fedorento!!", "Me lava!", "Cheiro ruim :("],
  event_gift:  ["Achei algo!", "Presente! 🎁", "Que surpresa!"],
  event_sick:  ["Peguei um resfriado...", "Achoo! Doente.", "Que azar..."],
  event_happy: ["Tô feliz! 🌟", "Dia especial!", "Yay!"],
  death:       ["Vou dormir pra sempre...", "Cuide bem do próximo.", "Adeus amigo..."],
  minigame_win:  ["Acertei! ⭐", "Uhuul! Ganho!", "Sou o melhor!"],
  minigame_lose: ["Errei...", "Quase...", "De novo!"],
  morning:     ["Bom dia!", "Acordei!", "Que sono gostoso!"],
  night:       ["Tá tarde...", "Hora de dormir?", "Boa noite, mundo."],
};

// ─────────────────────────────────────────────────────────────────
// 2. ESTADO DO JOGO
// ─────────────────────────────────────────────────────────────────

let state = {
  playerName: "JOGADOR",
  petName:    "TAMA",
  species:    "blob",
  stage:      "egg",
  age:        0,
  hunger:     80,
  happy:      80,
  energy:     80,
  hygiene:    80,
  alive:      true,
  sick:       false,
  sickTicks:  0,
  sleeping:   false,
  lastSave:   Date.now(),
  createdAt:  Date.now(),
  bestAge:    0,
};

// ─────────────────────────────────────────────────────────────────
// 3. SPRITES POR ESPÉCIE
// ─────────────────────────────────────────────────────────────────

const D = "#0f380f", M = "#306230", L = "#8bac0f", _ = null;

function px(ctx, grid, ox, oy, sz) {
  sz = sz || 4;
  grid.forEach(function(row, r) {
    row.forEach(function(col, c) {
      if (!col) return;
      ctx.fillStyle = col;
      ctx.fillRect(ox + c * sz, oy + r * sz, sz, sz);
    });
  });
}

function drawSleep(ctx) {
  ctx.fillStyle = M;
  ctx.font = "bold 9px 'Courier New'";
  ctx.fillText("z", 52, 18);
  ctx.font = "bold 6px 'Courier New'";
  ctx.fillText("z", 58, 11);
}

function drawDead(ctx) {
  ctx.fillStyle = M;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("✝", 40, 54);
  ctx.font = "5px monospace";
  ctx.fillText("R.I.P.", 40, 62);
  ctx.textAlign = "left";
}

// ══ BLOB ══════════════════════════════════════════════════════════
const blobSprites = {
  egg: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    const dy = frame % 3 === 0 ? 1 : 0;
    px(ctx, [
      [_,_,M,M,M,_,_],
      [_,M,L,L,L,M,_],
      [M,L,D,L,L,L,M],
      [M,L,L,L,L,L,M],
      [M,L,D,L,D,L,M],
      [_,M,L,L,L,M,_],
      [_,_,M,M,M,_,_],
    ], 22, 12 + dy, 5);
  },
  baby_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    const dy = frame % 4 < 2 ? 0 : 1;
    px(ctx, [
      [_,M,M,M,M,_],
      [M,L,L,L,L,M],
      [M,L,L,L,L,M],
      [M,L,L,L,L,M],
      [_,M,L,L,M,_],
      [_,_,M,M,_,_],
    ], 24, 16 + dy);
    // eyes
    if (frame % 8 !== 7) {
      ctx.fillStyle = D; ctx.fillRect(28, 22, 4, 4); ctx.fillRect(40, 22, 4, 4);
    } else {
      ctx.fillStyle = D; ctx.fillRect(28, 24, 4, 1); ctx.fillRect(40, 24, 4, 1);
    }
    ctx.fillStyle = D; ctx.fillRect(32, 30, 4, 2);
  },
  baby_happy: function(ctx, frame) {
    blobSprites.baby_idle(ctx, frame);
    ctx.fillStyle = D; ctx.fillRect(30, 31, 8, 2); ctx.fillRect(28, 29, 2, 2); ctx.fillRect(38, 29, 2, 2);
  },
  baby_sick: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    px(ctx, [
      [_,M,M,M,M,_], [M,L,L,L,L,M], [M,L,L,L,L,M], [M,L,L,L,L,M], [_,M,L,L,M,_], [_,_,M,M,_,_],
    ], 24, 16);
    ctx.fillStyle = D;
    ctx.fillRect(27, 21, 2, 6); ctx.fillRect(31, 21, 2, 6); ctx.fillRect(27, 21, 6, 2); ctx.fillRect(27, 25, 6, 2);
    ctx.fillRect(39, 21, 2, 6); ctx.fillRect(43, 21, 2, 6); ctx.fillRect(39, 21, 6, 2); ctx.fillRect(39, 25, 6, 2);
    ctx.fillRect(30, 33, 8, 2); ctx.fillRect(28, 31, 2, 2); ctx.fillRect(38, 31, 2, 2);
    // spots
    ctx.fillStyle = M;
    ctx.fillRect(26, 16, 3, 3); ctx.fillRect(44, 18, 3, 3);
  },
  baby_sleep: function(ctx) {
    ctx.clearRect(0, 0, 80, 64);
    px(ctx, [
      [_,M,M,M,M,_], [M,L,L,L,L,M], [M,L,L,L,L,M], [M,L,L,L,L,M], [_,M,L,L,M,_], [_,_,M,M,_,_],
    ], 24, 20);
    ctx.fillStyle = D; ctx.fillRect(28, 25, 4, 1); ctx.fillRect(40, 25, 4, 1);
    drawSleep(ctx);
  },
  baby_dead: function(ctx) {
    ctx.clearRect(0, 0, 80, 64);
    px(ctx, [
      [_,M,M,M,M,_], [M,L,L,L,L,M], [M,L,L,L,L,M], [M,L,L,L,L,M], [_,M,L,L,M,_], [_,_,M,M,_,_],
    ], 24, 16);
    ctx.fillStyle = D;
    ctx.fillRect(27, 21, 2, 6); ctx.fillRect(31, 21, 2, 6); ctx.fillRect(27, 21, 6, 2); ctx.fillRect(27, 25, 6, 2);
    ctx.fillRect(39, 21, 2, 6); ctx.fillRect(43, 21, 2, 6); ctx.fillRect(39, 21, 6, 2); ctx.fillRect(39, 25, 6, 2);
    ctx.fillRect(30, 32, 8, 2);
    drawDead(ctx);
  },
  child_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    const dx = frame % 6 < 3 ? -1 : 1;
    px(ctx, [
      [_,_,M,M,M,M,_,_], [_,M,L,L,L,L,M,_],
      [M,L,L,D,L,D,L,M], [M,L,L,L,L,L,L,M],
      [M,L,L,L,L,L,L,M], [_,M,M,L,L,M,M,_],
    ], 20 + dx, 12);
    ctx.fillStyle = D;
    ctx.fillRect(22 + dx, 36, 4, 8); ctx.fillRect(42 + dx, 36, 4, 8);
    if (frame % 10 !== 9) {
      ctx.fillRect(26 + dx, 20, 4, 4); ctx.fillRect(38 + dx, 20, 4, 4);
    } else {
      ctx.fillRect(26 + dx, 22, 4, 1); ctx.fillRect(38 + dx, 22, 4, 1);
    }
    ctx.fillRect(30 + dx, 28, 4, 2);
  },
  teen_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    const dy = frame % 4 < 2 ? 0 : 1;
    px(ctx, [
      [_,_,_,M,M,M,M,_,_,_], [_,_,M,L,L,L,L,M,_,_],
      [_,M,L,L,D,L,D,L,M,_], [_,M,L,L,L,L,L,L,M,_],
      [_,M,L,L,L,L,L,L,M,_], [_,M,L,L,L,L,L,L,M,_],
      [_,_,M,L,L,L,L,M,_,_], [_,_,M,L,_,_,L,M,_,_],
    ], 16, 8 + dy);
    ctx.fillStyle = D;
    if (frame % 4 < 2) {
      ctx.fillRect(12, 24, 4, 8); ctx.fillRect(56, 24, 4, 8);
    } else {
      ctx.fillRect(12, 28, 8, 4); ctx.fillRect(52, 28, 8, 4);
    }
    ctx.fillRect(24, 40 + dy, 4, 8); ctx.fillRect(44, 40 + dy, 4, 8);
  },
  adult_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    const shake = frame % 8;
    px(ctx, [
      [_,_,M,M,M,M,M,M,_,_], [_,M,L,L,L,L,L,L,M,_],
      [M,L,L,D,L,L,D,L,L,M], [M,L,L,L,L,L,L,L,L,M],
      [M,L,L,L,L,L,L,L,L,M], [M,L,L,L,L,L,L,L,L,M],
      [M,L,L,L,L,L,L,L,L,M], [_,M,M,L,L,L,L,M,M,_],
      [_,_,M,L,_,_,L,M,_,_], [_,_,_,M,_,_,M,_,_,_],
    ], 14, 5);
    ctx.fillStyle = D;
    ctx.fillRect(22, 43, 4, 8 + (shake < 4 ? 4 : 0));
    ctx.fillRect(46, 43, 4, 8 + (shake >= 4 ? 4 : 0));
    // crown
    if (shake < 8) {
      ctx.fillStyle = L;
      ctx.fillRect(28, 1, 4, 4); ctx.fillRect(36, -1, 4, 6); ctx.fillRect(44, 1, 4, 4);
    }
  },
};

// ══ CAT ═══════════════════════════════════════════════════════════
const catSprites = {
  egg: blobSprites.egg,
  baby_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    const dy = frame % 4 < 2 ? 0 : 1;
    // ears
    ctx.fillStyle = D; ctx.fillRect(24, 12 + dy, 4, 6); ctx.fillRect(44, 12 + dy, 4, 6);
    ctx.fillStyle = M; ctx.fillRect(25, 13 + dy, 2, 4); ctx.fillRect(45, 13 + dy, 2, 4);
    px(ctx, [
      [_,M,M,M,M,_], [M,L,L,L,L,M], [M,L,L,L,L,M], [M,L,L,L,L,M], [_,M,L,L,M,_], [_,_,M,M,_,_],
    ], 24, 16 + dy);
    if (frame % 8 !== 7) {
      ctx.fillStyle = D; ctx.fillRect(28, 22, 4, 3); ctx.fillRect(40, 22, 4, 3);
    } else {
      ctx.fillStyle = D; ctx.fillRect(28, 24, 4, 1); ctx.fillRect(40, 24, 4, 1);
    }
    ctx.fillStyle = D; ctx.fillRect(31, 29, 2, 2); ctx.fillRect(36, 29, 2, 2);
    // whiskers
    ctx.fillRect(16, 26, 8, 1); ctx.fillRect(48, 26, 8, 1);
    ctx.fillRect(14, 28, 8, 1); ctx.fillRect(50, 28, 8, 1);
    // tail
    const tf = frame % 6;
    ctx.fillRect(48 + tf, 34, 4, 4);
  },
  baby_happy: function(ctx, frame) {
    catSprites.baby_idle(ctx, frame);
    ctx.fillStyle = D; ctx.fillRect(30, 30, 8, 2);
  },
  baby_sick: function(ctx, frame) {
    catSprites.baby_idle(ctx, 0);
    ctx.fillStyle = D;
    ctx.fillRect(27, 21, 2, 6); ctx.fillRect(31, 21, 2, 6); ctx.fillRect(27, 21, 6, 2); ctx.fillRect(27, 25, 6, 2);
    ctx.fillRect(39, 21, 2, 6); ctx.fillRect(43, 21, 2, 6); ctx.fillRect(39, 21, 6, 2); ctx.fillRect(39, 25, 6, 2);
  },
  baby_sleep: blobSprites.baby_sleep,
  baby_dead:  blobSprites.baby_dead,
  child_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    ctx.fillStyle = D; ctx.fillRect(22, 6, 5, 8); ctx.fillRect(41, 6, 5, 8);
    ctx.fillStyle = M; ctx.fillRect(23, 7, 3, 6); ctx.fillRect(42, 7, 3, 6);
    const dx = frame % 6 < 3 ? -1 : 1;
    px(ctx, [
      [_,_,M,M,M,M,_,_], [_,M,L,L,L,L,M,_],
      [M,L,L,D,L,D,L,M], [M,L,L,L,L,L,L,M],
      [M,L,L,L,L,L,L,M], [_,M,M,L,L,M,M,_],
    ], 20 + dx, 12);
    ctx.fillStyle = D;
    ctx.fillRect(22 + dx, 36, 4, 8); ctx.fillRect(42 + dx, 36, 4, 8);
    ctx.fillRect(12, 26, 8, 1); ctx.fillRect(52, 26, 8, 1);
    const tf = frame % 8;
    ctx.fillRect(52, 36 + tf, 4, 4);
  },
  teen_idle:  blobSprites.teen_idle,
  adult_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    ctx.fillStyle = D; ctx.fillRect(18, 0, 6, 8); ctx.fillRect(48, 0, 6, 8);
    ctx.fillStyle = M; ctx.fillRect(19, 1, 4, 6); ctx.fillRect(49, 1, 4, 6);
    blobSprites.adult_idle(ctx, frame);
    ctx.fillStyle = D;
    ctx.fillRect(8, 24, 10, 1); ctx.fillRect(64, 24, 10, 1);
    ctx.fillRect(6, 27, 10, 1); ctx.fillRect(66, 27, 10, 1);
    const tf = frame % 8;
    ctx.fillRect(60 + tf, 44, 5, 5);
  },
};

// ══ DINO ══════════════════════════════════════════════════════════
const dinoSprites = {
  egg: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    const dy = frame % 2 === 0 ? 0 : 1;
    px(ctx, [
      [_,_,M,M,M,M,_,_], [_,M,L,L,L,L,M,_],
      [M,L,L,L,D,L,L,M], [M,L,L,L,L,L,L,M],
      [M,L,D,L,L,L,L,M], [M,L,L,L,L,D,L,M],
      [_,M,L,L,L,L,M,_], [_,_,M,M,M,M,_,_],
    ], 20, 10 + dy, 5);
  },
  baby_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    const dy = frame % 4 < 2 ? 0 : 1;
    // spikes
    ctx.fillStyle = D;
    ctx.fillRect(30, 10 + dy, 4, 5); ctx.fillRect(38, 8 + dy, 4, 5); ctx.fillRect(24, 12 + dy, 4, 4);
    px(ctx, [
      [_,M,M,M,M,_], [M,L,L,L,L,M], [M,L,L,L,L,M],
      [M,L,L,L,L,M], [_,M,L,L,M,_], [_,_,M,M,_,_],
    ], 24, 14 + dy);
    if (frame % 8 !== 7) {
      ctx.fillStyle = D; ctx.fillRect(28, 20, 4, 4); ctx.fillRect(40, 20, 4, 4);
    }
    ctx.fillStyle = D; ctx.fillRect(32, 28, 6, 2);
    // tail
    ctx.fillRect(12, 30, 12, 4); ctx.fillRect(8, 32, 4, 4);
  },
  baby_happy: function(ctx, frame) {
    dinoSprites.baby_idle(ctx, frame);
    ctx.fillStyle = D; ctx.fillRect(30, 30, 8, 3);
  },
  baby_sick: blobSprites.baby_sick,
  baby_sleep: function(ctx) {
    ctx.clearRect(0, 0, 80, 64);
    ctx.fillStyle = D;
    ctx.fillRect(30, 10, 4, 5); ctx.fillRect(38, 8, 4, 5); ctx.fillRect(24, 12, 4, 4);
    px(ctx, [
      [_,M,M,M,M,_], [M,L,L,L,L,M], [M,L,L,L,L,M],
      [M,L,L,L,L,M], [_,M,L,L,M,_], [_,_,M,M,_,_],
    ], 24, 18);
    ctx.fillStyle = D; ctx.fillRect(28, 23, 4, 1); ctx.fillRect(40, 23, 4, 1);
    ctx.fillRect(12, 28, 12, 4);
    drawSleep(ctx);
  },
  baby_dead:  blobSprites.baby_dead,
  child_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    const dx = frame % 6 < 3 ? -1 : 1;
    ctx.fillStyle = D;
    ctx.fillRect(28, 4, 5, 8); ctx.fillRect(38, 2, 5, 8); ctx.fillRect(22, 7, 4, 6);
    px(ctx, [
      [_,_,M,M,M,M,_,_], [_,M,L,L,L,L,M,_],
      [M,L,L,D,L,D,L,M], [M,L,L,L,L,L,L,M],
      [M,L,L,L,L,L,L,M], [_,M,M,L,L,M,M,_],
    ], 20 + dx, 12);
    ctx.fillStyle = D;
    ctx.fillRect(22 + dx, 36, 4, 8); ctx.fillRect(42 + dx, 36, 4, 8);
    ctx.fillRect(8, 28, 14, 5 + dx); ctx.fillRect(4, 30, 6, 4);
  },
  teen_idle:  blobSprites.teen_idle,
  adult_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    ctx.fillStyle = D;
    ctx.fillRect(26, 0, 5, 6); ctx.fillRect(34, -2, 6, 8); ctx.fillRect(43, 1, 5, 6); ctx.fillRect(20, 3, 5, 5);
    blobSprites.adult_idle(ctx, frame);
    ctx.fillStyle = D;
    ctx.fillRect(4, 34, 16, 6); ctx.fillRect(2, 36, 6, 6);
  },
};

// ══ GHOST ═════════════════════════════════════════════════════════
const ghostSprites = {
  egg: blobSprites.egg,
  baby_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    const dy = frame % 3 === 0 ? -1 : 0;
    const wavy = [
      [_,_,M,M,M,_,_], [_,M,L,L,L,M,_], [M,L,L,L,L,L,M],
      [M,L,L,L,L,L,M], [M,L,L,L,L,L,M], [M,L,M,L,M,L,M],
    ];
    px(ctx, wavy, 22, 14 + dy);
    if (frame % 8 !== 7) {
      ctx.fillStyle = D; ctx.fillRect(28, 21 + dy, 4, 5); ctx.fillRect(38, 21 + dy, 4, 5);
    }
    ctx.fillStyle = D; ctx.fillRect(32, 30 + dy, 4, 2);
    // floating particles
    if (frame % 4 === 0) { ctx.fillStyle = L; ctx.fillRect(18, 24, 2, 2); ctx.fillRect(54, 20, 2, 2); }
  },
  baby_happy: function(ctx, frame) {
    ghostSprites.baby_idle(ctx, frame);
    ctx.fillStyle = D; ctx.fillRect(30, 31, 8, 2);
  },
  baby_sick: function(ctx, frame) {
    ghostSprites.baby_idle(ctx, 0);
    ctx.fillStyle = D;
    ctx.fillRect(27, 20, 2, 6); ctx.fillRect(31, 20, 2, 6); ctx.fillRect(27, 20, 6, 2); ctx.fillRect(27, 24, 6, 2);
    ctx.fillRect(39, 20, 2, 6); ctx.fillRect(43, 20, 2, 6); ctx.fillRect(39, 20, 6, 2); ctx.fillRect(39, 24, 6, 2);
  },
  baby_sleep: function(ctx) {
    ctx.clearRect(0, 0, 80, 64);
    px(ctx, [
      [_,_,M,M,M,_,_], [_,M,L,L,L,M,_], [M,L,L,L,L,L,M],
      [M,L,L,L,L,L,M], [M,L,L,L,L,L,M], [M,L,M,L,M,L,M],
    ], 22, 16);
    ctx.fillStyle = D; ctx.fillRect(28, 21, 4, 1); ctx.fillRect(38, 21, 4, 1);
    drawSleep(ctx);
  },
  baby_dead: function(ctx) {
    ctx.clearRect(0, 0, 80, 64);
    px(ctx, [
      [_,_,M,M,M,_,_], [_,M,L,L,L,M,_], [M,L,L,L,L,L,M],
      [M,L,L,L,L,L,M], [M,L,L,L,L,L,M], [M,L,M,L,M,L,M],
    ], 22, 14);
    ctx.fillStyle = D;
    ctx.fillRect(27, 20, 2, 6); ctx.fillRect(31, 20, 2, 6); ctx.fillRect(27, 20, 6, 2); ctx.fillRect(27, 24, 6, 2);
    ctx.fillRect(39, 20, 2, 6); ctx.fillRect(43, 20, 2, 6); ctx.fillRect(39, 20, 6, 2); ctx.fillRect(39, 24, 6, 2);
    drawDead(ctx);
  },
  child_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    const dy = frame % 3 === 0 ? -1 : 0;
    px(ctx, [
      [_,_,M,M,M,M,_,_], [_,M,L,L,L,L,M,_],
      [M,L,L,D,L,D,L,M], [M,L,L,L,L,L,L,M],
      [M,L,L,L,L,L,L,M], [M,L,L,L,L,L,L,M],
      [M,L,M,L,M,L,M,M],
    ], 20, 8 + dy);
    ctx.fillStyle = D; ctx.fillRect(30, 20 + dy, 8, 2);
    if (frame % 4 === 0) {
      ctx.fillStyle = L; ctx.fillRect(14, 20, 2, 2); ctx.fillRect(58, 16, 2, 2); ctx.fillRect(12, 28, 2, 2);
    }
  },
  teen_idle:  blobSprites.teen_idle,
  adult_idle: function(ctx, frame) {
    ctx.clearRect(0, 0, 80, 64);
    const dy = frame % 3 === 0 ? -2 : 0;
    px(ctx, [
      [_,_,M,M,M,M,M,M,_,_], [_,M,L,L,L,L,L,L,M,_],
      [M,L,L,D,L,L,D,L,L,M], [M,L,L,L,L,L,L,L,L,M],
      [M,L,L,L,L,L,L,L,L,M], [M,L,L,L,L,L,L,L,L,M],
      [M,L,L,L,L,L,L,L,L,M], [M,L,M,L,M,L,M,L,M,M],
    ], 14, 4 + dy);
    ctx.fillStyle = D; ctx.fillRect(30, 28 + dy, 12, 2);
    if (frame % 4 === 0) {
      ctx.fillStyle = L;
      ctx.fillRect(8, 24, 3, 3); ctx.fillRect(62, 20, 3, 3); ctx.fillRect(6, 34, 3, 3); ctx.fillRect(64, 34, 3, 3);
    }
  },
};

// ── Seletor de sprites ─────────────────────────────────────────────
const SPECIES_SPRITES = { blob: blobSprites, cat: catSprites, dino: dinoSprites, ghost: ghostSprites };

function getSpriteFn(speciesKey, stage, mood) {
  const sp = SPECIES_SPRITES[speciesKey] || blobSprites;
  if (stage === "egg") return sp.egg || blobSprites.egg;
  const prefix = stage === "adult" ? "adult" : stage === "teen" ? "teen" : stage === "child" ? "child" : "baby";
  if (mood === "dead")    return sp[prefix + "_dead"]  || sp.baby_dead  || blobSprites.baby_dead;
  if (mood === "sleep")   return sp[prefix + "_sleep"] || sp.baby_sleep || blobSprites.baby_sleep;
  if (mood === "sick")    return sp[prefix + "_sick"]  || sp.baby_sick  || blobSprites.baby_sick;
  if (mood === "happy")   return sp[prefix + "_happy"] || sp[prefix + "_idle"] || blobSprites.baby_idle;
  return sp[prefix + "_idle"] || blobSprites.baby_idle;
}

// ─────────────────────────────────────────────────────────────────
// 4. SOM RETRO (Web Audio API)
// ─────────────────────────────────────────────────────────────────

const Audio = (function() {
  let ctx = null;
  function gc() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return ctx;
  }
  function beep(freq, dur, vol, type, delay) {
    try {
      const ac = gc(); if (!ac) return;
      const osc = ac.createOscillator(), gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = type || "square";
      const t = ac.currentTime + (delay || 0);
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol || 0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur);
    } catch(_) {}
  }
  return {
    feed:   () => { beep(880,0.09); beep(1100,0.09,0.1,"square",0.1); },
    play:   () => { beep(660,0.07); beep(880,0.07,0.1,"square",0.08); beep(1100,0.1,0.12,"square",0.16); },
    sleep:  () => { beep(330,0.35,0.07,"sine"); },
    bathe:  () => { [550,440,660].forEach((f,i) => beep(f,0.07,0.1,"square",i*0.09)); },
    alert:  () => { [220,220].forEach((f,i) => beep(f,0.18,0.18,"sawtooth",i*0.25)); },
    heal:   () => { [440,550,660,880].forEach((f,i) => beep(f,0.1,0.14,"sine",i*0.07)); },
    evolve: () => { [400,500,600,700,900,1100,1400].forEach((f,i) => beep(f,0.12,0.18,"square",i*0.07)); },
    death:  () => { [400,350,300,250,200,150].forEach((f,i) => beep(f,0.22,0.15,"sine",i*0.22)); },
    boot:   () => { [200,300,400,500,700,900,1200].forEach((f,i) => beep(f,0.09,0.1,"square",i*0.09)); },
    click:  () => { beep(440,0.04,0.06,"square"); },
    minigameWin: () => { [660,880,1100,1320].forEach((f,i) => beep(f,0.08,0.15,"square",i*0.05)); },
    minigameLose:() => { beep(220,0.3,0.12,"sawtooth"); },
  };
})();

// ─────────────────────────────────────────────────────────────────
// 5. REFERÊNCIAS DOM
// ─────────────────────────────────────────────────────────────────

const DOM = {
  bootScreen:    document.getElementById("boot-screen"),
  bootBar:       document.getElementById("boot-bar"),
  bootPct:       document.getElementById("boot-pct"),
  nameScreen:    document.getElementById("name-screen"),
  mainScreen:    document.getElementById("main-screen"),
  playerNameIn:  document.getElementById("player-name-input"),
  petNameIn:     document.getElementById("pet-name-input"),
  startBtn:      document.getElementById("start-btn"),
  canvas:        document.getElementById("pet-canvas"),
  fxCanvas:      document.getElementById("fx-canvas"),
  barHunger:     document.getElementById("bar-hunger"),
  barHappy:      document.getElementById("bar-happy"),
  barEnergy:     document.getElementById("bar-energy"),
  barHygiene:    document.getElementById("bar-hygiene"),
  valHunger:     document.getElementById("val-hunger"),
  valHappy:      document.getElementById("val-happy"),
  valEnergy:     document.getElementById("val-energy"),
  valHygiene:    document.getElementById("val-hygiene"),
  iconHunger:    document.getElementById("icon-hunger"),
  iconHappy:     document.getElementById("icon-happy"),
  iconEnergy:    document.getElementById("icon-energy"),
  iconHygiene:   document.getElementById("icon-hygiene"),
  iconSick:      document.getElementById("icon-sick"),
  headerTitle:   document.getElementById("header-title"),
  headerAge:     document.getElementById("header-age"),
  headerCloud:   document.getElementById("header-cloud"),
  eventMsg:      document.getElementById("event-msg"),
  speechBubble:  document.getElementById("speech-bubble"),
  minigameOverlay: document.getElementById("minigame-overlay"),
  minigameCanvas:  document.getElementById("minigame-canvas"),
  btnA:          document.getElementById("btn-a"),
  btnB:          document.getElementById("btn-b"),
  btnC:          document.getElementById("btn-c"),
  btnD:          document.getElementById("btn-d"),
  btnMedicine:   document.getElementById("btn-medicine"),
  medicineRow:   document.getElementById("medicine-row"),
  deathModal:    document.getElementById("death-modal"),
  deathMsg:      document.getElementById("death-msg"),
  deathScore:    document.getElementById("death-score"),
  restartBtn:    document.getElementById("restart-btn"),
  evolveModal:   document.getElementById("evolve-modal"),
  evolveCanvas:  document.getElementById("evolve-canvas"),
  evolveMsg:     document.getElementById("evolve-msg"),
  evolveOk:      document.getElementById("evolve-ok"),
  resetBtn:      document.getElementById("reset-btn"),
  panelName:     document.getElementById("panel-name"),
  panelStage:    document.getElementById("panel-stage"),
  panelMood:     document.getElementById("panel-mood"),
  panelAge:      document.getElementById("panel-age"),
  panelSpecies:  document.getElementById("panel-species"),
  panelBest:     document.getElementById("panel-best"),
  logList:       document.getElementById("log-list"),
};

const ctx2d  = DOM.canvas.getContext("2d");
const fxCtx  = DOM.fxCanvas.getContext("2d");
const evCtx  = DOM.evolveCanvas.getContext("2d");

// ─────────────────────────────────────────────────────────────────
// 6. VARIÁVEIS DE CONTROLE
// ─────────────────────────────────────────────────────────────────

let animFrame = 0, animTimer = null, tickTimer = null, saveTimer = null;
let bubbleTimer = null, fxParticles = [];
let selectedSpecies = "blob";

// ─────────────────────────────────────────────────────────────────
// 7. UTILITÁRIOS
// ─────────────────────────────────────────────────────────────────

function clamp(v) { return Math.max(0, Math.min(100, v)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function saveState() {
  state.lastSave = Date.now();
  await FirebaseService.saveState(state);
}

async function loadState() {
  const saved = await FirebaseService.loadState();
  if (!saved) return false;
  const elapsed = Date.now() - saved.lastSave;
  const ticks   = Math.floor(elapsed / CFG.TICK_MS);
  Object.assign(state, saved);
  if (ticks > 0 && state.alive) {
    state.hunger  = clamp(state.hunger  - CFG.DECAY.hunger  * ticks);
    state.happy   = clamp(state.happy   - CFG.DECAY.happy   * ticks);
    state.energy  = clamp(state.energy  - CFG.DECAY.energy  * ticks);
    state.hygiene = clamp(state.hygiene - CFG.DECAY.hygiene * ticks);
    if (state.sick) {
      state.sickTicks += ticks;
      if (state.sickTicks >= CFG.SICK_TICKS_LIMIT) { killPet(); return true; }
    }
    addLog("Voltou após " + Math.round(elapsed / 60000) + " min ausente.", "warn");
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────
// 8. EFEITOS VISUAIS (FX Canvas)
// ─────────────────────────────────────────────────────────────────

function spawnParticles(type) {
  const colors = { feed: ["#0f380f","#306230"], play: ["#306230","#8bac0f"], bathe: ["#8bac0f","#0f380f"], heal: ["#8bac0f","#306230"] };
  const c = colors[type] || ["#306230","#8bac0f"];
  for (let i = 0; i < 10; i++) {
    fxParticles.push({
      x: 80 + (Math.random() - 0.5) * 40,
      y: 64 + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 4 - 1,
      life: 1,
      color: c[i % 2],
      size: Math.random() * 3 + 2,
    });
  }
}

function updateFX() {
  fxCtx.clearRect(0, 0, 160, 128);
  fxParticles = fxParticles.filter(p => p.life > 0);
  fxParticles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.05;
    fxCtx.globalAlpha = p.life;
    fxCtx.fillStyle = p.color;
    const s = Math.round(p.size);
    fxCtx.fillRect(Math.round(p.x) - s/2, Math.round(p.y) - s/2, s, s);
  });
  fxCtx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────
// 9. RENDERIZAÇÃO
// ─────────────────────────────────────────────────────────────────

function getMoodKey() {
  if (!state.alive)    return "dead";
  if (state.sleeping)  return "sleep";
  if (state.sick)      return "sick";
  if (state.happy > 70) return "happy";
  return "idle";
}

function renderPet() {
  const fn = getSpriteFn(state.species || "blob", state.stage, getMoodKey());
  ctx2d.clearRect(0, 0, 80, 64);
  fn(ctx2d, animFrame);
  updateFX();
}

function renderEvolvePreview(stage) {
  evCtx.clearRect(0, 0, 80, 64);
  const fn = getSpriteFn(state.species || "blob", stage, "happy");
  fn(evCtx, 0);
}

// ─────────────────────────────────────────────────────────────────
// 10. ATUALIZAÇÃO DE UI
// ─────────────────────────────────────────────────────────────────

function updateUI() {
  DOM.barHunger.style.width  = state.hunger  + "%";
  DOM.barHappy.style.width   = state.happy   + "%";
  DOM.barEnergy.style.width  = state.energy  + "%";
  DOM.barHygiene.style.width = state.hygiene + "%";

  DOM.valHunger.textContent  = Math.round(state.hunger);
  DOM.valHappy.textContent   = Math.round(state.happy);
  DOM.valEnergy.textContent  = Math.round(state.energy);
  DOM.valHygiene.textContent = Math.round(state.hygiene);

  toggleLow(DOM.barHunger,  state.hunger);
  toggleLow(DOM.barHappy,   state.happy);
  toggleLow(DOM.barEnergy,  state.energy);
  toggleLow(DOM.barHygiene, state.hygiene);

  toggleAlert(DOM.iconHunger,  state.hunger  < CFG.ALERT_LOW);
  toggleAlert(DOM.iconHappy,   state.happy   < CFG.ALERT_LOW);
  toggleAlert(DOM.iconEnergy,  state.energy  < CFG.ALERT_LOW);
  toggleAlert(DOM.iconHygiene, state.hygiene < CFG.ALERT_LOW);

  DOM.iconSick.style.display = state.sick ? "block" : "none";
  toggleAlert(DOM.iconSick, state.sick);

  DOM.medicineRow.classList.toggle("hidden", !state.sick);

  DOM.headerAge.textContent = "IDADE:" + state.age;
  DOM.headerCloud.textContent = FirebaseService.isOnline() ? "☁" : "●";
  DOM.headerCloud.classList.toggle("online", FirebaseService.isOnline());

  const SPECIES_NAMES = { blob: "BOLINHA", cat: "GATINHO", dino: "DINO", ghost: "FANTASMA" };
  DOM.panelName.textContent    = "👤 " + state.playerName;
  DOM.panelStage.textContent   = "🐾 " + state.petName + " [" + stageLabel(state.stage) + "]";
  DOM.panelMood.textContent    = "😶 " + getMood();
  DOM.panelAge.textContent     = "⏱ TICKS: " + state.age;
  DOM.panelSpecies.textContent = "🌟 " + (SPECIES_NAMES[state.species] || "BLOB");
  const best = parseInt(localStorage.getItem("tamaweb_best") || "0");
  DOM.panelBest.textContent    = "🏆 RECORDE: " + best + " ticks";
}

function toggleLow(el, val) {
  el.classList.toggle("low", val < CFG.ALERT_LOW);
}
function toggleAlert(el, on) {
  el.classList.toggle("alert", on);
}

function getMood() {
  if (!state.alive)    return "MORTO ✝";
  if (state.sick)      return "DOENTE 🤒";
  if (state.sleeping)  return "DORMINDO 💤";
  const avg = (state.hunger + state.happy + state.energy + state.hygiene) / 4;
  if (avg >= 85) return "FELIZ 😄";
  if (avg >= 65) return "BEM 🙂";
  if (avg >= 45) return "OK 😐";
  if (avg >= 25) return "MAL 😟";
  return "PÉSSIMO 😰";
}

// ─────────────────────────────────────────────────────────────────
// 11. BALÃO / EVENTO / LOG
// ─────────────────────────────────────────────────────────────────

function showSpeech(msg) {
  DOM.speechBubble.textContent = msg;
  DOM.speechBubble.classList.remove("hidden");
  if (bubbleTimer) clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => DOM.speechBubble.classList.add("hidden"), 2800);
}

function showEvent(msg)  { DOM.eventMsg.textContent = msg; DOM.eventMsg.classList.remove("hidden"); }
function hideEvent()     { DOM.eventMsg.classList.add("hidden"); }

function addLog(msg, type) {
  const el = document.createElement("div");
  el.className = "log-entry pixel-text" + (type ? " " + type : "");
  const now = new Date();
  const ts  = now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0");
  el.textContent = "[" + ts + "] " + msg;
  DOM.logList.prepend(el);
  while (DOM.logList.children.length > 24) DOM.logList.removeChild(DOM.logList.lastChild);
}

// ─────────────────────────────────────────────────────────────────
// 12. LÓGICA DE JOGO
// ─────────────────────────────────────────────────────────────────

function gameTick() {
  if (!state.alive) return;
  state.age++;

  if (state.sleeping) {
    state.energy  = clamp(state.energy  + 12);
    state.hunger  = clamp(state.hunger  - CFG.DECAY.hunger  * 0.4);
    state.hygiene = clamp(state.hygiene - CFG.DECAY.hygiene * 0.3);
    if (state.energy >= 85) {
      state.sleeping = false;
      showSpeech(pick(MSGS.morning));
      addLog(state.petName + " acordou descansado.", "good");
    }
  } else {
    state.hunger  = clamp(state.hunger  - CFG.DECAY.hunger);
    state.happy   = clamp(state.happy   - CFG.DECAY.happy);
    state.energy  = clamp(state.energy  - CFG.DECAY.energy);
    state.hygiene = clamp(state.hygiene - CFG.DECAY.hygiene);
  }

  // Modo noturno: se energia < 20 e não dormindo, sugere dormir
  const hr = new Date().getHours();
  if ((hr >= 22 || hr < 6) && !state.sleeping && state.energy < 40 && state.age % 3 === 0) {
    showSpeech(pick(MSGS.night));
  }

  // Doença por negligência
  if (!state.sick) {
    if (state.hunger < CFG.CRITICAL_LOW || state.hygiene < CFG.CRITICAL_LOW) {
      makeSick();
    }
  } else {
    state.sickTicks++;
    if (state.sickTicks >= CFG.SICK_TICKS_LIMIT) { killPet(); return; }
  }

  // Morte por inanição total
  if (state.hunger <= 0 && state.energy <= 0 && state.happy <= 0) { killPet(); return; }

  // Alertas
  if (state.hunger  < CFG.ALERT_LOW) { Audio.alert(); showSpeech(pick(MSGS.hungry)); }
  else if (state.happy   < CFG.ALERT_LOW) { showSpeech(pick(MSGS.bored)); }
  else if (state.energy  < CFG.ALERT_LOW) { showSpeech(pick(MSGS.tired)); }
  else if (state.hygiene < CFG.ALERT_LOW) { showSpeech(pick(MSGS.dirty)); }

  checkEvolution();
  if (Math.random() < CFG.EVENT_CHANCE) triggerRandomEvent();

  updateUI();
}

function checkEvolution() {
  const prev = state.stage;
  if      (state.age < 5)               state.stage = "egg";
  else if (state.age < CFG.EVOLVE_CHILD) state.stage = "baby";
  else if (state.age < CFG.EVOLVE_TEEN)  state.stage = "child";
  else if (state.age < CFG.EVOLVE_ADULT) state.stage = "teen";
  else                                    state.stage = "adult";

  if (state.stage !== prev) {
    Audio.evolve();
    addLog(state.petName + " evoluiu para " + stageLabel(state.stage) + "!", "warn");
    showEvolveModal();
  }
}

function showEvolveModal() {
  renderEvolvePreview(state.stage);
  DOM.evolveMsg.textContent = state.petName + " evoluiu!\nAgora é um(a) " + stageLabel(state.stage) + "!";
  DOM.evolveModal.classList.remove("hidden");
}

function stageLabel(s) {
  return { egg:"OVO", baby:"BEBÊ", child:"CRIANÇA", teen:"JOVEM", adult:"ADULTO" }[s] || s;
}

function triggerRandomEvent() {
  const roll = Math.random();
  if (roll < 0.35) {
    state.happy = clamp(state.happy + 18);
    showSpeech(pick(MSGS.event_happy));
    addLog("Evento: " + state.petName + " ficou feliz de repente!", "good");
  } else if (roll < 0.60) {
    state.hunger = clamp(state.hunger + 12);
    showSpeech(pick(MSGS.event_gift));
    addLog("Evento: Ganhou um petisco!", "good");
  } else {
    if (!state.sick) {
      makeSick();
      showSpeech(pick(MSGS.event_sick));
      addLog("Evento: " + state.petName + " ficou doente!", "danger");
    }
  }
}

function makeSick() {
  state.sick = true; state.sickTicks = 0;
  Audio.alert();
  addLog(state.petName + " está doente! Use remédio, banho ou comida.", "danger");
  showSpeech(pick(MSGS.sick));
  showEvent("⚠ DOENTE!");
}

function killPet() {
  state.alive = false;
  clearInterval(tickTimer); clearInterval(animTimer);
  Audio.death();
  ctx2d.clearRect(0, 0, 80, 64);
  getSpriteFn(state.species, state.stage, "dead")(ctx2d, 0);

  // Atualiza recorde
  const best = parseInt(localStorage.getItem("tamaweb_best") || "0");
  if (state.age > best) localStorage.setItem("tamaweb_best", state.age);

  DOM.deathMsg.textContent =
    state.petName + " VIVEU " + state.age + " TICKS.\n\"" + pick(MSGS.death) + "\"";
  DOM.deathScore.textContent =
    "DONO: " + state.playerName + "\nRECORDE: " + Math.max(state.age, best) + " TICKS";
  DOM.deathModal.classList.remove("hidden");
  saveState();
}

function healSick() {
  state.sick = false; state.sickTicks = 0;
  Audio.heal();
  showSpeech(pick(MSGS.heal));
  addLog(state.petName + " se curou!", "good");
  hideEvent();
  spawnParticles("heal");
}

// ─────────────────────────────────────────────────────────────────
// 13. AÇÕES DO JOGADOR
// ─────────────────────────────────────────────────────────────────

function doAction(action) {
  if (!state.alive) return;
  if (state.sleeping && action !== "sleep") { showSpeech("Zzz... deixa dormir!"); return; }
  Audio.click();

  switch (action) {
    case "feed":
      if (state.hunger >= 100) { showSpeech("Já tô cheio!"); return; }
      state.hunger = clamp(state.hunger + 28);
      if (state.sick && state.hunger > 55) healSick();
      Audio.feed();
      showSpeech(pick(MSGS.feed));
      addLog("Alimentou " + state.petName + ".", "");
      spawnParticles("feed");
      break;

    case "play":
      if (state.stage === "egg") { showSpeech("Ainda sou um ovo!"); return; }
      if (state.energy < 20) { showSpeech("Tô cansado demais..."); return; }
      startMinigame();
      return;

    case "sleep":
      if (state.sleeping) {
        state.sleeping = false;
        showSpeech(pick(MSGS.morning));
        addLog(state.petName + " foi acordado.", "warn");
      } else {
        if (state.energy >= 95) { showSpeech("Tô cheio de energia!"); return; }
        state.sleeping = true;
        Audio.sleep();
        showSpeech(pick(MSGS.sleep));
        addLog(state.petName + " foi dormir.", "");
      }
      break;

    case "bathe":
      state.hygiene = clamp(state.hygiene + 32);
      if (state.sick && state.hygiene > 60) healSick();
      Audio.bathe();
      showSpeech(pick(MSGS.bathe));
      addLog("Deu banho em " + state.petName + ".", "");
      spawnParticles("bathe");
      break;

    case "heal":
      if (!state.sick) { showSpeech("Tô bem, obrigado!"); return; }
      state.hunger  = clamp(state.hunger  + 10);
      state.hygiene = clamp(state.hygiene + 10);
      healSick();
      showSpeech(pick(MSGS.medicine));
      addLog("Deu remédio para " + state.petName + ".", "good");
      break;
  }
  updateUI();
}

// ─────────────────────────────────────────────────────────────────
// 14. MINI-JOGO DE REFLEXO
// ─────────────────────────────────────────────────────────────────

let mgState = null;

function startMinigame() {
  const mgCtx = DOM.minigameCanvas.getContext("2d");
  const targets = [];
  let score = 0, misses = 0, roundsLeft = 5;
  let activeTarget = null, targetTimer = null;

  DOM.minigameOverlay.classList.remove("hidden");
  addLog("Mini-jogo! Toque nos alvos!", "");

  function drawMG() {
    mgCtx.clearRect(0, 0, 160, 128);
    // BG
    mgCtx.fillStyle = "#9bbc0f";
    mgCtx.fillRect(0, 0, 160, 128);
    // scanlines
    for (let y = 0; y < 128; y += 4) {
      mgCtx.fillStyle = "rgba(0,0,0,0.05)";
      mgCtx.fillRect(0, y, 160, 2);
    }
    // HUD
    mgCtx.fillStyle = "#0f380f";
    mgCtx.font = "6px 'Press Start 2P', monospace";
    mgCtx.fillText("ACERTOS:" + score, 4, 12);
    mgCtx.fillText("RODADAS:" + roundsLeft, 90, 12);

    // Target
    if (activeTarget) {
      const life = (Date.now() - activeTarget.born) / activeTarget.duration;
      const r = Math.max(3, Math.round(16 * (1 - life * 0.5)));
      const cx = activeTarget.x;
      const cy = activeTarget.y;

      // Outer Box
      mgCtx.fillStyle = life > 0.7 ? "#0f380f" : "#306230";
      mgCtx.fillRect(cx - r, cy - r, r*2, r*2);
      
      // Inner Box
      mgCtx.fillStyle = "#8bac0f";
      mgCtx.fillRect(cx - r + 2, cy - r + 2, r*2 - 4, r*2 - 4);
      
      // Target Crosshair
      mgCtx.fillStyle = "#0f380f";
      mgCtx.fillRect(cx - 1, cy - r, 2, r*2);
      mgCtx.fillRect(cx - r, cy - 1, r*2, 2);

      // Center dot
      mgCtx.fillStyle = "#8bac0f";
      mgCtx.fillRect(cx - 2, cy - 2, 4, 4);
      mgCtx.fillStyle = "#0f380f";
      mgCtx.fillRect(cx - 1, cy - 1, 2, 2);

      // Timer Bar
      mgCtx.fillStyle = "#0f380f";
      mgCtx.fillRect(cx - 14, cy + r + 4, 28, 4);
      mgCtx.fillStyle = "#8bac0f";
      mgCtx.fillRect(cx - 13, cy + r + 5, Math.max(0, Math.round(26 * (1 - life))), 2);
    }

    // "Toque!" hint
    if (!activeTarget && roundsLeft > 0) {
      mgCtx.fillStyle = "#306230";
      mgCtx.font = "7px 'Press Start 2P', monospace";
      mgCtx.textAlign = "center";
      mgCtx.fillText("AGUARDE...", 80, 72);
      mgCtx.textAlign = "left";
    }
  }

  function spawnTarget() {
    if (roundsLeft <= 0) { endMG(); return; }
    roundsLeft--;
    const margin = 20;
    activeTarget = {
      x: margin + Math.random() * (160 - margin * 2),
      y: 30 + Math.random() * (128 - 60),
      born: Date.now(),
      duration: 1500 + Math.random() * 1000,
    };
    targetTimer = setTimeout(() => {
      if (activeTarget) { misses++; activeTarget = null; spawnTarget(); }
    }, activeTarget.duration);
  }

  function handleClick(e) {
    if (!activeTarget) return;
    const rect = DOM.minigameCanvas.getBoundingClientRect();
    const scaleX = 160 / rect.width, scaleY = 128 / rect.height;
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    }
    const cx = (clientX - rect.left) * scaleX;
    const cy = (clientY - rect.top) * scaleY;
    const dx = cx - activeTarget.x, dy = cy - activeTarget.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 20) {
      score++;
      clearTimeout(targetTimer);
      activeTarget = null;
      Audio.minigameWin();
      setTimeout(spawnTarget, 400);
    }
  }

  function endMG() {
    clearTimeout(targetTimer);
    DOM.minigameCanvas.removeEventListener("click",      handleClick);
    DOM.minigameCanvas.removeEventListener("touchstart", handleClick);
    clearInterval(mgState.loop);
    mgState = null;

    DOM.minigameOverlay.classList.add("hidden");

    const earned = Math.round(score * 8);
    state.happy  = clamp(state.happy  + earned);
    state.energy = clamp(state.energy - 12);

    if (score >= 4) {
      Audio.minigameWin();
      showSpeech(pick(MSGS.minigame_win));
      addLog("Mini-jogo: Ganhou! +" + earned + " felicidade.", "good");
    } else {
      Audio.minigameLose();
      showSpeech(pick(MSGS.minigame_lose));
      addLog("Mini-jogo: Perdeu... +" + earned + " felicidade.", "");
    }
    spawnParticles("play");
    updateUI();
  }

  mgState = { loop: setInterval(() => drawMG(), 30) };
  DOM.minigameCanvas.addEventListener("click",      handleClick);
  DOM.minigameCanvas.addEventListener("touchstart", handleClick, { passive: true });

  setTimeout(spawnTarget, 800);
}

// ─────────────────────────────────────────────────────────────────
// 15. BOOT E INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────────

function startAnimLoop() {
  if (animTimer) clearInterval(animTimer);
  animTimer = setInterval(() => {
    animFrame = (animFrame + 1) % 64;
    renderPet();
  }, CFG.ANIM_INTERVAL_MS);
}

function startTick() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(gameTick, CFG.TICK_MS);
}

function startAutoSave() {
  if (saveTimer) clearInterval(saveTimer);
  saveTimer = setInterval(saveState, CFG.SAVE_INTERVAL_MS);
}

function startGame() {
  DOM.mainScreen.classList.remove("hidden");
  DOM.headerTitle.textContent = state.petName;
  updateUI();
  startAnimLoop();
  startTick();
  startAutoSave();
  addLog("Bem-vindo, " + state.playerName + "! Cuide de " + state.petName + "!", "good");
  showSpeech("Olá, " + state.playerName + "!");
}

// ── Boot com barra de progresso ──────────────────────────────────
window.addEventListener("DOMContentLoaded", async function() {
  Audio.boot();

  // Barra de boot animada
  let pct = 0;
  const bootInterval = setInterval(() => {
    pct = Math.min(pct + Math.random() * 18 + 5, 98);
    DOM.bootBar.style.width = pct + "%";
    DOM.bootPct.textContent = Math.round(pct) + "%";
  }, 120);

  await sleep(1800);
  clearInterval(bootInterval);
  DOM.bootBar.style.width = "100%";
  DOM.bootPct.textContent = "100%";
  await sleep(300);

  DOM.bootScreen.classList.add("fade-out");
  await sleep(600);
  DOM.bootScreen.classList.add("hidden");

  await FirebaseService.init();
  const hasSave = await loadState();

  if (hasSave && state.alive && state.playerName !== "JOGADOR") {
    startGame();
  } else {
    DOM.nameScreen.classList.remove("hidden");
  }
});

// ── Tela de nome: seleção de espécie ─────────────────────────────
document.querySelectorAll(".species-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".species-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedSpecies = btn.dataset.species;
    Audio.click();
  });
});

DOM.startBtn.addEventListener("click", () => {
  const pn = DOM.playerNameIn.value.trim().toUpperCase() || "JOGADOR";
  const tn = DOM.petNameIn.value.trim().toUpperCase()    || "TAMA";
  state.playerName = pn; state.petName = tn;
  state.species    = selectedSpecies;
  state.createdAt  = Date.now(); state.lastSave = Date.now();
  DOM.nameScreen.classList.add("hidden");
  Audio.boot();
  startGame();
});

// ── Botões de ação ────────────────────────────────────────────────
[DOM.btnA, DOM.btnB, DOM.btnC, DOM.btnD, DOM.btnMedicine].forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 130);
    doAction(btn.dataset.action);
  });
});

DOM.evolveOk.addEventListener("click", () => {
  DOM.evolveModal.classList.add("hidden");
  showSpeech(pick(MSGS.evolve));
});

DOM.restartBtn.addEventListener("click", () => {
  FirebaseService.clearState(); location.reload();
});

DOM.resetBtn.addEventListener("click", () => {
  if (confirm("Reiniciar o jogo? O bichinho atual será perdido.")) {
    FirebaseService.clearState(); location.reload();
  }
});

window.addEventListener("beforeunload", () => { if (state.alive) saveState(); });
document.addEventListener("visibilitychange", () => { if (document.hidden && state.alive) saveState(); });
