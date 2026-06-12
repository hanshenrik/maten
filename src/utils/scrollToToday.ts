function easeOutBack(t: number) {
  const overshoot = 1.1;
  return (
    1 + (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2)
  );
}

function scrollToToday(container: HTMLElement) {
  const today = container.querySelector("[data-today]") as HTMLElement | null;
  if (!today) return;

  const centered =
    today.offsetLeft -
    container.offsetLeft -
    container.clientWidth / 2 +
    today.offsetWidth / 2;
  const target = Math.max(
    0,
    Math.min(centered, container.scrollWidth - container.clientWidth),
  );
  const start = container.scrollLeft;
  const distance = target - start;
  const duration = 1100;
  let startTime: number | null = null;

  function step(now: number) {
    if (!startTime) startTime = now;
    const progress = Math.min((now - startTime) / duration, 1);
    container.scrollLeft = start + distance * easeOutBack(progress);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

export function initScrollToToday(selector = ".meal-scroll", delay = 200) {
  setTimeout(() => {
    document.querySelectorAll<HTMLElement>(selector).forEach(scrollToToday);
  }, delay);
}
