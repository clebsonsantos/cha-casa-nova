"use client";

import { useState, useEffect, useRef } from "react";

interface MusicPlayerProps {
  youtubeUrl?: string;
}

function extractVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    const embed = u.pathname.match(/\/embed\/([^/?]+)/);
    if (embed) return embed[1];
  } catch {
    const m = url.match(/[?&]v=([^&]+)/);
    if (m) return m[1];
  }
  return null;
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  setVolume(v: number): void;
  getPlayerState(): number;
  destroy(): void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function MusicPlayer({ youtubeUrl }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [showControls, setShowControls] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(30);

  const videoId = youtubeUrl ? extractVideoId(youtubeUrl) : null;

  // Sincroniza volumeRef com state para acesso em callbacks
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    const initPlayer = () => {
      if (!containerRef.current || playerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: videoId,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            e.target.setVolume(volumeRef.current);
            e.target.playVideo();
            // Se passados 2s ainda não estiver tocando, mostra indicador
            setTimeout(() => {
              if (!isPlayingRef.current) setAutoplayBlocked(true);
            }, 2000);
          },
          onStateChange: (e) => {
            if (e.data === 1 /* PLAYING */) {
              isPlayingRef.current = true;
              setIsPlaying(true);
              setAutoplayBlocked(false);
            } else if (e.data === 2 /* PAUSED */ || e.data === 0 /* ENDED */) {
              isPlayingRef.current = false;
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      // Acumula callbacks caso outros componentes também usem a API
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        initPlayer();
      };

      if (!document.getElementById("yt-iframe-api")) {
        const script = document.createElement("script");
        script.id = "yt-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Fallback: na primeira interação do usuário, tenta iniciar
  useEffect(() => {
    if (!videoId) return;

    const tryOnInteraction = () => {
      if (!isPlayingRef.current && typeof playerRef.current?.playVideo === "function") {
        playerRef.current.playVideo();
      }
      cleanup();
    };

    const cleanup = () => {
      document.removeEventListener("click", tryOnInteraction);
      document.removeEventListener("keydown", tryOnInteraction);
      document.removeEventListener("touchstart", tryOnInteraction);
      document.removeEventListener("scroll", tryOnInteraction);
    };

    document.addEventListener("click", tryOnInteraction, { once: true });
    document.addEventListener("keydown", tryOnInteraction, { once: true });
    document.addEventListener("touchstart", tryOnInteraction, { once: true });
    document.addEventListener("scroll", tryOnInteraction, { once: true });

    return cleanup;
  }, [videoId]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player || typeof player.playVideo !== "function") return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    volumeRef.current = v;
    playerRef.current?.setVolume(v);
  };

  if (!videoId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Container do player invisível — o YT.Player injeta o iframe aqui */}
      <div
        ref={containerRef}
        className="absolute pointer-events-none opacity-0 overflow-hidden"
        style={{ width: 1, height: 1 }}
        aria-hidden="true"
      />

      <div className="flex flex-col items-end gap-2">
        {autoplayBlocked && !isPlaying && (
          <button
            onClick={togglePlay}
            className="flex items-center gap-2 bg-white border border-[#A9DCA4] text-[#6DB567] text-xs font-medium px-3 py-1.5 rounded-full shadow-md hover:bg-[#D4EED1] transition-colors animate-pulse"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Toque para ouvir a música
          </button>
        )}

        <div
          className={`flex items-center gap-3 bg-white border border-[#A9DCA4] rounded-full shadow-lg transition-all duration-300 overflow-hidden ${
            showControls ? "pr-4" : ""
          }`}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {showControls && (
            <div className="flex items-center gap-2 pl-4">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {isPlaying ? "♪ Tocando..." : "Música"}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-16 h-1 accent-[#A9DCA4] cursor-pointer"
                title="Volume"
              />
            </div>
          )}
          <button
            onClick={togglePlay}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-[#A9DCA4] hover:bg-[#6DB567] text-white transition-colors flex-shrink-0"
            aria-label={isPlaying ? "Pausar música" : "Tocar música"}
            title={isPlaying ? "Pausar música" : "Tocar música"}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
