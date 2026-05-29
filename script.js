   /* ──────────────────────────────────────────────────────────
       CONSTANTS
    ────────────────────────────────────────────────────────── */
    const WINS = [
      [0,1,2],[3,4,5],[6,7,8],   // rows
      [0,3,6],[1,4,7],[2,5,8],   // cols
      [0,4,8],[2,4,6],            // diagonals
    ];

    // SVG win-line coords in a 0–100 viewBox (matching board-grid)
    // Each entry: [x1, y1, x2, y2]
    const WIN_LINES = {
      '012': [ 6, 16.5, 94, 16.5],
      '345': [ 6, 50,   94, 50  ],
      '678': [ 6, 83.5, 94, 83.5],
      '036': [16.5,  6, 16.5, 94],
      '147': [50,    6, 50,   94],
      '258': [83.5,  6, 83.5, 94],
      '048': [ 6,    6, 94,   94],
      '246': [94,    6,  6,   94],
    };

    /* ──────────────────────────────────────────────────────────
       STATE
    ────────────────────────────────────────────────────────── */
    let grid   = Array(9).fill('');
    let player = 'x';             // current player
    let over   = false;
    let scores = { x:0, d:0, o:0 };

    /* ──────────────────────────────────────────────────────────
       DOM REFS
    ────────────────────────────────────────────────────────── */
    const boardGrid  = document.getElementById('boardGrid');
    const boardGlass = document.getElementById('boardGlass');
    const sDot       = document.getElementById('sDot');
    const sTxt       = document.getElementById('sTxt');
    const sX         = document.getElementById('sX');
    const sD         = document.getElementById('sD');
    const sO         = document.getElementById('sO');
    const newGameBtn = document.getElementById('newGameBtn');
    const themeBtn   = document.getElementById('themeBtn');

    /* ──────────────────────────────────────────────────────────
       BUILD CELLS
    ────────────────────────────────────────────────────────── */
    const cells = Array.from({ length: 9 }, (_, i) => {
      const div = document.createElement('div');
      div.className = 'cell';
      div.addEventListener('click', () => clickCell(i));
      boardGrid.appendChild(div);
      return div;
    });

    /* ──────────────────────────────────────────────────────────
       GAME LOGIC (all bugs from original fixed here)
    ────────────────────────────────────────────────────────── */
    function clickCell(i) {
      // Guard: ignore clicks on filled cells or when game is over
      if (over || grid[i] !== '') return;

      // Place mark
      grid[i] = player;
      cells[i].classList.add('taken');
      drawMark(cells[i], player);

      // ── BUG FIX #1 (original): swapTurn was called BEFORE
      //    checkGameOver, so the status briefly showed next
      //    player's turn even on winning move.
      //    Corrected: check result first, swap only if ongoing.
      const win = getWinner();

      if (win) {
        // ── BUG FIX #2 (original): when O won, result was set
        //    to "Y" instead of "O". Now we just use `player`.
        over = true;
        highlightWin(win);
        bumpScore(player);
        setStatus(`Player ${player.toUpperCase()} Wins! 🎉`, 'off');
        newGameBtn.classList.add('show');

      } else if (grid.every(v => v !== '')) {
        // Board full, no winner → draw
        over = true;
        bumpScore('d');
        setStatus("It's a Draw! 🤝", 'off');
        newGameBtn.classList.add('show');

      } else {
        // Game continues → switch player
        player = player === 'x' ? 'o' : 'x';
        setStatus(`Player ${player.toUpperCase()}'s Turn`, player);
      }
    }

    function getWinner() {
      // ── BUG FIX #3 (original): the original condition used ||
      //    for the non-empty check, which is semantically wrong
      //    (any one non-empty cell would satisfy it). Fixed: use
      //    a single clean guard: first cell !== '' covers the
      //    all-equal-empty-string false-positive automatically
      //    because equality chain also requires first === second.
      for (const combo of WINS) {
        const [a, b, c] = combo;
        if (grid[a] !== '' && grid[a] === grid[b] && grid[a] === grid[c]) {
          return combo;
        }
      }
      return null;
    }

    /* ──────────────────────────────────────────────────────────
       RENDER MARKS (SVG animated)
    ────────────────────────────────────────────────────────── */
    function drawMark(cell, p) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 60 60');
      svg.setAttribute('class', 'mark-svg');

      if (p === 'x') {
        svg.innerHTML = `
          <line class="x-ln" x1="13" y1="13" x2="47" y2="47"/>
          <line class="x-ln" x1="47" y1="13" x2="13" y2="47"/>`;
      } else {
        svg.innerHTML = `<circle class="o-arc" cx="30" cy="30" r="19"/>`;
      }

      cell.appendChild(svg);
    }

    /* ──────────────────────────────────────────────────────────
       WIN HIGHLIGHT + LINE
    ────────────────────────────────────────────────────────── */
    function highlightWin(combo) {
      combo.forEach(i => cells[i].classList.add('win'));

      const key    = combo.join('');
      const coords = WIN_LINES[key];
      if (!coords) return;

      const [x1,y1,x2,y2] = coords;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'win-svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      // No preserveAspectRatio distortion since board is always square

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'win-path');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);

      svg.appendChild(line);
      boardGlass.appendChild(svg);
    }

    /* ──────────────────────────────────────────────────────────
       STATUS + SCORE
    ────────────────────────────────────────────────────────── */
    function setStatus(text, dotState) {
      // Re-trigger animation
      sTxt.textContent = text;
      if (dotState === 'off') {
        sDot.className = 'status-dot status-dot--off';
      } else {
        sDot.className = `status-dot status-dot--${dotState}`;
      }
    }

    function bumpScore(type) {
      scores[type]++;
      const el = type === 'x' ? sX : type === 'o' ? sO : sD;
      el.textContent = scores[type];
      el.classList.remove('pop');
      void el.offsetWidth;           // reflow to restart animation
      el.classList.add('pop');
    }

    /* ──────────────────────────────────────────────────────────
       INIT / RESET
    ────────────────────────────────────────────────────────── */
    function initGame() {
      grid   = Array(9).fill('');
      player = 'x';
      over   = false;

      cells.forEach(c => {
        c.innerHTML  = '';
        c.className  = 'cell';
      });

      // Remove any win overlay SVG
      boardGlass.querySelectorAll('.win-svg').forEach(el => el.remove());

      newGameBtn.classList.remove('show');
      setStatus("Player X's Turn", 'x');
    }

    newGameBtn.addEventListener('click', initGame);

    /* ──────────────────────────────────────────────────────────
       THEME TOGGLE
    ────────────────────────────────────────────────────────── */
    let theme = localStorage.getItem('ttt-theme') || 'dark';

    function applyTheme(t) {
      theme = t;
      document.documentElement.setAttribute('data-theme', t);
      themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
    }

    themeBtn.addEventListener('click', () => {
      const next = theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('ttt-theme', next);
    });

    applyTheme(theme);

    /* ──────────────────────────────────────────────────────────
       FLOATING PARTICLES
    ────────────────────────────────────────────────────────── */
    (function spawnParticles() {
      for (let i = 0; i < 22; i++) {
        const p    = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 2.8 + 1.2;
        p.style.cssText = `
          width:${size}px; height:${size}px;
          left:${Math.random()*100}%;
          bottom:-8px;
          opacity:${(Math.random()*0.35+0.08).toFixed(2)};
          animation: rise ${(Math.random()*18+14).toFixed(1)}s
                     ${(Math.random()*-28).toFixed(1)}s linear infinite;
        `;
        document.body.appendChild(p);
      }
    })();

    /* ──────────────────────────────────────────────────────────
       KICK OFF
    ────────────────────────────────────────────────────────── */
    initGame();