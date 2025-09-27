const LEVEL1_TARGET = 5;

const character = document.getElementById('character');
const block = document.getElementById('block');
const scoreSpan = document.getElementById('scoreSpan');
const toast = document.getElementById('toast');

let scoreCounter = 0;       // internal counter
let displayScore = 0;       // displayed (floor)
let alive = true;

// Jump handler
function jump(){
  if(!character) return;
  if(character.classList.contains('jump')) return;
  character.classList.add('jump');
  setTimeout(()=> character.classList.remove('jump'), 400);
}

// showToast used across pages
function showToast(message, ms = 1600){
  if(toast){
    toast.textContent = message;
    toast.classList.add('show');
    toast.style.opacity = 1;
    setTimeout(()=> {
      toast.classList.remove('show');
      toast.style.opacity = 0;
    }, ms);
  } else {
    console.log('Toast:', message);
  }
}

// If user taps/clicks, jump
document.addEventListener('click', function(e){
  // avoid catching clicks on buttons by checking tag
  if(e.target.tagName.toLowerCase() === 'button' || e.target.tagName.toLowerCase() === 'a') return;
  jump();
});

// Collision & scoring loop
const loop = setInterval(()=> {
  if(!alive) return;
  scoreCounter += 1;
  displayScore = Math.floor(scoreCounter / 100);
  scoreSpan.textContent = displayScore;

  // read positions
  const charBottom = parseInt(window.getComputedStyle(character).getPropertyValue('bottom'));
  const blockRight = parseInt(window.getComputedStyle(block).getPropertyValue('right'));

  // collision detection: when the block passes near the character and character is low
  // block's right increases from -60 to beyond game width due to CSS animation; compute approximate overlap
  // We approximate blockLeft = gameWidth - blockRight - blockWidth
  // Simpler: check computed transform proximity by reading getBoundingClientRect
  const cb = character.getBoundingClientRect();
  const bb = block.getBoundingClientRect();

  const overlapping = !(cb.right < bb.left || cb.left > bb.right || cb.bottom < bb.top || cb.top > bb.bottom);

  if(overlapping && cb.bottom >= bb.bottom - 12){ // if they're both near ground (character not in jump)
    // Game over: reset (but allow retries)
    alive = false;
    showToast('Game Over — Try again. Score: ' + displayScore, 1800);
    // pause block animation briefly and then reset
    block.style.animationPlayState = 'paused';
    setTimeout(()=> {
      // reset counters
      scoreCounter = 0;
      displayScore = 0;
      scoreSpan.textContent = 0;
      block.style.animation = 'none';
      // force reflow to restart CSS animation cleanly
      void block.offsetWidth;
      block.style.animation = '';
      block.style.animation = 'blockMove 1s linear infinite';
      block.style.animationPlayState = '';
      alive = true;
    }, 900);
    return;
  }

  // Level complete condition
  if(displayScore >= LEVEL1_TARGET){
    // stop the loop, show message, go to next level smoothly
    clearInterval(loop);
    showToast('Nice! Level complete — loading Level 2...', 1400);
    block.style.animationPlayState = 'paused';
    setTimeout(()=> {
      document.documentElement.style.setProperty('--page-opacity', 0);
      setTimeout(()=> window.location.href = 'level2.html', 420);
    }, 1200);
  }

}, 10);
