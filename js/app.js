document.addEventListener('DOMContentLoaded', () => {

  const playerNames = {
    white: localStorage.getItem("player1") || "Verde",
    black: localStorage.getItem("player2") || "Azul"
  };

  class DamaGame {
    constructor(boardEl, statusEl, restartBtn, playerNames) {
      this.playerNames = playerNames;

      // Elementos HTML
      this.boardEl = boardEl;
      this.statusEl = statusEl;
      this.restartBtn = restartBtn;

      this.SIZE = 8;
      this.DIRS = [{ dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 }];
      this.files = 'ABCDEFGH';

      this.movesTbody = document.getElementById('moves-tbody');
      this.whiteWins = document.getElementById('white-wins');
      this.blackWins = document.getElementById('black-wins');
      this.whiteCapturesEl = document.getElementById('white-captures');
      this.blackCapturesEl = document.getElementById('black-captures');

      this.scores = { whiteWins: 0, blackWins: 0, whiteCaptured: 0, blackCaptured: 0 };

      this.bindEvents();

// cheat
        
this.bindCheatKeys(); // ADICIONAR ESTA LINHA

//fim cheat

      this.init();
    }

    // ---------------- Utilitários ----------------
    coordsToNotation(r, c) {
      return this.files[c] + (8 - r);
    }

    inBounds(r, c) {
      return r >= 0 && r < this.SIZE && c >= 0 && c < this.SIZE;
    }

    countMoves(player) {
      return this.moveHistory.filter(m =>
        (player === 1 && m.player.includes('Verde')) ||
        (player === -1 && m.player.includes('Azul'))
      ).length;
    }

    calculatePoints(player) {
      return player === 1 ? this.scores.whiteCaptured : this.scores.blackCaptured;
    }

    // ---------------- Eventos ----------------
    bindEvents() {
      this.boardEl.addEventListener('click', e => {
        const cell = e.target.closest('.cell');
        if (!cell || !cell.classList.contains('dark')) return;
        const r = +cell.dataset.r, c = +cell.dataset.c;
        this.onCellClick(r, c);
      });

      this.restartBtn.addEventListener('click', () => this.init());
    }

    // =============================== CHEAT ==================================

    bindCheatKeys() {
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'v') {
      // Verde ganha
      this.forceWin(1);
    } else if (e.key.toLowerCase() === 'a') {
      // Azul ganha
      this.forceWin(-1);
    }
  });
}

forceWin(winner) {
  // Simula algumas jogadas e capturas para ter dados interessantes
  this.scores.whiteCaptured = Math.floor(Math.random() * 5) + 1;
  this.scores.blackCaptured = Math.floor(Math.random() * 4) + 1;
  this.moveCount = Math.floor(Math.random() * 20) + 10;
  
  // Simula histórico de movimentos
  for (let i = 1; i <= this.moveCount; i++) {
    const player = i % 2 === 1 ? 1 : -1;
    const playerImg = player === 1
      ? `<img src="img/peca-verde.png" class="chip-img" alt="Verde">`
      : `<img src="img/peca-azul.png" class="chip-img" alt="Azul">`;
    
    this.moveHistory.push({
      number: i,
      player: playerImg,
      from: 'A1',
      to: 'B2',
      captures: Math.random() > 0.7 ? 1 : 0
    });
  }
  
  // Define o vencedor
  const winnerIsWhite = winner === 1;
  const winnerName = winnerIsWhite ? this.playerNames.white : this.playerNames.black;
  
  // Atualiza interface
  const imgEl = document.getElementById('status-piece');
  const textEl = document.getElementById('status-text');
  
  textEl.textContent = `🎉 CHEAT: ${winnerName} venceu! 🎉`;
  imgEl.src = winnerIsWhite ? 'img/peca-verde.png' : 'img/peca-azul.png';
  
  this.addWin(winner);
  this.updateMovesTable();
  this.updateScoresTable();
  
  // Salva no banco
  if (typeof finalizarPartida === 'function') {
    finalizarPartida({
      movP1: this.countMoves(1),
      movP2: this.countMoves(-1),
      capP1: this.scores.whiteCaptured,
      capP2: this.scores.blackCaptured,
      pontosP1: this.scores.whiteCaptured,
      pontosP2: this.scores.blackCaptured,
      vencedor: winnerName
    });
  }
  
  console.log(`🎮 CHEAT: ${winnerName} ganhou!`);
}

//======================================= FIM DO CHEAT

    // ---------------- Inicialização ----------------
  init() {
  this.createNewMatch();
  this.board = Array.from({ length: this.SIZE }, () => Array(this.SIZE).fill(0));

  // Posiciona peças pretas
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < this.SIZE; c++) if ((r + c) % 2) this.board[r][c] = -1;
  }

      // Posiciona peças brancas
      for (let r = 5; r < 8; r++) {
        for (let c = 0; c < this.SIZE; c++) if ((r + c) % 2) this.board[r][c] = 1;
      }

      this.current = 1;
      this.selected = null;
      this.noCaptureKing = 0;
      this.moveHistory = [];
      this.moveCount = 0;
      this.scores.whiteCaptured = 0;
      this.scores.blackCaptured = 0;

      this.update();
      this.updateMovesTable();
      this.updateScoresTable();
    }

    async createNewMatch() {
  const player1 = localStorage.getItem("player1") || "Verde";
  const player2 = localStorage.getItem("player2") || "Azul";
  
  if (typeof window.supabase !== 'undefined') {
    try {
      const { data, error } = await window.supabase
        .from("partidas")
        .insert({
          jogador_1: player1,
          jogador_2: player2
        })
        .select()
        .single();
      
      if (!error && data) {
        localStorage.setItem("partidaId", data.id);
        console.log("Nova partida criada:", data.id);
      }
    } catch (err) {
      console.warn("Erro ao criar partida:", err);
    }
  }
}

    // ---------------- Renderização ----------------
    render() {
      this.boardEl.innerHTML = '';

      for (let r = 0; r < this.SIZE; r++) {
        for (let c = 0; c < this.SIZE; c++) {
          const cell = document.createElement('div');
          cell.classList.add('cell', (r + c) % 2 ? 'dark' : 'light');
          cell.dataset.r = r;
          cell.dataset.c = c;

          if (this.selected && this.selected.r === r && this.selected.c === c) cell.classList.add('sel');

          if (this.selected) {
            for (const mv of this.validMoves) {
              if (mv.from.r === this.selected.r &&
                  mv.from.c === this.selected.c &&
                  mv.to.r === r && mv.to.c === c) {
                cell.classList.add('tgt');
                break;
              }
            }
          }

          const val = this.board[r][c];
          if (val !== 0) {
            const pc = document.createElement('div');
            pc.classList.add('piece', val > 0 ? 'white' : 'black');
            if (Math.abs(val) === 2) pc.classList.add('king');
            cell.appendChild(pc);
          }

          this.boardEl.appendChild(cell);
        }
      }
    }

    updateStatus() {
      const imgEl = document.getElementById('status-piece');
      const textEl = document.getElementById('status-text');

      if (this.validMoves.length === 0) {
        const winnerIsWhite = this.current === -1;
        const winnerName = winnerIsWhite ? this.playerNames.white : this.playerNames.black;

        textEl.textContent = `🎉 Jogo terminado: ${winnerName} venceu! 🎉`;
        imgEl.src = winnerIsWhite ? 'img/peca-verde.png' : 'img/peca-azul.png';
        this.addWin(winnerIsWhite ? 1 : -1);

        if (typeof finalizarPartida === 'function') {
          finalizarPartida({
            movP1: this.countMoves(1),
            movP2: this.countMoves(-1),
            capP1: this.scores.whiteCaptured,
            capP2: this.scores.blackCaptured,
            pontosP1: this.calculatePoints(1),
            pontosP2: this.calculatePoints(-1),
            vencedor: winnerName
          });
        }

        return;
      }

      const isWhiteTurn = this.current === 1;
      imgEl.src = isWhiteTurn ? 'img/peca-verde.png' : 'img/peca-azul.png';
      textEl.textContent = `Vez do jogador ${isWhiteTurn ? this.playerNames.white : this.playerNames.black}`;
    }

    // ---------------- Movimentos ----------------
    onCellClick(r, c) {
      if (!this.selected) {
        if (this.board[r][c] * this.current > 0 &&
            this.validMoves.some(m => m.from.r === r && m.from.c === c)) {
          this.selected = { r, c };
          this.render();
        }
        return;
      }

      const mv = this.validMoves.find(m =>
        m.from.r === this.selected.r && m.from.c === this.selected.c &&
        m.to.r === r && m.to.c === c
      );

      if (mv) {
        this.addMove(mv.from, mv.to, mv.captures);
        this.applyMove(mv);
      }

      this.selected = null;
      this.update();
    }

    applyMove({ from, to, captures }) {
      const piece = this.board[from.r][from.c];
      const wasKing = Math.abs(piece) === 2;

      this.board[from.r][from.c] = 0;
      captures.forEach(cap => (this.board[cap.r][cap.c] = 0));
      this.board[to.r][to.c] = piece;

      if (to.r === 0 && piece === 1) this.board[to.r][to.c] = 2;
      if (to.r === 7 && piece === -1) this.board[to.r][to.c] = -2;

      const isKingNow = Math.abs(this.board[to.r][to.c]) === 2;
      if (captures.length || !wasKing || !isKingNow) {
        this.noCaptureKing = 0;
      } else {
        this.noCaptureKing++;
        if (this.noCaptureKing >= 20) {
          alert('🤝 Empate: 20 lances de dama sem captura ou movimento de pedra.');
          this.init();
          return;
        }
      }

      this.current *= -1;
    }

    addMove(from, to, captures = []) {
      this.moveCount++;
      const playerImg = this.current === 1
        ? `<img src="img/peca-verde.png" class="chip-img" alt="Verde">`
        : `<img src="img/peca-azul.png" class="chip-img" alt="Azul">`;

      const fromNotation = this.coordsToNotation(from.r, from.c);
      const toNotation = this.coordsToNotation(to.r, to.c);

      this.moveHistory.push({
        number: this.moveCount,
        player: playerImg,
        from: fromNotation,
        to: toNotation,
        captures: captures.length
      });

      if (this.current === 1) this.scores.whiteCaptured += captures.length;
      else this.scores.blackCaptured += captures.length;

      this.updateMovesTable();
      this.updateScoresTable();
    }

    updateMovesTable() {
      this.movesTbody.innerHTML = '';
      for (const move of this.moveHistory) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${move.number}</td>
          <td>${move.player}</td>
          <td>${move.from}</td>
          <td>${move.to}${move.captures > 0 ? ` (x${move.captures})` : ''}</td>
        `;
        this.movesTbody.appendChild(row);
      }
      this.movesTbody.scrollTop = this.movesTbody.scrollHeight;
    }

    updateScoresTable() {
      this.whiteWins.textContent = this.scores.whiteWins;
      this.blackWins.textContent = this.scores.blackWins;
      this.whiteCapturesEl.textContent = this.scores.whiteCaptured;
      this.blackCapturesEl.textContent = this.scores.blackCaptured;
    }

    addWin(winner) {
      if (winner === 1) this.scores.whiteWins++;
      else this.scores.blackWins++;
      this.updateScoresTable();
    }

    update() {
      this.validMoves = this.computeValidMoves();
      this.render();
      this.updateStatus();
    }

    // ---------------- Movimentos válidos ----------------
    computeValidMoves() {
      const player = this.current;
      const allCaps = [];
      const simples = [];

      for (let r = 0; r < this.SIZE; r++) {
        for (let c = 0; c < this.SIZE; c++) {
          const val = this.board[r][c];
          if (val * player <= 0) continue;

          const isKing = Math.abs(val) === 2;

          const seqs = this.findCaptureSeq(r, c, this.board, isKing, player);
          for (const seq of seqs) {
            allCaps.push({
              from: { r, c },
              to: seq.path[seq.path.length - 1],
              captures: seq.caps,
              count: seq.caps.length
            });
          }

          const tos = this.findSimpleMoves(r, c, val, player);
          for (const to of tos) {
            simples.push({ from: { r, c }, to, captures: [], count: 0 });
          }
        }
      }

      return [...allCaps, ...simples];
    }

    findSimpleMoves(r, c, val, player) {
      const moves = [];
      const isKing = Math.abs(val) === 2;
      const dirs = isKing ? this.DIRS : this.DIRS.filter(d => d.dr === -player);

      for (const { dr, dc } of dirs) {
        if (!isKing) {
          const nr = r + dr, nc = c + dc;
          if (this.inBounds(nr, nc) && this.board[nr][nc] === 0) moves.push({ r: nr, c: nc });
        } else {
          let i = 1;
          while (true) {
            const nr = r + dr * i, nc = c + dc * i;
            if (!this.inBounds(nr, nc) || this.board[nr][nc] !== 0) break;
            moves.push({ r: nr, c: nc });
            i++;
          }
        }
      }

      return moves;
    }

    findCaptureSeq(r, c, boardState, isKing, player, visited = []) {
      const sequences = [];

      for (const { dr, dc } of this.DIRS) {
        if (!isKing) {
          const mr = r + dr, mc = c + dc;
          const lr = r + 2 * dr, lc = c + 2 * dc;
          if (this.inBounds(lr, lc) && boardState[mr][mc] * player < 0 && boardState[lr][lc] === 0) {
            const nb = boardState.map(row => row.slice());
            nb[r][c] = 0; nb[mr][mc] = 0; nb[lr][lc] = boardState[r][c];

            const nextIsKing = (lr === 0 && player === 1) || (lr === 7 && player === -1);
            const tails = this.findCaptureSeq(lr, lc, nb, nextIsKing || isKing, player, visited.concat({ r: mr, c: mc }));

            if (tails.length) {
              for (const t of tails) sequences.push({ path: [{ r, c }, ...t.path], caps: [{ r: mr, c: mc }, ...t.caps] });
            } else sequences.push({ path: [{ r, c }, { r: lr, c: lc }], caps: [{ r: mr, c: mc }] });
          }
        } else {
          let i = 1;
          while (true) {
            const mr = r + dr * i, mc = c + dc * i;
            if (!this.inBounds(mr, mc) || boardState[mr][mc] * player > 0) break;
            if (boardState[mr][mc] * player < 0) {
              let j = 1;
              while (true) {
                const lr = mr + dr * j, lc = mc + dc * j;
                if (!this.inBounds(lr, lc) || boardState[lr][lc] !== 0) break;
                const nb = boardState.map(row => row.slice());
                nb[r][c] = 0; nb[mr][mc] = 0; nb[lr][lc] = boardState[r][c];

                const tails = this.findCaptureSeq(lr, lc, nb, true, player, visited.concat({ r: mr, c: mc }));
                if (tails.length) {
                  for (const t of tails) sequences.push({ path: [{ r, c }, ...t.path], caps: [{ r: mr, c: mc }, ...t.caps] });
                } else sequences.push({ path: [{ r, c }, { r: lr, c: lc }], caps: [{ r: mr, c: mc }] });
                j++;
              }
              break;
            }
            i++;
          }
        }
      }

      return sequences.filter(seq => seq.caps.length > 0 && seq.caps.every(cap => !visited.some(v => v.r === cap.r && v.c === cap.c)));
    }
  }

  // ---------------- Inicializa o jogo ----------------
  new DamaGame(
    document.getElementById('board'),
    document.getElementById('status'),
    document.getElementById('restart'),
    playerNames
  );

});
