/**
 * Rosebel Lopes — Luxury Real Estate
 * Video Autoplay Handler & Lucide Initialization
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Ensure Video Autoplay on iOS / Android mobile
  const video = document.getElementById('heroVideo');
  if (video) {
    video.muted = true;
    video.playsInline = true;
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented immediate playback, listen for first user interaction
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
});
