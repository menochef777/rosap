/**
 * ROSAP "FLOW" — FULLSCREEN 3D CANVAS EXPERIENCE
 * 300-Frame Progressive Preloader & Interactive Orbit Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  const TOTAL_FRAMES = 300;
  const FRAME_DIR = 'imghero';

  // DOM
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  const canvasContainer = document.getElementById('canvasContainer');
  const canvasLoader = document.getElementById('canvasLoader');
  const loaderPercent = document.getElementById('loaderPercent');

  const playPauseBtn = document.getElementById('playPauseBtn');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const fullscreenIcon = document.getElementById('fullscreenIcon');
  const scrubberTrack = document.getElementById('scrubberTrack');
  const scrubberProgress = document.getElementById('scrubberProgress');
  const scrubberThumb = document.getElementById('scrubberThumb');
  const hudCurrentFrame = document.getElementById('hudCurrentFrame');
  const resetAngleBtn = document.getElementById('resetAngleBtn');

  // Animation State
  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let currentFrame = 0;
  let targetFrame = 0;
  let isPlaying = true;
  let playDirection = 1;
  let playSpeed = 0.6; // Cinematic speed
  let isDragging = false;
  let startX = 0;
  let startFrame = 0;
  let animationId = null;

  function getFrameFilename(index) {
    const num = String(index + 1).padStart(3, '0');
    return `${FRAME_DIR}/ezgif-frame-${num}.jpg`;
  }

  // Fullscreen Canvas Resize
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    renderFrame(Math.round(currentFrame));
  }

  // Render Frame with Aspect Cover
  function renderFrame(index) {
    const safeIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(index)));
    const img = images[safeIndex];

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Cover math
    const hRatio = cw / iw;
    const vRatio = ch / ih;
    const ratio = Math.max(hRatio, vRatio);

    const nw = iw * ratio;
    const nh = ih * ratio;
    const cx = (cw - nw) / 2;
    const cy = (ch - nh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, iw, ih, cx, cy, nw, nh);

    updateHUD(safeIndex);
  }

  function updateHUD(frameIndex) {
    const pct = ((frameIndex / (TOTAL_FRAMES - 1)) * 100).toFixed(1);
    if (hudCurrentFrame) {
      hudCurrentFrame.textContent = String(frameIndex + 1).padStart(3, '0');
    }
    if (scrubberProgress) {
      scrubberProgress.style.width = `${pct}%`;
    }
    if (scrubberThumb) {
      scrubberThumb.style.left = `${pct}%`;
    }
  }

  // Preloader
  function preloadImages() {
    let firstLoaded = false;

    // Frame 0 priority
    const firstImg = new Image();
    firstImg.src = getFrameFilename(0);
    images[0] = firstImg;
    firstImg.onload = () => {
      loadedCount++;
      if (!firstLoaded) {
        resizeCanvas();
        renderFrame(0);
        firstLoaded = true;
      }
    };

    // Load remaining frames
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameFilename(i);
      images[i] = img;

      img.onload = () => {
        loadedCount++;
        const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        if (loaderPercent) loaderPercent.textContent = `${pct}%`;

        if (loadedCount >= 20 && canvasLoader.style.opacity !== '0') {
          canvasLoader.style.opacity = '0';
          setTimeout(() => {
            canvasLoader.style.display = 'none';
          }, 500);
        }
      };

      img.onerror = () => {
        loadedCount++;
      };
    }
  }

  // Animation Loop
  function tick() {
    if (isPlaying && !isDragging) {
      targetFrame += playDirection * playSpeed;

      if (targetFrame >= TOTAL_FRAMES - 1) {
        targetFrame = TOTAL_FRAMES - 1;
        playDirection = -1; // Smooth bounce
      } else if (targetFrame <= 0) {
        targetFrame = 0;
        playDirection = 1;
      }
    }

    // LERP smoothing
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.01) {
      currentFrame += diff * 0.15;
    } else {
      currentFrame = targetFrame;
    }

    renderFrame(currentFrame);
    animationId = requestAnimationFrame(tick);
  }

  // Controls
  function togglePlay() {
    isPlaying = !isPlaying;
    if (playPauseIcon) {
      playPauseIcon.className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }
  }

  function handleScrubber(e) {
    const rect = scrubberTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    targetFrame = ratio * (TOTAL_FRAMES - 1);
    currentFrame = targetFrame;
    renderFrame(currentFrame);
  }

  // Fullscreen
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        if (fullscreenIcon) fullscreenIcon.className = 'fa-solid fa-compress';
      } else {
        document.exitFullscreen().catch(() => {});
        if (fullscreenIcon) fullscreenIcon.className = 'fa-solid fa-expand';
      }
    });
  }

  // Mouse / Touch Drag Scrubbing
  function onPointerDown(e) {
    // Check if target is inside an interactive button/hud
    if (e.target.closest('button') || e.target.closest('.hud-track')) return;
    
    isDragging = true;
    startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    startFrame = targetFrame;
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const deltaX = clientX - startX;

    const sensitivity = (TOTAL_FRAMES / window.innerWidth) * 1.5;
    let newFrame = startFrame + (deltaX * sensitivity);
    newFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, newFrame));
    targetFrame = newFrame;
  }

  function onPointerUp() {
    isDragging = false;
  }

  // Event Listeners
  window.addEventListener('resize', resizeCanvas);

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });
  }

  if (resetAngleBtn) {
    resetAngleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      targetFrame = 0;
      playDirection = 1;
      isPlaying = true;
      if (playPauseIcon) playPauseIcon.className = 'fa-solid fa-pause';
    });
  }

  // Scrubber Drag
  if (scrubberTrack) {
    let isScrubbing = false;
    scrubberTrack.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isScrubbing = true;
      isPlaying = false;
      if (playPauseIcon) playPauseIcon.className = 'fa-solid fa-play';
      handleScrubber(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (isScrubbing) {
        handleScrubber(e);
      }
    });

    window.addEventListener('mouseup', () => {
      isScrubbing = false;
    });
  }

  // Canvas Drag (Global Window)
  window.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  window.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  // Init
  preloadImages();
  resizeCanvas();
  tick();
});
