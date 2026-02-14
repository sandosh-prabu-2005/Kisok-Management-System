// Confetti animation for checkout success
// Usage: import confetti from './confetti.js'; confetti();
export default function confetti() {
  const duration = 1.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }
  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 40 * (timeLeft / duration);
    window.confetti &&
      window.confetti({
        particleCount,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: Math.random(), y: Math.random() * 0.2 + 0.6 },
        colors: ["#ff6a88", "#ffb86c", "#232526", "#ffecd2"],
      });
  }, 200);
}
