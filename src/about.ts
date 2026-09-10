import { inject } from '@vercel/analytics';

// Keep page-view tracking consistent with the calculator, without loading React.
inject();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const connection = (
  navigator as Navigator & { connection?: { saveData?: boolean } }
).connection;

document
  .querySelectorAll<HTMLVideoElement>('video[data-demo]')
  .forEach((video) => {
    const button = document.querySelector<HTMLButtonElement>(
      `button[data-video="${video.id}"]`
    );
    if (!button) return;

    let visible = false;
    let playbackChoice: boolean | null = null;
    const syncPlayback = () => {
      const wantsPlayback =
        playbackChoice ?? (!reducedMotion.matches && !connection?.saveData);
      if (visible && !document.hidden && wantsPlayback) {
        void video.play().catch(() => {
          button.textContent = 'Play animation';
        });
      } else {
        video.pause();
      }
    };

    // Native controls remain available when JavaScript is disabled.
    video.controls = false;
    button.hidden = false;
    button.addEventListener('click', () => {
      playbackChoice = video.paused;
      syncPlayback();
    });
    video.addEventListener('play', () => {
      button.textContent = 'Pause animation';
    });
    video.addEventListener('pause', () => {
      button.textContent = 'Play animation';
    });
    reducedMotion.addEventListener('change', () => {
      playbackChoice = null;
      syncPlayback();
    });
    document.addEventListener('visibilitychange', syncPlayback);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.2 }
    );
    observer.observe(video);
  });
