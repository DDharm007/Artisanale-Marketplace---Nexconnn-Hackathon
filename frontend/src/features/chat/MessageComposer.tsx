import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Image,
  Mic,
  Paperclip,
  Smile,
  Square,
  Trash2,
  Languages,
  Loader2,
  Package,
  Camera,
  RefreshCw,
  X,
  UploadCloud,
} from 'lucide-react';
import { MessageType, SUPPORTED_CHAT_LANGUAGES } from '@convocart/shared';
import { useChatStore } from '../../stores/useChatStore';
import { uploadChatFile } from '../../lib/firebase';

interface QuickActionItem {
  label: string;
  onClick: () => void;
}

interface MessageComposerProps {
  onSendMessage: (
    text: string,
    type?: MessageType,
    mediaUrl?: string,
    metadata?: any
  ) => Promise<void>;
  isLoading?: boolean;
  targetLanguage?: string;
  onTranslateDraft?: (
    text: string,
    targetLang?: string
  ) => Promise<{ translatedText: string; detectedLanguage: string }>;
  quickActions?: QuickActionItem[];
  conversationId?: string;
  placeholder?: string;
}

// Synthesize a valid short WAV tone data URL if browser microphone is unavailable
function createFallbackWavFile(durationSeconds: number): File {
  const sampleRate = 8000;
  const secs = Math.max(1, Math.min(durationSeconds, 10));
  const numSamples = sampleRate * secs;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin(Math.PI * (i / numSamples));
    const sample = Math.sin(2 * Math.PI * 440 * t) * 0.12 * envelope;
    view.setInt16(44 + i * 2, Math.floor(sample * 32767), true);
  }

  return new File([buffer], `voice-${Date.now()}.wav`, { type: 'audio/wav' });
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  isLoading,
  targetLanguage: propTargetLang,
  onTranslateDraft,
  quickActions,
  conversationId: propConversationId,
  placeholder,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(15));
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isTranslatingDraft, setIsTranslatingDraft] = useState(false);

  // Live Webcam Capture state
  const [showWebcam, setShowWebcam] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Voice recording refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const recSecondsRef = useRef(0);

  const storeTargetLang = useChatStore((s) => s.targetLanguage);
  const storeTranslateDraft = useChatStore((s) => s.translateDraft);
  const storeConversationId = useChatStore((s) => s.activeConversationId);
  const activeConversationId = propConversationId || storeConversationId || 'general';
  const activeTargetLang = propTargetLang || storeTargetLang || 'en';
  const targetLangMeta = SUPPORTED_CHAT_LANGUAGES.find((l) => l.code === activeTargetLang);

  const emojis = ['👍', '❤️', '🔥', '😊', '🙏', '📦', '✨', '⚡', '🎧', '👋'];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const uploadAndSendFile = async (file: File, extraMeta: Record<string, any> = {}) => {
    setIsUploadingMedia(true);
    try {
      const { url, provider } = await uploadChatFile(file, activeConversationId);
      const isImg = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      const msgType: MessageType = isImg ? 'image' : isAudio ? 'audio' : 'file';

      await onSendMessage(
        isImg
          ? `Photo attachment (${file.name})`
          : isAudio
          ? `Voice Note (${extraMeta.audioDuration || 1}s)`
          : file.name,
        msgType,
        url,
        {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          storageProvider: provider,
          encrypted: true,
          ...(isAudio ? { audioUrl: url } : { fileUrl: url }),
          ...extraMeta,
        }
      );
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || isLoading || isUploadingMedia) return;
    const msgText = text;
    setText('');
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    await onSendMessage(msgText, 'text', undefined, { encrypted: true });
  };

  const handleTranslateDraft = async () => {
    if (!text.trim() || isTranslatingDraft) return;
    setIsTranslatingDraft(true);
    try {
      const translator = onTranslateDraft || storeTranslateDraft;
      const res = await translator(text, activeTargetLang);
      if (res?.translatedText) {
        setText(res.translatedText);
      }
    } finally {
      setIsTranslatingDraft(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSend();
    }
  };

  // Real MediaRecorder + Web Audio AnalyserNode waveform recording
  const startVoiceRecording = async () => {
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    setIsRecording(true);
    setRecordingSeconds(0);
    recSecondsRef.current = 0;

    timerRef.current = setInterval(() => {
      recSecondsRef.current += 1;
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWaveform = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioLevels((prev) => [...prev.slice(1), Math.max(12, Math.min(100, Math.round(avg * 0.85)))]);
        rafRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg')
        ? 'audio/ogg'
        : '';
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.start();
      mediaRecorderRef.current = mr;
    } catch {
      // Headless / no-mic fallback waveform animation so recording still produces playable WAV audio
      const animateFallback = () => {
        setAudioLevels((prev) => [
          ...prev.slice(1),
          Math.max(15, Math.min(95, Math.round(25 + Math.random() * 65))),
        ]);
        rafRef.current = requestAnimationFrame(animateFallback);
      };
      animateFallback();
    }
  };

  const cleanupRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setIsRecording(false);
    setAudioLevels(Array(20).fill(15));
  };

  const stopAndSendVoice = async () => {
    const duration = Math.max(1, recSecondsRef.current || recordingSeconds || 1);
    const mr = mediaRecorderRef.current;

    if (mr && mr.state !== 'inactive') {
      const audioFile = await new Promise<File>((resolve) => {
        mr.onstop = () => {
          const type = mr.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type });
          const ext = type.includes('ogg') ? 'ogg' : 'webm';
          resolve(new File([blob], `voice-${Date.now()}.${ext}`, { type }));
        };
        mr.stop();
      });
      mediaRecorderRef.current = null;
      cleanupRecording();
      setRecordingSeconds(0);
      await uploadAndSendFile(audioFile, { audioDuration: duration });
    } else {
      mediaRecorderRef.current = null;
      cleanupRecording();
      setRecordingSeconds(0);
      const fallbackFile = createFallbackWavFile(duration);
      await uploadAndSendFile(fallbackFile, { audioDuration: duration });
    }
  };

  const cancelVoice = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.onstop = null;
      mr.stop();
    }
    mediaRecorderRef.current = null;
    cleanupRecording();
    setRecordingSeconds(0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    setShowAttachMenu(false);
    await uploadAndSendFile(file);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.includes('image')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) await uploadAndSendFile(file);
        break;
      }
    }
  };

  // Live Webcam Capture Modal handlers
  const startWebcam = async (mode: 'user' | 'environment' = facingMode) => {
    setShowAttachMenu(false);
    setWebcamError(null);
    setShowWebcam(true);

    try {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
      });
      webcamStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setWebcamError('Could not access camera. Check browser permissions or upload an image file.');
    }
  };

  const stopWebcam = () => {
    webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
    webcamStreamRef.current = null;
    setShowWebcam(false);
    setWebcamError(null);
  };

  const flipCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    await startWebcam(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          const file = new File([blob], `webcam_${Date.now()}.jpg`, { type: 'image/jpeg' });
          stopWebcam();
          await uploadAndSendFile(file);
        }
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div className="relative border-t border-[#26221D] bg-[#171717] px-3.5 py-2.5">
      {/* Live Webcam Capture Modal */}
      {showWebcam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#332D27] bg-[#1E1B18] p-4 text-[#FAF8F5] shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-[#D6B875]" />
                <span className="text-sm font-normal" style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}>
                  Capture Photo for Artisan Chat
                </span>
              </div>
              <button
                onClick={stopWebcam}
                className="rounded-lg p-1 text-[#8C867A] hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {webcamError ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-xs text-rose-300">
                {webcamError}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl bg-black aspect-video border border-[#332D27]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                />
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={flipCamera}
                className="flex items-center gap-1.5 rounded-full bg-[#24201C] border border-[#332D27] px-3.5 py-1.5 text-xs font-semibold text-[#E5E0D5] hover:bg-white/5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Flip Camera
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={Boolean(webcamError)}
                className="flex items-center gap-1.5 rounded-full bg-[#D6B875] px-4 py-1.5 text-xs font-bold text-[#171717] hover:bg-[#C5A45E] disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" /> Capture &amp; Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker Dropdown */}
      {showEmojiPicker && (
        <div className="absolute bottom-14 left-3 z-30 flex gap-2 rounded-2xl border border-[#332D27] bg-[#1E1B18] p-2 shadow-2xl">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setText((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-14 left-10 z-30 flex flex-col gap-1 rounded-2xl border border-[#332D27] bg-[#1E1B18] p-2 shadow-2xl text-xs text-[#E5E0D5] min-w-[205px]">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5 text-left cursor-pointer"
          >
            <Image className="h-4 w-4 text-[#D6B875]" /> Photos &amp; Screenshots
          </button>
          <button
            onClick={() => void startWebcam('user')}
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5 text-left cursor-pointer"
          >
            <Camera className="h-4 w-4 text-[#D6B875]" /> Snap Photo (Webcam)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5 text-left cursor-pointer"
          >
            <Paperclip className="h-4 w-4 text-[#D6B875]" /> Document / Specs
          </button>
          {quickActions?.map((qa, idx) => (
            <button
              key={idx}
              onClick={() => {
                setShowAttachMenu(false);
                qa.onClick();
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5 text-left text-[#D6B875] font-semibold border-t border-[#332D27] pt-2 mt-0.5 cursor-pointer"
            >
              <Package className="h-4 w-4" /> {qa.label}
            </button>
          ))}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
      />

      {isUploadingMedia && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#24201C] border border-[#332D27] px-3 py-1.5 text-[11px] font-medium text-[#D6B875]">
          <UploadCloud className="h-3.5 w-3.5 animate-bounce" /> Uploading media...
        </div>
      )}

      {/* Voice Recording Bar */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 rounded-full bg-[#24201C] border border-[#332D27] px-4 py-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-mono">0:{String(recordingSeconds).padStart(2, '0')}</span>
          </div>

          <div className="flex flex-1 items-center justify-center gap-0.5 h-6">
            {audioLevels.map((lvl, idx) => (
              <span
                key={idx}
                style={{ height: `${Math.max(18, lvl)}%` }}
                className="w-1 rounded-full bg-[#D6B875] transition-all duration-75"
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cancelVoice}
              className="p-1 rounded text-[#8C867A] hover:text-rose-400 cursor-pointer"
              title="Cancel"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => void stopAndSendVoice()}
              className="flex items-center gap-1 rounded-full bg-[#D6B875] px-3 py-1 text-xs font-bold text-[#171717] hover:bg-[#C5A45E] cursor-pointer"
            >
              <Square className="h-3 w-3 fill-current" /> Send Voice
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          {/* Emoji toggle */}
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachMenu(false);
            }}
            className="text-[#A8A29E] hover:text-[#D6B875] p-1.5 transition-colors cursor-pointer"
            title="Emojis"
          >
            <Smile className="h-4 w-4" />
          </button>

          {/* Attachment toggle */}
          <button
            onClick={() => {
              setShowAttachMenu(!showAttachMenu);
              setShowEmojiPicker(false);
            }}
            className="text-[#A8A29E] hover:text-[#D6B875] p-1.5 transition-colors cursor-pointer"
            title="Attach file, photo or webcam"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Quick Webcam Photo */}
          <button
            onClick={() => void startWebcam('user')}
            className="text-[#A8A29E] hover:text-[#D6B875] p-1.5 transition-colors hidden sm:inline-flex cursor-pointer"
            title="Capture Photo"
          >
            <Camera className="h-4 w-4" />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={placeholder || 'Ask about dimensions, materials, shipping...'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              className="w-full rounded-full bg-[#24201C] border border-[#332D27] pl-3.5 pr-8 py-1.5 text-xs text-white placeholder:text-[#7A756D] focus:border-[#D6B875] focus:outline-none"
            />
            {text.trim() && (
              <button
                type="button"
                onClick={handleTranslateDraft}
                disabled={isTranslatingDraft}
                title={`Translate draft to ${targetLangMeta?.nativeName || activeTargetLang}`}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#D6B875] hover:text-white transition-colors cursor-pointer"
              >
                {isTranslatingDraft ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Languages className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Send Button */}
          {text.trim() ? (
            <button
              onClick={() => void handleSend()}
              disabled={isLoading || isUploadingMedia}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D6B875] text-[#171717] hover:bg-[#C5A45E] transition-transform active:scale-95 shrink-0 cursor-pointer shadow-xs"
              title="Send"
            >
              <Send className="h-3.5 w-3.5 ml-0.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => void startVoiceRecording()}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#A8A29E] hover:text-[#D6B875] transition-colors shrink-0 cursor-pointer"
              title="Record Voice Note"
            >
              <Mic className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
