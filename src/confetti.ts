// Confetti animation for checkout success
// Usage: import confetti from './confetti'; confetti();
type ConfettiOptions = {
  particleCount: number;
  angle: number;
  spread: number;
  origin: { x: number; y: number };
  colors: string[];
};

declare global {
  interface Window {
    confetti?: (options: ConfettiOptions) => void;
  }
}

export default function confetti(): void {
  const duration = 1.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
  function randomInRange(min: number, max: number): number {
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
