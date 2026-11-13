import React, { useState, useRef } from 'react';
import { Send, Image, Mic, Paperclip, Smile, Square, Trash2 } from 'lucide-react';
import { MessageType } from '@convocart/shared';
import { cn } from '../../lib/utils';

interface MessageComposerProps {
  onSendMessage: (text: string, type?: MessageType, mediaUrl?: string, metadata?: any) => Promise<void>;
  isLoading?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojis = ['👍', '❤️', '🔥', '😊', '🙏', '📦', '✨', '⚡', '🎧', '👋'];

  const handleSend = async () => {
    if (!text.trim() || isLoading) return;
    const msgText = text;
    setText('');
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    await onSendMessage(msgText, 'text');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopAndSendVoice = async () => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    await onSendMessage('Voice Note Recorded', 'audio', undefined, {
      audioDuration: recordingSeconds || 5,
    });
    setRecordingSeconds(0);
  };

  const cancelVoice = () => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const dummyUrl = URL.createObjectURL(file);
    onSendMessage(
      isImg ? 'Photo attachment' : file.name,
      isImg ? 'image' : 'file',
      dummyUrl,
      { fileName: file.name, fileSize: file.size }
    );
    setShowAttachMenu(false);
  };

  return (
    <div className="relative border-t border-[#222d34] bg-[#202c33] px-3 py-2.5">
      {/* WhatsApp Emoji Picker Dropdown */}
      {showEmojiPicker && (
        <div className="absolute bottom-14 left-3 z-30 flex gap-2 rounded-xl border border-[#2a3942] bg-[#202c33] p-2 shadow-2xl">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setText((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-lg hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* WhatsApp Attachment Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-14 left-10 z-30 flex flex-col gap-1 rounded-xl border border-[#2a3942] bg-[#202c33] p-2 shadow-2xl text-xs text-[#d1d7db]">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-[#2a3942] text-left"
          >
            <Image className="h-4 w-4 text-[#00a884]" /> Photos & Videos
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-[#2a3942] text-left"
          >
            <Paperclip className="h-4 w-4 text-[#53bdeb]" /> Document or Spec
          </button>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx"
      />

      {/* Voice Recording Active Bar */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-[#2a3942] px-3 py-2">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs animate-pulse">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Recording 0:{String(recordingSeconds).padStart(2, '0')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cancelVoice}
              className="p-1 rounded text-[#8696a0] hover:text-rose-400"
              title="Cancel"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={stopAndSendVoice}
              className="flex items-center gap-1 rounded bg-[#00a884] px-3 py-1 text-xs font-bold text-[#111b21] hover:bg-[#029676]"
            >
              <Square className="h-3 w-3 fill-current" /> Send Voice
            </button>
          </div>
        </div>
      ) : (
        /* Normal Input Bar */
        <div className="flex items-center gap-2">
          {/* Emoji toggle */}
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachMenu(false);
            }}
            className="text-[#8696a0] hover:text-[#d1d7db] p-1.5 transition-colors"
            title="Emojis"
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* Attachment toggle */}
          <button
            onClick={() => {
              setShowAttachMenu(!showAttachMenu);
              setShowEmojiPicker(false);
            }}
            className="text-[#8696a0] hover:text-[#d1d7db] p-1.5 transition-colors"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* WhatsApp Text Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Type a message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg bg-[#2a3942] px-3.5 py-2 text-sm text-[#d1d7db] placeholder:text-[#8696a0] border-none focus:outline-none"
            />
          </div>

          {/* Send or Voice Note Button */}
          {text.trim() ? (
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00a884] text-[#111b21] hover:bg-[#029676] transition-transform active:scale-90"
              title="Send"
            >
              <Send className="h-4 w-4 ml-0.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={startVoiceRecording}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[#8696a0] hover:text-[#00a884] transition-colors"
              title="Record voice note"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
