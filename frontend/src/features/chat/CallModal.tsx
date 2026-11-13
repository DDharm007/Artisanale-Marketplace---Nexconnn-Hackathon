import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';
import { cn } from '../../lib/utils';

export const CallModal: React.FC = () => {
  const { activeCall, endCall, toggleMute, toggleCamera } = useChatStore();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (activeCall?.status === 'connected') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall?.status]);

  if (!activeCall || !activeCall.isActive) return null;

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeFormatted = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center text-white shadow-2xl overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />

        {/* Call Type Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
            {activeCall.isVideo ? <Video className="h-3.5 w-3.5 text-brand-400" /> : <Phone className="h-3.5 w-3.5 text-emerald-400" />}
            Nexconn {activeCall.isVideo ? 'Video Call' : 'Encrypted Audio Call'}
          </span>
        </div>

        {/* Avatar with Sound Pulse Ring */}
        <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
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

        {/* User Info */}
        <h3 className="text-xl font-bold tracking-tight text-white mb-1">{activeCall.targetName}</h3>
        <p className="text-sm font-medium text-slate-400 mb-8">
          {activeCall.status === 'calling' && 'Connecting to Nexconn Gateway...'}
          {activeCall.status === 'connected' && (
            <span className="text-emerald-400 font-mono font-semibold">{timeFormatted}</span>
          )}
          {activeCall.status === 'ended' && <span className="text-rose-400">Call Ended</span>}
        </p>

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
            title="Mute Audio"
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
              title="Toggle Camera"
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
        </div>
      </div>
    </div>
  );
};
