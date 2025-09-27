const TARGET_STACKS = 10;

const board = document.getElementById('board');
const stacksEl = document.getElementById('stacks');
const stopBtn = document.getElementById('stopBtn');
const toast = document.getElementById('toast');

let currentIndex = 1; // which slider is moving (1-based)
let totalSliders = 20; // number of sliders in DOM
let successfulStacks = 0;
let moving = true;

// Movement parameters
let direction = 1; // 1 => move right, -1 => move left
let speed = 2.0; // px per frame (will be adjusted slightly)
let sliderWidth = null; // width in px of current slider area

// initialize sliders array
const sliders = [];
for(let i=1;i<=totalSliders;i++){
  const s = document.getElementById('slider' + i);
  if(s) sliders.push(s);
}

// initial positions and widths
const boardWidth = board.clientWidth - 20; // consider padding
sliders.forEach((sl, idx) => {
  sl.style.left = '0px';
  sl.style.width = (160) + 'px';
  // slightly vary color for depth
  sl.style.background = `linear-gradient(90deg, rgba(${255-idx*4},120,120,1), rgba(${255-idx*6},80,80,1))`;
});

// topmost visible slider is slider1
let activeSlider = sliders[0];
let prevLeft = 0;

// animation loop using rAF for smoothness
let lastFrame = performance.now();
function animate(now){
  const dt = now - lastFrame;
  lastFrame = now;
  if(moving && activeSlider){
    // move current active slider horizontally
    let curLeft = parseFloat(activeSlider.style.left || 0);
    curLeft += direction * (speed * (dt / 16.67)); // normalized to ~60fps
    // bounce boundaries (board width minus slider width)
    const maxLeft = Math.max(0, board.clientWidth - activeSlider.offsetWidth - 20);
    if(curLeft <= 0){
      curLeft = 0;
      direction = 1;
    } else if(curLeft >= maxLeft){
      curLeft = maxLeft;
      direction = -1;
    }
    activeSlider.style.left = curLeft + 'px';
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// show toast helper
function showToast(msg, ms = 1200){
  if(toast){
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=> toast.classList.remove('show'), ms);
  }
}

// Stop button handler: freeze current slider and evaluate overlap with previous placed slider
stopBtn.addEventListener('click', () => {
  if(!activeSlider) return;
  // pause movement momentarily
  moving = false;
  const left = parseFloat(activeSlider.style.left || 0);
  // if it's the first stack, accept any position
  if(currentIndex === 1){
    successfulStacks++;
    finalizeStack();
    return;
  }

  // get previous slider (the one that was stacked on before)
  const prevSlider = sliders[currentIndex - 2]; // zero-based
  const prevLeft = parseFloat(prevSlider.style.left || 0);
  const prevWidth = prevSlider.offsetWidth;
  const curWidth = activeSlider.offsetWidth;

  // compute overlap region (intersection on x-axis)
  const overlapLeft = Math.max(prevLeft, left);
  const overlapRight = Math.min(prevLeft + prevWidth, left + curWidth);
  const overlap = Math.max(0, overlapRight - overlapLeft);

  if(overlap <= 0){
    // no overlap -> fail the final run
    showToast('No overlap — You lost on final level', 1500);
    setTimeout(()=> {
      document.documentElement.style.setProperty('--page-opacity', 0);
      setTimeout(()=> window.location.href = 'lose.html', 420);
    }, 1200);
    return;
  }

  // Shrink the active slider width to the overlap
  activeSlider.style.left = overlapLeft + 'px';
  activeSlider.style.width = overlap + 'px';
  // Also shrink the previous to the same width for consistent stacking
  prevSlider.style.left = overlapLeft + 'px';
  prevSlider.style.width = overlap + 'px';

  // increase success count
  successfulStacks++;
  finalizeStack();
});

// finalize a successful stack: make the next slider active or win if reached target
function finalizeStack(){
  stacksEl.textContent = successfulStacks;
  // make the just-stacked slider static and visible (it already is)
  // prepare the next active slider
  currentIndex++;
  if(successfulStacks >= TARGET_STACKS){
    showToast('You Win! Redirecting to Win screen...', 1400);
    setTimeout(()=> {
      document.documentElement.style.setProperty('--page-opacity', 0);
      setTimeout(()=> window.location.href = 'win.html', 420);
    }, 1200);
    return;
  }

  if(currentIndex > sliders.length){
    // ran out of sliders -> treat as fail
    showToast('Out of sliders — you lost', 1400);
    setTimeout(()=> {
      document.documentElement.style.setProperty('--page-opacity', 0);
      setTimeout(()=> window.location.href = 'lose.html', 420);
    }, 1200);
    return;
  }

  // set next slider to same left and width as the one below (this replicates stacking)
  const nextSlider = sliders[currentIndex - 1];
  const prevSlider = sliders[currentIndex - 2];
  nextSlider.style.left = prevSlider.style.left;
  nextSlider.style.width = prevSlider.style.width;

  // slightly increase speed for difficulty
  speed = Math.min(6, speed + 0.2);

  // set active slider and resume
  activeSlider = nextSlider;
  moving = true;
}

// if user presses space, treat as stop
document.addEventListener('keydown', (e) => {
  if(e.code === 'Space'){
    e.preventDefault();
    stopBtn.click();
  }
});
