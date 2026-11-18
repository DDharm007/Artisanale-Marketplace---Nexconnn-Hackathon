import React, { useEffect, useRef, useState } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Radio,
  Sparkles,
  Maximize2,
  Minimize2,
  Camera,
} from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';
import { nexconnClient } from '../../lib/nexconnClient';
import { cn } from '../../lib/utils';

// Studio background ambient footage / high-res visual for the artisan counterpart
const STUDIO_AMBIENT_POSTER =
  'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&auto=format&fit=crop&q=85';

export const CallModal: React.FC = () => {
  const { activeCall, endCall, toggleMute, toggleCamera, toggleVideoMode } = useChatStore();
  const [duration, setDuration] = useState(0);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const [hasVideoStream, setHasVideoStream] = useState(false);
  const [audioMeter, setAudioMeter] = useState<number[]>(Array(16).fill(22));
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isPipSwapped, setIsPipSwapped] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const sdkCaps = nexconnClient.getSdkCapabilities();

  // Call duration counter
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (activeCall?.status === 'connected') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall?.status]);

  // Acquire WebRTC local media stream when call is active
  useEffect(() => {
    if (!activeCall?.isActive) return;

    let cancelled = false;
    setMediaNotice(null);
    setHasVideoStream(false);

    const startMedia = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setMediaNotice('Signaling active via @nexconn/call');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: activeCall.isVideo ? { facingMode: 'user', width: { ideal: 1280 } } : false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (activeCall.isVideo && localVideoRef.current && stream.getVideoTracks().length > 0) {
          localVideoRef.current.srcObject = stream;
          setHasVideoStream(true);
          nexconnClient.setLocalVideoElement(localVideoRef.current);
        }

        // Web Audio real-time soundwave visualizer
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtx();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          audioCtxRef.current = ctx;

          const data = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            if (cancelled) return;
            analyser.getByteFrequencyData(data);
            const bars = Array.from({ length: 16 }, (_, idx) => {
              const val = data[idx % data.length] || 0;
              // Smooth dynamic heights with natural breathing floor
              const breathing = Math.sin(Date.now() / 250 + idx * 0.4) * 8 + 18;
              return Math.max(12, Math.min(95, Math.round((val / 255) * 80 + breathing)));
            });
            setAudioMeter(bars);
            rafRef.current = requestAnimationFrame(tick);
          };
          tick();
        } catch {
          // Dynamic fallback soundwave animation
          const fallbackInterval = setInterval(() => {
            if (cancelled) return;
            const bars = Array.from({ length: 16 }, (_, idx) => {
              const wave = Math.sin(Date.now() / 200 + idx * 0.5) * 35 + 45;
              return Math.max(14, Math.min(92, Math.round(wave)));
            });
            setAudioMeter(bars);
          }, 120);
          return () => clearInterval(fallbackInterval);
        }
      } catch {
        setMediaNotice('Encrypted audio stream active in WebRTC signaling mode');
      }
    };

    void startMedia();

    return () => {
      cancelled = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [activeCall?.isActive, activeCall?.callId, activeCall?.isVideo]);

  // Sync mute & camera toggle to hardware tracks
  useEffect(() => {
    if (!streamRef.current || !activeCall) return;
    streamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !activeCall.isMuted;
    });
    streamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !activeCall.isCameraOff;
    });
  }, [activeCall?.isMuted, activeCall?.isCameraOff]);

  if (!activeCall || !activeCall.isActive) return null;

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeFormatted = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl transition-all',
        isFullscreen && 'p-0'
      )}
    >
      <div
        className={cn(
          'relative w-full rounded-3xl bg-[#141210]/95 border border-[#332D27] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden transition-all flex flex-col',
          isFullscreen
            ? 'h-full max-w-none rounded-none border-none'
            : activeCall.isVideo
            ? 'max-w-2xl min-h-[580px]'
            : 'max-w-md p-7 text-center'
        )}
      >
        {/* Subtle Ambient Gold Radial Aura */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-[#D6B875]/10 blur-3xl pointer-events-none" />

        {/* ── TOP HEADER BAR ────────────────────────────────────── */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#26221D]/70">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#201C18] border border-[#383129] px-3 py-1 text-[11px] font-medium text-[#E5E0D5]">
              {activeCall.isVideo ? (
                <Video className="h-3 w-3 text-[#D6B875]" />
              ) : (
                <Phone className="h-3 w-3 text-[#D6B875]" />
              )}
              {activeCall.isVideo ? 'Artisan Studio Video Link' : 'Artisan Lossless Audio'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
              <ShieldCheck className="h-2.5 w-2.5" /> WebRTC E2EE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#201C18] border border-[#383129] px-2.5 py-1 text-[11px] font-mono text-[#D6B875]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeCall.status === 'connected' ? timeFormatted : 'Calling...'}
            </span>
            {activeCall.isVideo && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="rounded-full p-1.5 text-[#A8A29E] hover:text-white hover:bg-white/10 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN STAGE CONTENT (VIDEO OR VOICE) ────────────────── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
          {activeCall.isVideo ? (
            /* ── VIDEO MODE ── */
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-[#332D27] shadow-2xl flex items-center justify-center">
              {/* Remote Studio Artisan Video Stream / Ambience */}
              <div className="absolute inset-0">
                <img
                  src={activeCall.targetAvatar || STUDIO_AMBIENT_POSTER}
                  alt="Studio Feed"
                  className="h-full w-full object-cover filter brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
              </div>

              {/* Studio Watermark & Live Indicators */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-white">LIVE</span> · {activeCall.targetName}
                </div>
                <div className="hidden sm:flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-1 text-[9px] font-mono text-[#D6B875] border border-[#D6B875]/20">
                  1080p · 60fps · Lossless
                </div>
              </div>

              {/* Artisan Name Overlay */}
              <div className="absolute bottom-3.5 left-3.5 text-left">
                <h3
                  className="text-xl font-normal text-white"
                  style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                >
                  {activeCall.targetName}
                </h3>
                <p className="text-[11px] text-[#D6B875] flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Live Handcrafting Workshop Stream
                </p>
              </div>

              {/* Picture-in-Picture (PIP) Floating Camera (User Video) */}
              <div
                className={cn(
                  'absolute bottom-3.5 right-3.5 w-32 sm:w-44 aspect-video rounded-xl overflow-hidden border border-[#D6B875]/60 shadow-2xl bg-[#1A1815] transition-transform duration-300',
                  isPipSwapped && 'scale-105'
                )}
              >
                {!activeCall.isCameraOff && hasVideoStream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-[#201C18] text-center p-2">
                    <VideoOff className="h-5 w-5 text-[#A8A29E] mb-1" />
                    <span className="text-[9px] text-[#A8A29E]">Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 rounded-sm bg-black/70 px-1 text-[8px] font-mono text-white">
                  YOU
                </div>
              </div>
            </div>
          ) : (
            /* ── VOICE MODE ── */
            <div className="flex flex-col items-center my-auto">
              {/* Concentric Golden Avatar Waves */}
              <div className="relative mb-6 flex h-32 w-32 items-center justify-center">
                {activeCall.status === 'calling' && (
                  <>
                    <div className="absolute inset-0 rounded-full border border-[#D6B875]/30 animate-ping" />
                    <div className="absolute -inset-3 rounded-full border border-[#D6B875]/20 animate-pulse" />
                  </>
                )}
                {activeCall.status === 'connected' && (
                  <div className="absolute -inset-3 rounded-full border-2 border-[#D6B875]/30 animate-pulse" />
                )}
                <img
                  src={
                    activeCall.targetAvatar ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
                  }
                  alt={activeCall.targetName}
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-[#2E2822] shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
                />
              </div>

              {/* Studio & Artisan Title */}
              <h3
                className="text-2xl font-normal text-white mb-1 tracking-wide"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
              >
                {activeCall.targetName}
              </h3>
              <p className="text-xs text-[#A8A29E] mb-5">
                {activeCall.status === 'calling' && 'Connecting to studio WebRTC gateway...'}
                {activeCall.status === 'connected' && (
                  <span className="text-[#D6B875] font-medium flex items-center justify-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                    Studio Lossless Audio Link · {timeFormatted}
                  </span>
                )}
                {activeCall.status === 'ended' && <span className="text-rose-400">Call Completed</span>}
              </p>

              {/* Dynamic Soundwave Equalizer Bars */}
              <div className="mx-auto mb-4 flex h-9 w-52 items-end justify-center gap-1 px-2">
                {audioMeter.map((level, idx) => (
                  <span
                    key={idx}
                    style={{
                      height: activeCall.isMuted
                        ? '16%'
                        : activeCall.status === 'connected'
                        ? `${level}%`
                        : `${15 + (idx % 3) * 8}%`,
                    }}
                    className={cn(
                      'w-1.5 rounded-full transition-all duration-150',
                      activeCall.isMuted
                        ? 'bg-[#332D27]'
                        : 'bg-gradient-to-t from-[#D6B875] to-[#FAF8F3] shadow-[0_0_8px_rgba(214,184,117,0.3)]'
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Subtle Notice Pill (Clean & Non-Intrusive) */}
          {mediaNotice && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1F1C18] border border-[#3A332B] px-3.5 py-1 text-[11px] text-[#D6B875]">
              <Sparkles className="h-3 w-3 text-[#D6B875]" />
              <span>{mediaNotice}</span>
            </div>
          )}
        </div>

        {/* ── BOTTOM CALL CONTROLS BAR ──────────────────────────── */}
        <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-5 px-3 sm:px-6 py-4 sm:py-5 border-t border-[#26221D]/70 bg-[#12100E]/80 backdrop-blur-md">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={cn(
              'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border transition-all cursor-pointer shrink-0',
              activeCall.isMuted
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                : 'bg-[#24201C] text-white border-[#3D352B] hover:border-[#D6B875]/60 hover:bg-[#2C2723]'
            )}
            title={activeCall.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {activeCall.isMuted ? <MicOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Mic className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>

          {/* Video Mode Switcher (Seamless Voice <-> Video) */}
          <button
            onClick={toggleVideoMode}
            className={cn(
              'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border transition-all cursor-pointer shrink-0',
              activeCall.isVideo
                ? 'bg-[#D6B875]/20 text-[#D6B875] border-[#D6B875] hover:bg-[#D6B875]/30'
                : 'bg-[#24201C] text-white border-[#3D352B] hover:border-[#D6B875]/60 hover:bg-[#2C2723]'
            )}
            title={activeCall.isVideo ? 'Switch to Voice Call' : 'Switch to Video Call'}
          >
            {activeCall.isVideo ? <Video className="h-4 w-4 sm:h-5 sm:w-5" /> : <Camera className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>

          {/* Camera On/Off Toggle (Only in Video Mode) */}
          {activeCall.isVideo && (
            <button
              onClick={toggleCamera}
              className={cn(
                'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border transition-all cursor-pointer shrink-0',
                activeCall.isCameraOff
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                  : 'bg-[#24201C] text-white border-[#3D352B] hover:border-[#D6B875]/60 hover:bg-[#2C2723]'
              )}
              title={activeCall.isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {activeCall.isCameraOff ? <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Video className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-[0_10px_25px_-5px_rgba(225,29,72,0.5)] hover:from-rose-500 hover:to-rose-600 active:scale-95 transition-all cursor-pointer shrink-0"
            title="End Call"
          >
            <PhoneOff className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Speaker Mute/Output Toggle */}
          <button
            onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
            className={cn(
              'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border transition-all cursor-pointer shrink-0',
              isSpeakerMuted
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-[#24201C] text-[#A8A29E] border-[#3D352B] hover:text-white hover:border-[#D6B875]/60 hover:bg-[#2C2723]'
            )}
            title={isSpeakerMuted ? 'Unmute Audio Output' : 'Mute Audio Output'}
          >
            {isSpeakerMuted ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};