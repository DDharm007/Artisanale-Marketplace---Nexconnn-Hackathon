import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, ShieldCheck, Radio } from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';
import { nexconnClient } from '../../lib/nexconnClient';
import { cn } from '../../lib/utils';

export const CallModal: React.FC = () => {
  const { activeCall, endCall, toggleMute, toggleCamera } = useChatStore();
  const [duration, setDuration] = useState(0);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const [hasVideoStream, setHasVideoStream] = useState(false);
  const [audioMeter, setAudioMeter] = useState<number[]>(Array(12).fill(18));

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const sdkCaps = nexconnClient.getSdkCapabilities();

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

  // Acquire real WebRTC local audio/video stream when call starts
  useEffect(() => {
    if (!activeCall?.isActive) {
      return;
    }

    let cancelled = false;
    setMediaNotice(null);
    setHasVideoStream(false);

    const startMedia = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setMediaNotice('Browser media preview unavailable — running @nexconn/call signaling mode');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: activeCall.isVideo ? { facingMode: 'user' } : false,
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

        // Real-time Web Audio microphone visualizer
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
            const bars = Array.from({ length: 12 }, (_, idx) => {
              const val = data[idx % data.length] || 0;
              return Math.max(15, Math.min(100, Math.round((val / 255) * 100)));
            });
            setAudioMeter(bars);
            rafRef.current = requestAnimationFrame(tick);
          };
          tick();
        } catch {
          // Optional visualizer
        }
      } catch {
        setMediaNotice('Mic/Camera permission declined — active signaling via @nexconn/call');
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

  // Apply mute / camera toggle to live MediaStream tracks
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-7 text-center text-white shadow-2xl overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />

        {/* SDK Header Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
            {activeCall.isVideo ? (
              <Video className="h-3.5 w-3.5 text-brand-400" />
            ) : (
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
            )}
            {sdkCaps.callSdk}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
            <ShieldCheck className="h-3 w-3" /> WebRTC Encrypted
          </span>
        </div>

        {/* Live Video Stream Preview OR Voice Avatar + Waveform */}
        {activeCall.isVideo && hasVideoStream && !activeCall.isCameraOff ? (
          <div className="relative mx-auto mb-5 w-full overflow-hidden rounded-2xl border border-slate-700 bg-black aspect-video shadow-xl">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover -scale-x-100"
            />
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 backdrop-blur-xs">
              <Radio className="h-3 w-3 animate-pulse text-emerald-400" /> Local Camera Live
            </div>
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[10px] text-slate-200">
              Calling {activeCall.targetName}
            </div>
          </div>
        ) : (
          <div className="relative mx-auto mb-5 flex h-28 w-28 items-center justify-center">
            {activeCall.status === 'calling' && (
              <div className="absolute inset-0 rounded-full border-2 border-brand-500/40 animate-ping" />
            )}
            {activeCall.status === 'connected' && (
              <div className="absolute -inset-2 rounded-full border border-emerald-500/30 animate-pulse" />
            )}
            <img
              src={
                activeCall.targetAvatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
              }
              alt={activeCall.targetName}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-800 shadow-xl"
            />
          </div>
        )}

        {/* User Info */}
        <h3 className="text-xl font-bold tracking-tight text-white mb-1">{activeCall.targetName}</h3>
        <p className="text-sm font-medium text-slate-400 mb-4">
          {activeCall.status === 'calling' && 'Connecting via @nexconn/call WebRTC Gateway...'}
          {activeCall.status === 'connected' && (
            <span className="text-emerald-400 font-mono font-semibold">{timeFormatted} · HD Audio</span>
          )}
          {activeCall.status === 'ended' && <span className="text-rose-400">Call Ended</span>}
        </p>

        {/* Live Microphone Level Visualizer */}
        <div className="mx-auto mb-5 flex h-7 w-44 items-end justify-center gap-1">
          {audioMeter.map((level, idx) => (
            <span
              key={idx}
              style={{ height: activeCall.isMuted ? '18%' : `${level}%` }}
              className={cn(
                'w-1.5 rounded-full transition-all duration-100',
                activeCall.isMuted ? 'bg-slate-700' : 'bg-emerald-400/90'
              )}
            />
          ))}
        </div>

        {mediaNotice && (
          <p className="mb-4 rounded-xl bg-slate-800/80 px-3 py-1.5 text-[11px] text-amber-300">
            {mediaNotice}
          </p>
        )}

        {/* Controls Bar */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full transition-all',
              activeCall.isMuted
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            )}
            title={activeCall.isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {activeCall.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {activeCall.isVideo && (
            <button
              onClick={toggleCamera}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full transition-all',
                activeCall.isCameraOff
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )}
              title={activeCall.isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {activeCall.isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>
          )}

          <button
            onClick={endCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 active:scale-95 transition-all"
            title="End Call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>

          <div
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-300"
            title="Speaker Active"
          >
            <Volume2 className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
