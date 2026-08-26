/**
 * Ultra-Smooth Scroll-Driven Frame Sequence Animation
 * 175 High-Res PNG Frames from imghero2
 */

document.addEventListener('DOMContentLoaded', () => {
  const TOTAL_FRAMES = 175;
  const FRAME_DIR = 'imghero2';

  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');

  const images = new Array(TOTAL_FRAMES);
  let currentFrame = 0;
  let targetFrame = 0;

  function getFrameFilename(index) {
    const num = String(index + 1).padStart(3, '0');
    return `${FRAME_DIR}/frame_${num}.png`;
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    renderFrame(Math.round(currentFrame));
  }

  function renderFrame(index) {
    const safeIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(index)));
    const img = images[safeIndex];

    if (!img || !img.complete || img.naturalWidth === 0) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

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

  function updateScrollTarget() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;

    const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    targetFrame = progress * (TOTAL_FRAMES - 1);
  }

  function preloadImages() {
    let firstLoaded = false;

    // Load Frame 1 immediately
    const firstImg = new Image();
    firstImg.src = getFrameFilename(0);
    images[0] = firstImg;
    firstImg.onload = () => {
      if (!firstLoaded) {
        resizeCanvas();
        renderFrame(0);
        firstLoaded = true;
      }
    };

    // Load remaining frames in background
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameFilename(i);
      images[i] = img;
    }
  }

  // Smooth 60fps render loop with LERP interpolation
  function tick() {
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.001) {
      currentFrame += diff * 0.12; // Buttery smooth LERP
    } else {
      currentFrame = targetFrame;
    }

    renderFrame(currentFrame);
    requestAnimationFrame(tick);
  }

  // Event Listeners
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('scroll', updateScrollTarget, { passive: true });

  // Init
  preloadImages();
  resizeCanvas();
  updateScrollTarget();
  tick();
});
