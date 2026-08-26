/**
 * ROSAP — FULLSCREEN AUTOMATIC 3D LOOP ENGINE
 * Smooth 60fps frame sequence rendering across 300 frames
 */

document.addEventListener('DOMContentLoaded', () => {
  const TOTAL_FRAMES = 300;
  const FRAME_DIR = 'imghero';

  // DOM
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  const canvasLoader = document.getElementById('canvasLoader');

  // State
  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let currentFrame = 0;
  let targetFrame = 0;
  let playDirection = 1;
  const playSpeed = 0.65; // Adjust for smooth cinematic speed
  let isUserInteracting = false;
  let startX = 0;
  let startFrame = 0;

  function getFrameFilename(index) {
    const num = String(index + 1).padStart(3, '0');
    return `${FRAME_DIR}/ezgif-frame-${num}.jpg`;
  }

  // Handle Fullscreen Canvas Resize & Retina Resolution
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    renderFrame(Math.round(currentFrame));
  }

  // Render a specific frame with object-fit: cover calculation
  function renderFrame(index) {
    const safeIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(index)));
    const img = images[safeIndex];

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const hRatio = cw / iw;
    const vRatio = ch / ih;
    const ratio = Math.max(hRatio, vRatio);

    const nw = iw * ratio;
    const nh = ih * ratio;
    const cx = (cw - nw) / 2;
    const cy = (ch - nh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, iw, ih, cx, cy, nw, nh);
  }

  // Progressive Preloader
  function preloadImages() {
    let firstRenderDone = false;

    // Load Frame 1 immediately
    const firstImg = new Image();
    firstImg.src = getFrameFilename(0);
    images[0] = firstImg;
    firstImg.onload = () => {
      loadedCount++;
      if (!firstRenderDone) {
        resizeCanvas();
        renderFrame(0);
        firstRenderDone = true;
      }
    };

    // Load remaining frames
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameFilename(i);
      images[i] = img;

      img.onload = () => {
        loadedCount++;
        if (loadedCount >= 15 && canvasLoader && canvasLoader.style.opacity !== '0') {
          canvasLoader.style.opacity = '0';
          setTimeout(() => {
            if (canvasLoader) canvasLoader.style.display = 'none';
          }, 500);
        }
      };

      img.onerror = () => {
        loadedCount++;
      };
    }
  }

  // Continuous Auto-Loop Animation
  function tick() {
    if (!isUserInteracting) {
      targetFrame += playDirection * playSpeed;

      // Ping-pong smooth loop between start and end
      if (targetFrame >= TOTAL_FRAMES - 1) {
        targetFrame = TOTAL_FRAMES - 1;
        playDirection = -1;
      } else if (targetFrame <= 0) {
        targetFrame = 0;
        playDirection = 1;
      }
    }

    // LERP smoothing
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.01) {
      currentFrame += diff * 0.18;
    } else {
      currentFrame = targetFrame;
    }

    renderFrame(currentFrame);
    requestAnimationFrame(tick);
  }

  // Optional Touch / Mouse Drag interaction (resumes auto-loop on release)
  function onPointerDown(e) {
    isUserInteracting = true;
    startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    startFrame = targetFrame;
  }

  function onPointerMove(e) {
    if (!isUserInteracting) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const deltaX = clientX - startX;

    const sensitivity = (TOTAL_FRAMES / window.innerWidth) * 1.5;
    let newFrame = startFrame + (deltaX * sensitivity);
    newFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, newFrame));
    targetFrame = newFrame;
  }

  function onPointerUp() {
    isUserInteracting = false;
  }

  // Listeners
  window.addEventListener('resize', resizeCanvas);

  window.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  window.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  // Start
  preloadImages();
  resizeCanvas();
  tick();
});
