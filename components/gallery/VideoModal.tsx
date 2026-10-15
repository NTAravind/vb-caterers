"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/site/icons";
import { formatDuration } from "@/lib/gallery/format";
import { mediaUrl, type GalleryItem } from "@/lib/gallery/types";
import { Modal } from "./Modal";

function formatClock(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "0:00";
  return formatDuration(seconds * 1000) ?? "0:00";
}

/**
 * On-site video player with the site's own controls.
 *
 * Flow: the branded HTML5 player is tried first against the media endpoint
 * (which streams from Drive with Range support). If the browser fires an
 * `error` — codec, or the storage endpoint refusing partial content — the
 * modal falls back to the storage provider's embedded viewer. We never claim a
 * video is playable until the media actually loads.
 */
export function VideoModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"preparing" | "playable" | "fallback">("preparing");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(
    item.durationMs ? item.durationMs / 1000 : null,
  );
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const source = mediaUrl(item.id, "full");
  const poster = mediaUrl(item.id, "thumb");

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, []);

  const seekBy = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(video.currentTime + delta, 0), video.duration);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (event.key === " " && tag !== "BUTTON" && tag !== "INPUT") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowLeft" && tag !== "INPUT") {
        event.preventDefault();
        seekBy(-5);
      } else if (event.key === "ArrowRight" && tag !== "INPUT") {
        event.preventDefault();
        seekBy(5);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [seekBy, togglePlay]);

  useEffect(() => {
    function onFullscreenChange() {
      setFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    if (container.requestFullscreen) {
      void container.requestFullscreen().catch(() => setFullscreen(false));
      return;
    }
    // iOS Safari exposes fullscreen on the video element only.
    const legacy = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    legacy.webkitEnterFullscreen?.();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
  }, []);

  const activeDuration = duration ?? (item.durationMs ? item.durationMs / 1000 : null);
  const progress = activeDuration ? (currentTime / activeDuration) * 100 : 0;

  return (
    <Modal
      label={item.name}
      onClose={onClose}
      footer={
        <div className="mx-auto max-w-2xl px-14">
          <p className="truncate text-sm text-gold-olive" title={item.caption ?? item.name}>
            {item.caption ?? item.name}
          </p>
          <p className="mt-0.5 text-xs text-gold-olive/70">
            {formatDuration(item.durationMs) ? `${formatDuration(item.durationMs)} · ` : ""}
            Video
          </p>
        </div>
      }
    >
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-xl border border-gold/25 bg-black"
      >
        {phase === "fallback" ? (
          <div className="flex aspect-video w-full items-center justify-center bg-olive-deep">
            <iframe
              title={item.name}
              src={`https://drive.google.com/file/d/${encodeURIComponent(item.id)}/preview`}
              allow="autoplay; fullscreen"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              className="max-h-[62svh] w-full bg-black"
              poster={poster}
              preload="metadata"
              playsInline
              onLoadedMetadata={(event) => {
                const video = event.currentTarget;
                setPhase("playable");
                if (Number.isFinite(video.duration)) setDuration(video.duration);
                video.play().catch(() => setPlaying(false));
              }}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              onVolumeChange={(event) => {
                setMuted(event.currentTarget.muted);
                setVolume(event.currentTarget.volume);
              }}
              onError={() => setPhase("fallback")}
            >
              <source src={source} />
            </video>

            {phase === "preparing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-olive-deep/70">
                <span className="font-script text-2xl text-gold-olive">Preparing player…</span>
              </div>
            )}

            {phase === "playable" && !playing && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label={`Play ${item.name}`}
                className="absolute inset-0 flex items-center justify-center bg-black/35 text-gold-olive transition-colors hover:bg-black/45"
              >
                <span className="flex size-16 items-center justify-center rounded-full border border-gold/50 bg-olive-deep/90">
                  <Icon name="play" className="size-7" />
                </span>
              </button>
            )}
          </div>
        )}

        {phase !== "fallback" && (
          <div className="border-t border-gold/20 bg-olive-deep/95 p-2.5">
            <input
              type="range"
              min={0}
              max={activeDuration ?? 0}
              step={0.1}
              value={Math.min(currentTime, activeDuration ?? 0)}
              onChange={(event) => {
                const video = videoRef.current;
                if (!video) return;
                video.currentTime = Number(event.target.value);
                setCurrentTime(video.currentTime);
              }}
              aria-label="Seek"
              style={{
                background: `linear-gradient(to right, var(--gold) ${progress}%, rgb(255 255 255 / 0.25) ${progress}%)`,
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
            />

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                className="flex size-10 items-center justify-center rounded-full text-gold-olive hover:bg-black/30 hover:text-gold"
              >
                <Icon name={playing ? "pause" : "play"} className="size-5" />
              </button>

              <span className="text-xs tabular-nums text-gold-olive/90">
                {formatClock(currentTime)} {activeDuration ? `/ ${formatClock(activeDuration)}` : ""}
              </span>

              <span className="flex-1" />

              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className="flex size-10 items-center justify-center rounded-full text-gold-olive hover:bg-black/30 hover:text-gold"
              >
                <Icon name={muted ? "mute" : "volume"} className="size-5" />
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(event) => {
                  const video = videoRef.current;
                  if (!video) return;
                  const next = Number(event.target.value);
                  video.volume = next;
                  video.muted = next === 0;
                }}
                aria-label="Volume"
                className="hidden h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-white/25 accent-[var(--gold)] sm:block"
              />

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                className="flex size-10 items-center justify-center rounded-full text-gold-olive hover:bg-black/30 hover:text-gold"
              >
                <Icon name={fullscreen ? "exit-fullscreen" : "fullscreen"} className="size-5" />
              </button>
            </div>
          </div>
        )}

        {phase === "fallback" && (
          <p className="border-t border-gold/20 bg-olive-deep/95 px-4 py-3 text-center text-xs text-gold-olive/85">
            This video can&apos;t be streamed in our custom player, so it is playing in an
            embedded viewer whose controls are provided by the storage service.
          </p>
        )}
      </div>
    </Modal>
  );
}
