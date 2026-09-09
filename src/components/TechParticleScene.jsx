import { useEffect, useRef } from "react";

// One canvas, one animation loop. The particles assemble into device silhouettes.
export default function TechParticleScene() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0,
      height = 0,
      frame = 0,
      visible = true,
      lastFrame = 0;
    let elapsed = 0;
    const sample = document.createElement("canvas");
    sample.width = sample.height = 400;
    const pen = sample.getContext("2d", { willReadFrequently: true });
    function shape(kind) {
      pen.clearRect(0, 0, 400, 400);
      pen.strokeStyle = "#fff";
      pen.fillStyle = "#fff";
      pen.lineWidth = 2.8;
      pen.lineCap = "round";
      const line = (x, y, x2, y2) => {
        pen.beginPath();
        pen.moveTo(x, y);
        pen.lineTo(x2, y2);
        pen.stroke();
      };
      if (kind === 0) {
        pen.strokeRect(110, 110, 180, 180);
        pen.strokeRect(125, 125, 150, 150);
        pen.strokeRect(150, 150, 100, 100);
        for (let p = 125; p <= 275; p += 15) {
          line(p, 85, p, 110);
          line(p, 290, p, 315);
          line(85, p, 110, p);
          line(290, p, 315, p);
        }
        for (let y = 166; y < 242; y += 12)
          for (let x = 166; x < 242; x += 12) {
            pen.fillRect(x, y, 2, 2);
          }
        for (let i = 0; i < 4; i++) {
          const d = i * 16;
          line(85, 145 + d, 50 - d * 0.4, 145 + d);
          line(50 - d * 0.4, 145 + d, 50 - d * 0.4, 70 + d * 0.2);
          line(315, 225 - d, 352 + d * 0.4, 225 - d);
          line(352 + d * 0.4, 225 - d, 352 + d * 0.4, 330 - d * 0.2);
        }
      } else if (kind === 1) {
        pen.beginPath();
        pen.roundRect(116, 45, 168, 310, 23);
        pen.stroke();
        pen.beginPath();
        pen.roundRect(128, 74, 144, 209, 9);
        pen.stroke();
        line(178, 60, 222, 60);
        pen.beginPath();
        pen.arc(200, 320, 13, 0, Math.PI * 2);
        pen.stroke();
        for (let y = 108; y < 240; y += 48)
          for (let x = 150; x < 245; x += 40) {
            pen.beginPath();
            pen.roundRect(x, y, 23, 23, 5);
            pen.stroke();
          }
      } else if (kind === 2) {
        // Terminal window and prompt.
        pen.beginPath();
        pen.roundRect(48, 85, 304, 230, 12);
        pen.stroke();
        line(48, 121, 352, 121);
        for (let x = 67; x < 106; x += 14) {
          pen.beginPath();
          pen.arc(x, 104, 3, 0, Math.PI * 2);
          pen.stroke();
        }
        line(83, 163, 111, 182);
        line(111, 182, 83, 201);
        line(131, 202, 180, 202);
        line(83, 243, 238, 243);
        line(83, 263, 193, 263);
      } else if (kind === 3) {
        // An open flip phone, with screen, hinge, and keypad.
        pen.beginPath();
        pen.roundRect(122, 28, 156, 165, 18);
        pen.stroke();
        pen.strokeRect(136, 53, 128, 113);
        line(183, 40, 217, 40);
        pen.beginPath();
        pen.roundRect(116, 208, 168, 166, 18);
        pen.stroke();
        pen.beginPath();
        pen.roundRect(125, 191, 150, 18, 7);
        pen.stroke();
        pen.beginPath();
        pen.arc(200, 235, 15, 0, Math.PI * 2);
        pen.stroke();
        for (let y = 270; y < 352; y += 29)
          for (let x = 137; x < 265; x += 44) {
            pen.beginPath();
            pen.roundRect(x, y, 36, 18, 5);
            pen.stroke();
          }
        line(165, 94, 200, 127);
        line(200, 127, 235, 82);
      } else if (kind === 4) {
        // Laptop with code on screen.
        pen.beginPath();
        pen.roundRect(76, 68, 248, 206, 12);
        pen.stroke();
        pen.strokeRect(88, 83, 224, 172);
        line(76, 275, 40, 321);
        line(40, 321, 360, 321);
        line(360, 321, 324, 275);
        line(40, 321, 56, 334);
        line(56, 334, 344, 334);
        line(344, 334, 360, 321);
        line(129, 140, 108, 162);
        line(108, 162, 129, 184);
        line(271, 140, 292, 162);
        line(292, 162, 271, 184);
        line(180, 188, 213, 133);
        line(173, 308, 227, 308);
      } else if (kind === 5) {
        // Headphones.
        pen.beginPath();
        pen.arc(200, 185, 118, Math.PI, 0);
        pen.stroke();
        pen.beginPath();
        pen.arc(200, 185, 98, Math.PI, 0);
        pen.stroke();
        line(82, 185, 82, 254);
        line(318, 185, 318, 254);
        pen.beginPath();
        pen.roundRect(68, 186, 61, 125, 20);
        pen.stroke();
        pen.beginPath();
        pen.roundRect(271, 186, 61, 125, 20);
        pen.stroke();
        line(113, 210, 113, 286);
        line(287, 210, 287, 286);
        pen.beginPath();
        pen.moveTo(301, 311);
        pen.quadraticCurveTo(297, 350, 221, 348);
        pen.stroke();
        pen.beginPath();
        pen.roundRect(182, 337, 45, 18, 8);
        pen.stroke();
      } else {
        const nodes = [
          [200, 200],
          [80, 90],
          [320, 90],
          [80, 310],
          [320, 310],
          [200, 55],
          [345, 200],
          [200, 345],
          [55, 200],
        ];
        nodes.slice(1).forEach(([x, y], i) => {
          line(200, 200, (200 + x) / 2, 200);
          line((200 + x) / 2, 200, (200 + x) / 2, y);
          line((200 + x) / 2, y, x, y);
          pen.beginPath();
          pen.arc(x, y, i % 2 ? 12 : 18, 0, Math.PI * 2);
          pen.stroke();
        });
        pen.strokeRect(174, 174, 52, 52);
        pen.strokeRect(182, 182, 36, 36);
      }
      const pixels = pen.getImageData(0, 0, 400, 400).data,
        points = [];
      for (let y = 0; y < 400; y += 4)
        for (let x = 0; x < 400; x += 4)
          if (pixels[(y * 400 + x) * 4 + 3] > 100)
            points.push({ x: (x - 200) / 400, y: (y - 200) / 400 });
      return points;
    }
    const count = 1100;
    const shapeNames = [
      "microchip",
      "terminal",
      "phone",
      "flip-phone",
      "laptop",
      "headphones",
      "network",
    ];
    // Resample every silhouette evenly. A modulo stride can skip most of a
    // shape when its point count shares a factor with that stride.
    const shapes = [0, 2, 1, 3, 4, 5, 6].map((kind) => {
      const points = shape(kind);
      return Array.from(
        { length: count },
        (_, i) => points[Math.floor((i * points.length) / count)],
      );
    });
    const particles = Array.from({ length: count }, (_, i) => ({
      x: Math.sin(i * 24.17) * 0.7,
      y: Math.cos(i * 13.57) * 0.6,
      z: Math.sin(i * 6.3),
      seed: i * 1.618,
    }));
    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (motion.matches) draw(0);
    }
    function draw(delta) {
      elapsed += delta;
      const t = elapsed / 1000;
      ctx.clearRect(0, 0, width, height);
      const small = width < 760,
        size = small ? 330 : Math.min(600, width * 0.46),
        cx = small ? width * 0.66 : width * 0.78,
        cy = small ? height * 0.68 : height * 0.44;
      const cycle = 3;
      const step = motion.matches ? 0 : Math.floor(t / cycle) % shapes.length,
        next = (step + 1) % shapes.length;
      const phase = (t % cycle) / cycle;
      let morph = motion.matches ? 0 : phase;
      canvas.dataset.shape = shapeNames[step];
      canvas.dataset.nextShape = shapeNames[next];
      morph = morph * morph * (3 - 2 * morph);
      const rotation = motion.matches
        ? -0.18
        : Math.sin(t * 0.24) * 0.18 - 0.13;
      const hue = motion.matches ? 200 : 196 + Math.sin(t * 0.23) * 15;
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.66);
      halo.addColorStop(0, `hsla(${hue}, 80%, 56%, .10)`);
      halo.addColorStop(1, "rgba(61,172,233,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
      // Quiet background traffic travels along a few circuit routes.
      ctx.strokeStyle = "rgba(97,180,222,.08)";
      ctx.lineWidth = 1;
      for (let j = 0; j < 7; j++) {
        const y = height * (0.1 + j * 0.13);
        ctx.beginPath();
        ctx.moveTo(width * 0.38, y);
        ctx.lineTo(width * 0.5 + j * 12, y);
        ctx.lineTo(width * 0.56 + j * 12, y + 48);
        ctx.lineTo(width, y + 48);
        ctx.stroke();
      }
      for (let i = 0; i < 95; i++) {
        const x = ((i * 137.8 + t * (4 + (i % 4))) % (width + 80)) - 40,
          y = (i * 83.19) % height;
        const alpha = 0.08 + (Math.sin(t * 0.7 + i) + 1) * 0.1;
        ctx.fillStyle = `rgba(130,209,248,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, i % 9 === 0 ? 1.7 : 0.7, 0, 7);
        ctx.fill();
      }
      particles.forEach((p, i) => {
        const a = shapes[step][i],
          b = shapes[next][i];
        const tx = a.x + (b.x - a.x) * morph,
          ty = a.y + (b.y - a.y) * morph;
        const scatter = motion.matches ? 0 : Math.sin(morph * Math.PI) * 0.025;
        const targetX = tx + Math.sin(p.seed + t * 0.5) * scatter,
          targetY = ty + Math.cos(p.seed + t * 0.4) * scatter;
        const lerp = motion.matches ? 1 : Math.min(1, delta / 65);
        p.x += (targetX - p.x) * lerp;
        p.y += (targetY - p.y) * lerp;
        const x =
          cx + (p.x * Math.cos(rotation) - p.y * Math.sin(rotation)) * size;
        const y =
          cy +
          (p.x * Math.sin(rotation) + p.y * Math.cos(rotation)) * size * 0.91;
        const shimmer = 0.58 + (Math.sin(t * 1.1 + p.seed) + 1) * 0.23;
        ctx.fillStyle =
          i % 8 === 0
            ? `rgba(203,242,255,${shimmer})`
            : `hsla(${hue}, 86%, 73%, ${shimmer * 0.8})`;
        ctx.beginPath();
        ctx.arc(x, y, i % 13 === 0 ? 1.75 : 1.05, 0, 7);
        ctx.fill();
      });
      // A few packets emerge from the device and flow towards the edge.
      for (let k = 0; k < 6; k++) {
        const progress = motion.matches ? k / 6 : (t * 0.11 + k / 6) % 1;
        const x = cx - size * 0.4 + progress * size * 0.8,
          y = cy + Math.sin(k * 1.4) * size * 0.49;
        ctx.fillStyle = `rgba(144,220,255,${Math.sin(progress * Math.PI) * 0.65})`;
        ctx.fillRect(x, y, 3, 1);
      }
    }
    function tick(time) {
      if (visible && !document.hidden && time - lastFrame > 28) {
        const delta = lastFrame ? time - lastFrame : 30;
        lastFrame = time;
        draw(delta);
      }
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      lastFrame = 0;
      if (motion.matches) draw(0);
      else frame = requestAnimationFrame(tick);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        lastFrame = 0;
      },
      { rootMargin: "100px" },
    );
    visibility.observe(canvas);
    motion.addEventListener("change", sync);
    resize();
    sync();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      motion.removeEventListener("change", sync);
    };
  }, []);
  return (
    <canvas
      className="tech-particle-scene"
      ref={canvasRef}
      aria-hidden="true"
    />
  );
}
