/**
 * Rosebel Lopes — React Bits <ScrollExpand /> Vanilla Engine
 * Smooth Window-Scroll Driven Frame Expansion & Locked Stage Progression
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // 2. Video Autoplay Reliability on iOS & Android
  const video = document.getElementById('heroVideo');
  if (video) {
    video.muted = true;
    video.playsInline = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const startVideo = () => {
          video.play();
          window.removeEventListener('touchstart', startVideo);
          window.removeEventListener('scroll', startVideo);
          window.removeEventListener('click', startVideo);
        };
        window.addEventListener('touchstart', startVideo, { passive: true });
        window.addEventListener('scroll', startVideo, { passive: true });
        window.addEventListener('click', startVideo, { passive: true });
      });
    }
  }

  // 3. React Bits <ScrollExpand /> Integration Engine
  const track = document.getElementById('seTrack');
  const stage = document.getElementById('seStage');
  const frame = document.getElementById('seFrame');
  const media = video;
  const scrim = document.getElementById('seScrim');
  const overlay = document.getElementById('seOverlay');
  const title = document.getElementById('seTitle');
  const hint = document.getElementById('seHint');

  if (!track || !stage || !frame || !media) return;

  // Configuration Props (matching React Bits ScrollExpand)
  const isMobile = window.innerWidth <= 768;
  const config = {
    startWidth: isMobile ? 74 : 46,       // Start width %
    startHeight: isMobile ? 68 : 58,      // Start height %
    startRadius: isMobile ? 20 : 24,      // Start corner radius in px
    endRadius: 0,                         // End corner radius in px
    mediaZoom: 1.35,                      // Zoom factor at rest
    scrollDistance: 1.4,                  // Expansion scroll distance multiplier
    holdDistance: 0.45,                   // Pinned full-bleed hold before releasing to Section 2
    smoothing: 0.08,                      // Follow smoothing
    overlayScrim: 0.55                    // Scrim gradient opacity
  };

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
    return t * t * (3 - 2 * t);
  };

  let stageH = window.innerHeight;
  let targetProgress = 0;
  let currentProgress = 0;
  let rafId = 0;
  let isRunning = false;

  function measure() {
    stageH = window.innerHeight;
    const isMob = window.innerWidth <= 768;
    config.startWidth = isMob ? 76 : 46;
    config.startHeight = isMob ? 68 : 58;

    stage.style.height = `${stageH}px`;
    // Track height determines how long Section 1 stays pinned/locked
    track.style.height = `${stageH * (1 + config.scrollDistance + config.holdDistance)}px`;
  }

  function applyProgress(p) {
    const e = smoothstep(0, 1, p);

    // Frame Expansion & Radius
    const w = config.startWidth + (100 - config.startWidth) * e;
    const h = config.startHeight + (100 - config.startHeight) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = config.startRadius + (config.endRadius - config.startRadius) * e;

    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;

    // Media Zoom
    const zoom = config.mediaZoom + (1 - config.mediaZoom) * e;
    media.style.transform = `scale(${zoom})`;

    // Scrim overlay opacity
    if (scrim) {
      scrim.style.opacity = `${config.overlayScrim * e}`;
    }

    // Resting Title (Lifts and fades away early)
    if (title) {
      const titleOut = smoothstep(0.1, 0.6, p);
      title.style.opacity = `${1 - titleOut}`;
      title.style.transform = `translate3d(0, ${-32 * titleOut}px, 0) scale(${1 + 0.05 * titleOut})`;
      title.style.pointerEvents = titleOut > 0.8 ? 'none' : 'auto';
    }

    // Scroll Hint (Fades out immediately upon first scroll)
    if (hint) {
      const hintGone = smoothstep(0, 0.15, p);
      hint.style.opacity = `${1 - hintGone}`;
      hint.style.transform = `translate3d(0, ${10 * hintGone}px, 0)`;
    }

    // Children Overlay Content (Fades and slides in once expanded to full bleed)
    if (overlay) {
      const overlayIn = smoothstep(0.72, 1, p);
      overlay.style.opacity = `${overlayIn}`;
      overlay.style.transform = `translate3d(0, ${24 * (1 - overlayIn)}px, 0)`;
      overlay.style.pointerEvents = overlayIn > 0.6 ? 'auto' : 'none';
    }
  }

  function readProgress() {
    const span = stageH * Math.max(0.01, config.scrollDistance);
    const top = track.getBoundingClientRect().top;
    return clamp(-top / span, 0, 1);
  }

  function tick() {
    const k = config.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * config.smoothing));
    currentProgress += (targetProgress - currentProgress) * k;

    if (Math.abs(targetProgress - currentProgress) < 0.0004) {
      currentProgress = targetProgress;
      isRunning = false;
    }

    applyProgress(currentProgress);

    if (isRunning) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function onScroll() {
    targetProgress = readProgress();
    if (!isRunning) {
      isRunning = true;
      rafId = requestAnimationFrame(tick);
    }
  }

  function onResize() {
    measure();
    targetProgress = readProgress();
    currentProgress = targetProgress;
    applyProgress(currentProgress);
  }

  // Setup Listeners
  measure();
  targetProgress = readProgress();
  currentProgress = targetProgress;
  applyProgress(currentProgress);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
});
