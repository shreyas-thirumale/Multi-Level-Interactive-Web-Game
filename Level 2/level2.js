// level2.js (reworked, replace existing file)
// Level 2: Fall game (robust spawn loop + rAF physics)
// Goal: survive/past 15 blocks (score >= 15)

const LEVEL2_TARGET = 15;

const character = document.getElementById('character');
const game = document.getElementById('game');
const progressEl = document.getElementById('progress');
const toast = document.getElementById('toast');

// runtime state
let blocks = []; // array of { blockEl, holeEl, top, holeLeft }
let lastSpawnMs = 0;
const spawnInterval = 900;       // ms between new rows
const blockSpeed = 120;          // px per second (upwards)
const gravity = 260;             // px per second (downwards)
let score = 0;
let gameOver = false;
let keys = { left: false, right: false };

// initial placement of character (center-ish)
character.style.left = Math.floor((game.clientWidth - character.offsetWidth) / 2) + 'px';
// set initial vertical position similar to your prior design
character.style.top = Math.min(400, game.clientHeight - 120) + 'px';

// create a block+hole row. optionalTop in px if you want a staggered starting row
function spawnBlock(optionalTop) {
  const block = document.createElement('div');
  block.className = 'block';
  const hole = document.createElement('div');
  hole.className = 'hole';

  // Determine new block top position
  const minGap = 140; // minimum vertical spacing between blocks

  // Calculate top based on last block or provided optionalTop
  let startTop;
  if (typeof optionalTop === 'number') {
    startTop = optionalTop;
  } else if (blocks.length > 0) {
    const lastBlock = blocks[blocks.length - 1];
    startTop = lastBlock.top + minGap;
  } else {
    startTop = game.clientHeight + 40;
  }

  block.style.top = startTop + 'px';
  hole.style.top = startTop + 'px';

  // Calculate hole left based on previous hole to avoid wild jumps
  let holeLeft;
  const holeWidth = 40;
  const maxLeft = game.clientWidth - holeWidth;
  const maxOffset = 100; // max horizontal hole shift per block

  if (blocks.length > 0) {
    const lastHoleLeft = blocks[blocks.length - 1].holeLeft;
    // Random offset within [-maxOffset, maxOffset]
    const offset = Math.floor(Math.random() * (maxOffset * 2 + 1)) - maxOffset;
    holeLeft = lastHoleLeft + offset;

    // Clamp inside boundaries
    holeLeft = Math.min(Math.max(holeLeft, 10), maxLeft - 10);
  } else {
    holeLeft = Math.floor(Math.random() * (maxLeft + 1));
  }

  hole.style.left = holeLeft + 'px';

  game.appendChild(block);
  game.appendChild(hole);

  blocks.push({ blockEl: block, holeEl: hole, top: startTop, holeLeft: holeLeft });
}

// simple toast helper (the HTML hint button expects this)
function showToast(message, ms = 1400) {
  if (!toast) { console.log(message); return; }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), ms);
}

// spawn a small initial buffer but STAGGER them so score does not jump
// this gives players something to react to immediately without pre-inflating score
for (let i = 0; i < 4; i++) {
  spawnBlock(game.clientHeight + 40 + i * 140);
}

// core update function using delta-time (dt in ms)
let lastTime = performance.now();
function update(now) {
  if (gameOver) return;

  const dt = now - lastTime;
  lastTime = now;

  // spawn timing
  lastSpawnMs += dt;
  if (lastSpawnMs >= spawnInterval) {
    spawnBlock();
    lastSpawnMs = 0;
  }

  // Move blocks upward and remove those past top
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    b.top -= blockSpeed * (dt / 1000); // px
    b.blockEl.style.top = b.top + 'px';
    b.holeEl.style.top = b.top + 'px';

    // once the block fully moves off the top, remove it and count as 1 progressed row
    if (b.top + 20 < 0) {
      b.blockEl.remove();
      b.holeEl.remove();
      blocks.splice(i, 1);
      score++;
      progressEl.textContent = score;
      if (score >= LEVEL2_TARGET) {
        winLevel();
        return;
      }
    }
  }

  // horizontal player movement (keys)
  let charLeft = parseFloat(character.style.left);
  if (keys.left) charLeft = Math.max(0, charLeft - 220 * (dt / 1000));
  if (keys.right) charLeft = Math.min(game.clientWidth - character.offsetWidth, charLeft + 220 * (dt / 1000));
  character.style.left = charLeft + 'px';

  // vertical physics: determine whether character is supported by a solid part of the block
  let charTop = parseFloat(character.style.top);
  const charBottom = charTop + character.offsetHeight;
  const charCenterX = charLeft + (character.offsetWidth / 2);

  let supported = false;

  // check the block rows that are near the character's vertical position
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    // consider the block "at character level" when its top is within a small band near the character's bottom
    if (b.top < (charBottom + 12) && b.top > (charBottom - 22)) {
      // if the character center is inside the hole, they are NOT supported (they fall)
      if (charCenterX >= b.holeLeft && charCenterX <= b.holeLeft + 40) {
        supported = false; // over hole -> will fall
      } else {
        supported = true;  // over solid -> supported
      }
      break; // only one block can be at the level at a time
    }
  }

  // apply vertical motion
  if (supported) {
    // move character up together with the block (simulate being carried)
    charTop -= blockSpeed * (dt / 1000);
  } else {
    // gravity -> character falls downward
    charTop += gravity * (dt / 1000);
  }

  // clamp to bounds; if the player moves past the top, it's game over
  const maxTop = game.clientHeight - character.offsetHeight;
  if (charTop > maxTop) charTop = maxTop;
  if (charTop < -36) {
    // off the top = lose
    gameOver = true;
    showToast('Game over! Score: ' + score, 1400);
    setTimeout(() => location.reload(), 900);
    return;
  }

  character.style.top = charTop + 'px';
}

// rAF loop
function loop(now) {
  update(now);
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// keyboard handlers for smooth movement
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
});
document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

// level win handler
function winLevel() {
  gameOver = true;
  showToast('Great! You reached ' + LEVEL2_TARGET + ' — loading Level 3...', 1200);
  setTimeout(() => {
    document.documentElement.style.setProperty('--page-opacity', 0);
    setTimeout(() => window.location.href = 'level3.html', 420);
  }, 1200);
}
