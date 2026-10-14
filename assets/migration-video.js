(() => {
  const video = document.querySelector('#migration-video');
  const toggle = document.querySelector('.migration-toggle');
  if (!video || !toggle) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let pausedByUser = reducedMotion.matches;
  let visible = false;
  video.muted = true;
  video.controls = false;
  toggle.hidden = false;

  function updateLabel() {
    toggle.textContent = video.paused ? 'Play animation' : 'Pause animation';
  }
  function syncPlayback() {
    if (visible && !document.hidden && !pausedByUser) {
      video.play().catch(updateLabel);
    } else {
      video.pause();
    }
    updateLabel();
  }
  toggle.addEventListener('click', () => {
    pausedByUser = !video.paused;
    syncPlayback();
  });
  video.addEventListener('play', updateLabel);
  video.addEventListener('pause', updateLabel);
  video.addEventListener('error', () => {
    toggle.hidden = true;
    video.controls = true;
  });
  reducedMotion.addEventListener('change', () => {
    pausedByUser = reducedMotion.matches;
    syncPlayback();
    if (reducedMotion.matches) video.load();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncPlayback();
  }, { threshold: 0.1 }).observe(video);
  updateLabel();
})();
