/**
 * ROSAP / ZENITH REALTY — 3D Frame Sequence Experience
 * High-performance Canvas Renderer with Auto-Cinematic & Drag Scrubbing
 */

document.addEventListener('DOMContentLoaded', () => {
  const TOTAL_FRAMES = 300;
  const FRAME_DIR = 'imghero';
  
  // DOM Elements
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  const canvasWrapper = document.getElementById('canvasWrapper');
  const canvasLoader = document.getElementById('canvasLoader');
  const loaderPercent = document.getElementById('loaderPercent');
  
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const scrubberTrack = document.getElementById('scrubberTrack');
  const scrubberProgress = document.getElementById('scrubberProgress');
  const scrubberThumb = document.getElementById('scrubberThumb');
  const hudCurrentFrame = document.getElementById('hudCurrentFrame');
  const resetAngleBtn = document.getElementById('resetAngleBtn');
  const exploreBtn = document.getElementById('exploreBtn');

  // State
  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let currentFrame = 0;
  let targetFrame = 0;
  let isPlaying = true;
  let playDirection = 1; // 1 = forward, -1 = reverse
  let playSpeed = 0.5; // frame increment per tick
  let isDragging = false;
  let startX = 0;
  let startFrame = 0;
  let animationId = null;

  // Format frame number (1 -> "001")
  function getFrameFilename(index) {
    const num = String(index + 1).padStart(3, '0');
    return `${FRAME_DIR}/ezgif-frame-${num}.jpg`;
  }

  // Set Canvas Dimensions (Retina Resolution)
  function resizeCanvas() {
    const rect = canvasWrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Draw immediate frame
    renderFrame(Math.round(currentFrame));
  }

  // Draw a frame to canvas with aspect cover
  function renderFrame(index) {
    const safeIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(index)));
    const img = images[safeIndex];
    
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Cover calculation
    const hRatio = cw / iw;
    const vRatio = ch / ih;
    const ratio = Math.max(hRatio, vRatio);

    const nw = iw * ratio;
    const nh = ih * ratio;
    const cx = (cw - nw) / 2;
    const cy = (ch - nh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, iw, ih, cx, cy, nw, nh);

    // Update HUD
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

  // Progressive image preloader
  function preloadImages() {
    let initialRenderDone = false;

    // 1. Load First Frame with top priority
    const firstImg = new Image();
    firstImg.src = getFrameFilename(0);
    images[0] = firstImg;
    firstImg.onload = () => {
      loadedCount++;
      if (!initialRenderDone) {
        resizeCanvas();
        renderFrame(0);
        initialRenderDone = true;
      }
    };

    // 2. Load all remaining frames
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameFilename(i);
      images[i] = img;

      img.onload = () => {
        loadedCount++;
        const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        if (loaderPercent) loaderPercent.textContent = `${pct}%`;

        // Once 15% loaded, unlock stage & fade out loader
        if (loadedCount >= 25 && canvasLoader.style.opacity !== '0') {
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

  // Smooth Render & Animation Loop
  function tick() {
    if (isPlaying && !isDragging) {
      targetFrame += playDirection * playSpeed;
      
      // Ping-pong or continuous loop
      if (targetFrame >= TOTAL_FRAMES - 1) {
        targetFrame = TOTAL_FRAMES - 1;
        playDirection = -1; // Reverse for smooth endless orbit
      } else if (targetFrame <= 0) {
        targetFrame = 0;
        playDirection = 1;
      }
    }

    // Linear Interpolation (LERP) for Butter Smooth scrub
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.01) {
      currentFrame += diff * 0.15;
    } else {
      currentFrame = targetFrame;
    }

    renderFrame(currentFrame);
    animationId = requestAnimationFrame(tick);
  }

  // Play / Pause Toggle
  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      playPauseIcon.className = 'fa-solid fa-pause';
    } else {
      playPauseIcon.className = 'fa-solid fa-play';
    }
  }

  // Scrubber Click & Drag
  function handleScrubberSeek(e) {
    const rect = scrubberTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    targetFrame = ratio * (TOTAL_FRAMES - 1);
    currentFrame = targetFrame;
    renderFrame(currentFrame);
  }

  // Mouse & Touch Drag Controls on Canvas
  function onPointerDown(e) {
    isDragging = true;
    isPlaying = false;
    playPauseIcon.className = 'fa-solid fa-play';
    startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    startFrame = targetFrame;
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const deltaX = clientX - startX;
    
    // Sensitivity: 1px drag = ~0.35 frames
    const sensitivity = (TOTAL_FRAMES / canvasWrapper.clientWidth) * 1.2;
    let newFrame = startFrame + (deltaX * sensitivity);

    // Keep within bounds
    newFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, newFrame));
    targetFrame = newFrame;
  }

  function onPointerUp() {
    isDragging = false;
  }

  // Event Listeners
  window.addEventListener('resize', resizeCanvas);

  // Prevent HUD clicks from triggering canvas drag
  const hudElement = document.querySelector('.cinematic-hud');
  if (hudElement) {
    hudElement.addEventListener('mousedown', (e) => e.stopPropagation());
    hudElement.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  }

  // Play / Pause
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });
  }

  // Reset View
  if (resetAngleBtn) {
    resetAngleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      targetFrame = 0;
      playDirection = 1;
      isPlaying = true;
      playPauseIcon.className = 'fa-solid fa-pause';
    });
  }

  // Explore button
  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
      canvasWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetFrame = (targetFrame + 100) % TOTAL_FRAMES;
    });
  }

  // Scrubber Track
  if (scrubberTrack) {
    let scrubberDragging = false;

    scrubberTrack.addEventListener('mousedown', (e) => {
      scrubberDragging = true;
      isPlaying = false;
      playPauseIcon.className = 'fa-solid fa-play';
      handleScrubberSeek(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (scrubberDragging) {
        handleScrubberSeek(e);
      }
    });

    window.addEventListener('mouseup', () => {
      scrubberDragging = false;
    });
  }

  // Canvas Drag Events
  canvasWrapper.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  canvasWrapper.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  // Subtle Scroll Interaction
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroRect = canvasWrapper.getBoundingClientRect();

    // If hero is on screen and user is actively scrolling without dragging
    if (!isDragging && heroRect.top < window.innerHeight && heroRect.bottom > 0) {
      const scrollDiff = scrollY - lastScrollY;
      if (Math.abs(scrollDiff) > 2) {
        targetFrame = (targetFrame + scrollDiff * 0.15 + TOTAL_FRAMES) % TOTAL_FRAMES;
      }
    }
    lastScrollY = scrollY;
  }, { passive: true });

  // Init
  preloadImages();
  resizeCanvas();
  tick();
});
