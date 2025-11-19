"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RecorderStatus = "idle" | "recording" | "processing" | "done" | "error";

const RECORDING_DURATION_MS = 10_000;

const easeInOut = (t: number) => 0.5 * (1 - Math.cos(Math.PI * Math.min(Math.max(t, 0), 1)));

function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  height: number,
  sway: number,
  time: number,
) {
  const trunkWidth = height * 0.07;
  ctx.save();
  ctx.translate(x, baseY);
  ctx.rotate(Math.sin(time * 0.6 + x) * sway);

  ctx.fillStyle = "#7a5135";
  ctx.fillRect(-trunkWidth / 2, -height, trunkWidth, height);

  const foliageRadius = height * 0.45;
  ctx.fillStyle = "#3e8139";
  ctx.beginPath();
  ctx.ellipse(0, -height, foliageRadius * 1.2, foliageRadius, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(
    -foliageRadius * 0.5,
    -height * 0.75,
    foliageRadius,
    foliageRadius * 0.7,
    0,
    0,
    Math.PI * 2,
  );
  ctx.ellipse(
    foliageRadius * 0.5,
    -height * 0.75,
    foliageRadius,
    foliageRadius * 0.7,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, time: number) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, "#81d0ef");
  skyGradient.addColorStop(1, "#f8f1d9");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  const sunAngle = ((time / 20) % 1) * Math.PI;
  const sunX = width * (0.1 + 0.8 * (time % 20) / 20);
  const sunY = height * 0.3 - Math.sin(sunAngle) * height * 0.15;
  ctx.beginPath();
  ctx.arc(sunX, sunY, height * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd166";
  ctx.fill();

  const clouds = [
    { baseX: width * 0.2, baseY: height * 0.2, speed: 0.06, scale: 1 },
    { baseX: width * 0.6, baseY: height * 0.13, speed: 0.04, scale: 0.8 },
    { baseX: width * 0.85, baseY: height * 0.18, speed: 0.05, scale: 1.1 },
  ];

  clouds.forEach((cloud, index) => {
    const offset = ((time * cloud.speed + index * 0.3) % 1) * width;
    const x = (cloud.baseX + offset) % (width + 200) - 100;
    const y = cloud.baseY + Math.sin(time * 0.5 + index) * 10;
    const baseWidth = 140 * cloud.scale;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.ellipse(x, y, baseWidth * 0.5, 35 * cloud.scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x + baseWidth * 0.3, y - 10 * cloud.scale, baseWidth * 0.4, 30 * cloud.scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x - baseWidth * 0.35, y - 5 * cloud.scale, baseWidth * 0.45, 28 * cloud.scale, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#87c665";
  ctx.fillRect(0, height * 0.55, width, height * 0.45);

  ctx.fillStyle = "#d9c3a1";
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width, height);
  ctx.quadraticCurveTo(width * 0.55, height * 0.65, width * 0.4, height * 0.62);
  ctx.quadraticCurveTo(width * 0.25, height * 0.6, 0, height * 0.68);
  ctx.closePath();
  ctx.fill();

  const trees = [
    { x: width * 0.15, height: height * 0.35, sway: 0.05 },
    { x: width * 0.3, height: height * 0.45, sway: 0.04 },
    { x: width * 0.7, height: height * 0.4, sway: 0.06 },
    { x: width * 0.85, height: height * 0.5, sway: 0.05 },
  ];

  trees.forEach((tree, index) =>
    drawTree(ctx, tree.x, height * 0.55, tree.height, tree.sway, time + index * 0.8),
  );

  ctx.save();
  ctx.translate(width * 0.38, height * 0.65);
  ctx.fillStyle = "#7a5135";
  ctx.fillRect(0, 0, width * 0.14, height * 0.05);
  ctx.fillRect(-width * 0.01, -height * 0.07, width * 0.01, height * 0.12);
  ctx.fillRect(width * 0.15, -height * 0.07, width * 0.01, height * 0.12);
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.04);
  ctx.lineTo(width * 0.14, -height * 0.04);
  ctx.lineWidth = height * 0.015;
  ctx.strokeStyle = "#623f28";
  ctx.stroke();
  ctx.restore();

  const walkerPath = easeInOut((Math.sin(time * 0.2) + 1) / 2);
  const walkerX = width * (0.15 + walkerPath * 0.5);
  const walkerY = height * 0.74 + Math.sin(time * 5) * 3;
  ctx.save();
  ctx.translate(walkerX, walkerY);
  ctx.fillStyle = "#4a90e2";
  ctx.beginPath();
  ctx.arc(0, -18, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f7d794";
  ctx.beginPath();
  ctx.arc(0, -35, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#4a90e2";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 18);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(18 * Math.sin(time * 2), 6);
  ctx.moveTo(0, -10);
  ctx.lineTo(-18 * Math.sin(time * 2), 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(12 * Math.sin(time * 2 + Math.PI / 2), 36);
  ctx.moveTo(0, 18);
  ctx.lineTo(-12 * Math.sin(time * 2 + Math.PI / 2), 36);
  ctx.stroke();
  ctx.restore();

  const birdCount = 5;
  for (let i = 0; i < birdCount; i += 1) {
    const offset = (time * 0.25 + i * 0.2) % 1;
    const x = width * (1 - offset);
    const y = height * 0.2 + Math.sin(time * 2 + i) * 20;
    ctx.strokeStyle = "rgba(40, 44, 52, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.quadraticCurveTo(x - 4, y - 8, x, y);
    ctx.quadraticCurveTo(x + 4, y - 8, x + 12, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.fillRect(25, 20, 230, 30);
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.font = "16px 'Inter', sans-serif";
  ctx.fillText("Taman Harmoni, Jakarta • 07:30 WIB", 38, 40);
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const progressRafRef = useRef<number | null>(null);

  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isSupported = useMemo(
    () => typeof window !== "undefined" && typeof MediaRecorder !== "undefined",
    [],
  );
  const supportErrorMessage = useMemo(
    () =>
      isSupported
        ? null
        : "Browser tidak mendukung perekaman video via MediaRecorder. Coba gunakan Chrome, Edge, atau Firefox versi terbaru.",
    [isSupported],
  );
  const displayedError = error ?? supportErrorMessage;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Tidak bisa mengakses context canvas.");
      return;
    }

    const setSize = () => {
      const width = container.clientWidth;
      const height = Math.max(360, width * (9 / 16));
      canvas.width = width;
      canvas.height = height;
    };

    setSize();
    window.addEventListener("resize", setSize);

    const start = performance.now();

    const render = (now: number) => {
      const elapsed = (now - start) / 1000;
      drawScene(ctx, elapsed);
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", setSize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(
    () => () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    },
    [videoUrl],
  );

  const stopExistingRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (progressRafRef.current) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isSupported) {
      return;
    }

    stopExistingRecording();

    const stream = canvas.captureStream(60);
    const options: MediaRecorderOptions = {};
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      options.mimeType = "video/webm;codecs=vp9";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
      options.mimeType = "video/webm;codecs=vp8";
    }

    try {
      const recorder = new MediaRecorder(stream, options);
      chunksRef.current = [];
      setStatus("recording");
      setProgress(0);
      setError(null);
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setStatus("processing");
        const blob = new Blob(chunksRef.current, { type: options.mimeType ?? "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setStatus("done");
        setProgress(1);
      };

      recorder.onerror = (event) => {
        console.error(event);
        setStatus("error");
        setError("Terjadi kendala saat merekam video. Coba lagi.");
      };

      recorder.start(200);
      recorderRef.current = recorder;

      const start = performance.now();
      const updateProgress = () => {
        const elapsed = performance.now() - start;
        setProgress(Math.min(elapsed / RECORDING_DURATION_MS, 1));
        if (elapsed < RECORDING_DURATION_MS) {
          progressRafRef.current = requestAnimationFrame(updateProgress);
        }
      };
      progressRafRef.current = requestAnimationFrame(updateProgress);

      setTimeout(() => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
        if (progressRafRef.current) {
          cancelAnimationFrame(progressRafRef.current);
          progressRafRef.current = null;
        }
      }, RECORDING_DURATION_MS);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("Browser tidak mengizinkan perekaman video otomatis.");
    }
  }, [isSupported, stopExistingRecording, videoUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-sky-50 to-amber-50 text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-4 pb-16 pt-20 sm:px-8 md:pb-24">
        <header className="flex flex-col gap-5 rounded-3xl bg-white/80 p-10 shadow-xl backdrop-blur">
          <div>
            <h1 className="text-4xl font-semibold text-emerald-700 sm:text-5xl">
              Generator Video Taman
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-zinc-600">
              Buat video suasana taman yang lembut dalam hitungan detik. Tekan tombol di bawah
              untuk merekam animasi taman, unduh hasilnya, dan bagikan ke mana pun.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={startRecording}
              disabled={status === "recording" || !isSupported}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              <span className="inline-flex h-3 w-3 rounded-full bg-white shadow-inner" />
              {status === "recording" ? "Sedang merekam..." : "Buat Video"}
            </button>
            <div className="flex min-w-[200px] grow items-center gap-3 rounded-full bg-emerald-100/80 px-4 py-2 text-sm text-emerald-800">
              <span className="font-semibold uppercase tracking-wide text-emerald-600">Status</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700">
                {status === "idle" && "Siap"}
                {status === "recording" && "Merekam"}
                {status === "processing" && "Memproses"}
                {status === "done" && "Selesai"}
                {status === "error" && "Gagal"}
              </span>
              {status === "recording" && (
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-emerald-200">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-emerald-500 transition-all duration-100"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
          {displayedError && (
            <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {displayedError}
            </p>
          )}
        </header>

        <section className="grid gap-6 md:grid-cols-[3fr,2fr]">
          <div
            ref={containerRef}
            className="relative aspect-video overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl sm:aspect-[16/9]"
          >
            <canvas ref={canvasRef} className="h-full w-full" />
            {status === "recording" && (
              <div className="pointer-events-none absolute inset-0 bg-emerald-900/20 backdrop-blur-[1px]" />
            )}
          </div>
          <div className="flex flex-col gap-6 rounded-3xl bg-white/70 p-8 shadow-lg backdrop-blur">
            <div>
              <h2 className="text-xl font-semibold text-emerald-700">Cara Kerja</h2>
              <ol className="mt-3 space-y-4 text-sm text-zinc-600">
                <li>
                  1. Klik <strong>Buat Video</strong> untuk memulai perekaman animasi taman selama 10
                  detik.
                </li>
                <li>
                  2. Setelah selesai, pratinjau video langsung di bawah dan unduh sebagai file{" "}
                  <code>.webm</code>.
                </li>
                <li>
                  3. Gunakan video untuk latar suasana, presentasi, atau inspirasi konten.
                </li>
              </ol>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-emerald-700">Tips</h2>
              <ul className="mt-3 space-y-3 text-sm text-zinc-600">
                <li>
                  🌿 Klik ulang kapan pun untuk menghasilkan variasi gerakan matahari, awan, dan
                  burung.
                </li>
                <li>
                  🔊 Tambahkan musik favoritmu saat mengedit video untuk suasana lebih hidup.
                </li>
                <li>💡 Video cocok sebagai latar belakang layar, stories, atau ambient meeting.</li>
              </ul>
            </div>
          </div>
        </section>

        {videoUrl && (
          <section className="rounded-3xl bg-white/80 p-8 shadow-xl backdrop-blur">
            <h2 className="text-2xl font-semibold text-emerald-700">Hasil Video</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Video tersimpan lokal di browser. Simpan dengan tombol unduh atau bagikan langsung.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-[2fr,1fr]">
              <video
                src={videoUrl}
                controls
                className="w-full rounded-2xl border border-emerald-100 shadow-lg"
              />
              <div className="flex flex-col items-start gap-4 rounded-2xl bg-emerald-50 p-6 text-sm text-emerald-800">
                <p className="font-medium text-emerald-700">Unduh &amp; Bagikan</p>
                <a
                  href={videoUrl}
                  download="video-taman.webm"
                  className="rounded-full bg-emerald-600 px-5 py-2 font-medium text-white transition hover:bg-emerald-500"
                >
                  Unduh Video (.webm)
                </a>
                <p>
                  Format <code>.webm</code> kompatibel dengan browser modern. Untuk platform lain,
                  konversi ke <code>.mp4</code> memakai konverter daring favoritmu.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
