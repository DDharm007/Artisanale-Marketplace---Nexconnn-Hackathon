import React, { useEffect, useRef, useState } from 'react';
import { Message, SUPPORTED_CHAT_LANGUAGES } from '@convocart/shared';
import {
  Check,
  CheckCheck,
  Play,
  Pause,
  ShoppingBag,
  CreditCard,
  Languages,
  Package,
  Loader2,
  Headset,
  Bot,
  Store,
  FileText,
  Download,
  Pencil,
  Trash2,
  Ban,
  Lock,
  Save,
  X,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { isRsaCiphertext, rsaDecryptForCurrentUser } from '../../lib/encryption';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  onPayRequest?: (amount: number, orderId?: string) => void;
  targetLanguage?: string;
  onTranslateMessage?: (messageId: string, targetLang?: string) => Promise<any>;
}

// Real HTML5 <audio> seekable voice player
const CustomAudioPlayer: React.FC<{
  src?: string;
  durationHint?: number;
  isMe: boolean;
}> = ({ src, durationHint, isMe }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationHint || 0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setDuration(Math.round(el.duration));
      }
    };
    const onTime = () => setCurrentTime(el.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !src) {
      setIsPlaying((prev) => !prev);
      return;
    }
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const totalSecs = Math.max(1, duration || durationHint || 5);
  const formatSec = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div
      className={cn(
        'mt-1.5 flex items-center gap-3 rounded-lg px-2.5 py-2 min-w-[220px]',
        isMe ? 'bg-[#004739]' : 'bg-[#182229]'
      )}
    >
      {src && <audio ref={audioRef} src={src} preload="metadata" className="hidden" />}
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00a884] text-[#111b21] transition-transform active:scale-90 shrink-0"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <input
          type="range"
          min={0}
          max={totalSecs}
          step={0.1}
          value={Math.min(currentTime, totalSecs)}
          onChange={handleSeek}
          className="w-full h-1.5 accent-[#00a884] cursor-pointer"
        />
        <div className="flex items-center justify-between text-[10px] text-[#aebac1] mt-1">
          <span>{formatSec(currentTime)}</span>
          <span>{formatSec(totalSecs)}</span>
        </div>
      </div>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  onPayRequest,
  targetLanguage: propTargetLang,
  onTranslateMessage,
}) => {
  const navigate = useNavigate();
  const [isTranslatingLocal, setIsTranslatingLocal] = useState(false);
  const [hideTranslation, setHideTranslation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');

  const currentUid = useAuthStore((s) => s.user?.uid);
  const storeTargetLang = useChatStore((s) => s.targetLanguage);
  const storeTranslateMessage = useChatStore((s) => s.translateMessage);
  const editMessage = useChatStore((s) => s.editMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const activeTargetLang = propTargetLang || storeTargetLang || 'en';

  const isMessageRsaEncrypted = Boolean(
    message.metadata?.rsaEncrypted || isRsaCiphertext(message.text)
  );
  const [decryptedText, setDecryptedText] = useState<string>(
    isMessageRsaEncrypted ? 'Decrypting with your RSA-2048 Private Key...' : message.text || ''
  );
  const [rsaStatus, setRsaStatus] = useState<'decrypted' | 'locked' | 'plain'>(
    isMessageRsaEncrypted ? 'locked' : 'plain'
  );
  const [decryptedKeyRole, setDecryptedKeyRole] = useState<string | undefined>();

  useEffect(() => {
    if (!isMessageRsaEncrypted || message.metadata?.isDeleted) {
      setDecryptedText(message.text || '');
      setRsaStatus('plain');
      setDecryptedKeyRole(undefined);
      return;
    }

    let cancelled = false;
    void (async () => {
      const res = await rsaDecryptForCurrentUser({
        primaryText: message.text,
        rsaForRecipient: message.metadata?.rsaForRecipient,
        rsaForSender: message.metadata?.rsaForSender,
        rsaRecipientUid: message.metadata?.rsaRecipientUid,
        rsaSenderUid: message.metadata?.rsaSenderUid,
        currentUid,
      });
      if (!cancelled) {
        setDecryptedText(res.plaintext);
        setRsaStatus(res.status);
        setDecryptedKeyRole(res.decryptedWith);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isMessageRsaEncrypted,
    message.id,
    message.text,
    message.metadata?.rsaForRecipient,
    message.metadata?.rsaForSender,
    message.metadata?.rsaRecipientUid,
    message.metadata?.rsaSenderUid,
    message.metadata?.isDeleted,
    currentUid,
  ]);

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isDispatchBanner =
    message.senderName === 'ConvoCart Dispatch Center' ||
    message.senderId === 'system';

  if (isDispatchBanner) {
    const sysTranslation = message.metadata?.translatedText?.[activeTargetLang];
    return (
      <div className="my-2 flex justify-center">
        <div className="max-w-[92%] rounded-full border border-[#2a3942] bg-[#182229]/95 px-3.5 py-1.5 text-center text-[11px] font-medium text-[#d1d7db] shadow-xs">
          {sysTranslation && activeTargetLang !== 'en' ? sysTranslation : message.text}
        </div>
      </div>
    );
  }

  if (message.metadata?.isDeleted) {
    return (
      <div className={cn('flex flex-col mb-2.5', isMe ? 'items-end' : 'items-start')}>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#2a3942] bg-[#182229]/70 px-3 py-1.5 text-xs italic text-[#8696a0]">
          <Ban className="h-3.5 w-3.5" />
          <span>{message.text || 'This message was recalled'}</span>
          <span className="text-[10px] not-italic">{formattedTime}</span>
        </div>
      </div>
    );
  }

  const detectedLangCode = message.metadata?.detectedLanguage;
  const detectedLangObj = SUPPORTED_CHAT_LANGUAGES.find((l) => l.code === detectedLangCode);
  const targetLangObj = SUPPORTED_CHAT_LANGUAGES.find((l) => l.code === activeTargetLang);

  const rawTranslated = message.metadata?.translatedText?.[activeTargetLang];
  const hasTranslation = Boolean(
    rawTranslated &&
      rawTranslated.trim().toLowerCase() !== (decryptedText || '').trim().toLowerCase()
  );

  const handleTranslateClick = async () => {
    if (hasTranslation) {
      setHideTranslation((prev) => !prev);
      return;
    }
    setIsTranslatingLocal(true);
    try {
      if (onTranslateMessage) {
        await onTranslateMessage(message.id, activeTargetLang);
      } else {
        await storeTranslateMessage(
          message.conversationId,
          message.id,
          activeTargetLang,
          isMessageRsaEncrypted && rsaStatus === 'decrypted' ? decryptedText : undefined
        );
      }
      setHideTranslation(false);
    } finally {
      setIsTranslatingLocal(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    await editMessage(message.conversationId, message.id, editText.trim());
    setIsEditing(false);
  };

  const renderRoleBadge = () => {
    if (message.isAiGenerated) {
      return (
        <span className="inline-flex items-center gap-0.5 rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300">
          <Bot className="h-2.5 w-2.5" /> AI
        </span>
      );
    }
    if (message.senderRole === 'support_agent' || message.senderRole === 'admin') {
      return (
        <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
          <Headset className="h-2.5 w-2.5" /> Human Agent
        </span>
      );
    }
    if (message.senderRole === 'vendor') {
      return (
        <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
          <Store className="h-2.5 w-2.5" /> Seller
        </span>
      );
    }
    return null;
  };

  const audioSource = message.mediaUrl || message.metadata?.audioUrl;
  const fileSource = message.mediaUrl || message.metadata?.fileUrl;

  return (
    <div className={cn('group flex flex-col mb-2.5', isMe ? 'items-end' : 'items-start')}>
      {/* Sender Name & Role Pill */}
      {!isMe && (
        <div className="flex items-center gap-1.5 px-1 mb-0.5">
          <span className="text-[11px] font-bold text-[#00a884]">{message.senderName}</span>
          {renderRoleBadge()}
          {detectedLangObj && (
            <span className="text-[9px] font-medium text-[#8696a0]">
              {detectedLangObj.flag} {detectedLangObj.code.toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* WhatsApp Message Bubble Container */}
      <div
        className={cn(
          'relative max-w-[85%] px-3.5 py-2 text-sm shadow-xs transition-all',
          isMe
            ? 'rounded-lg rounded-tr-none bg-[#005c4b] text-[#e9edef]'
            : 'rounded-lg rounded-tl-none bg-[#202c33] text-[#e9edef]'
        )}
      >
        {/* Text Body or Inline Editor */}
        {isEditing ? (
          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="w-full rounded bg-[#111b21] px-2.5 py-1.5 text-xs text-white focus:outline-none border border-[#00a884]"
              autoFocus
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1 rounded bg-[#202c33] px-2 py-0.5 text-[10px] text-[#aebac1]"
              >
                <X className="h-2.5 w-2.5" /> Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveEdit()}
                className="inline-flex items-center gap-1 rounded bg-[#00a884] px-2 py-0.5 text-[10px] font-bold text-[#111b21]"
              >
                <Save className="h-2.5 w-2.5" /> Save
              </button>
            </div>
          </div>
        ) : (
          decryptedText && (
            <p
              className={cn(
                'whitespace-pre-wrap leading-relaxed break-words text-[13px]',
                rsaStatus === 'locked' && 'italic text-amber-200/90'
              )}
            >
              {decryptedText}
            </p>
          )
        )}

        {/* Translated Text Panel (Nexconn TranslateModule + Backend Multilingual Service) */}
        {hasTranslation && !hideTranslation && !isEditing && (
          <div className="mt-1.5 rounded-md border-l-2 border-[#00a884] bg-[#111b21]/55 px-2.5 py-1.5 text-[12px] text-[#d1d7db]">
            <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-[#00a884] mb-0.5">
              <span className="flex items-center gap-1">
                <Languages className="h-3 w-3" />
                {targetLangObj?.flag} Translated ({targetLangObj?.nativeName || activeTargetLang.toUpperCase()})
              </span>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed break-words">{rawTranslated}</p>
          </div>
        )}

        {/* Image Attachment */}
        {message.type === 'image' && fileSource && (
          <div className="mt-1.5 overflow-hidden rounded-lg">
            <img
              src={fileSource}
              alt="attachment"
              className="max-h-60 w-full object-cover rounded-md cursor-pointer hover:opacity-95"
              onClick={() => window.open(fileSource, '_blank')}
            />
          </div>
        )}

        {/* File Attachment */}
        {message.type === 'file' && fileSource && (
          <a
            href={fileSource}
            target="_blank"
            rel="noopener noreferrer"
            download={message.metadata?.fileName || 'attachment'}
            className="mt-1.5 flex items-center gap-2.5 rounded-lg bg-[#182229] border border-[#2a3942] px-3 py-2 text-xs text-[#e9edef] hover:border-[#00a884]"
          >
            <FileText className="h-4 w-4 text-[#53bdeb] shrink-0" />
            <span className="truncate flex-1">{message.metadata?.fileName || 'Attachment'}</span>
            <Download className="h-3.5 w-3.5 text-[#8696a0] shrink-0" />
          </a>
        )}

        {/* Real HTML5 Seekable Voice Note Player */}
        {message.type === 'audio' && (
          <CustomAudioPlayer
            src={audioSource}
            durationHint={message.metadata?.audioDuration}
            isMe={isMe}
          />
        )}

        {/* Product Card Attachment */}
        {message.type === 'product_card' && message.metadata && (
          <div className="mt-2 flex items-center gap-2.5 rounded-lg bg-[#182229] border border-[#2a3942] p-2 text-[#e9edef]">
            {message.metadata.productImage && (
              <img
                src={message.metadata.productImage}
                alt=""
                className="h-12 w-12 rounded object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-xs truncate">{message.metadata.productTitle}</h4>
              <p className="text-xs font-bold text-[#00a884] mt-0.5">
                {message.metadata.productPrice ? formatCurrency(message.metadata.productPrice) : ''}
              </p>
              <button
                onClick={() => navigate(`/shop/products/${message.metadata?.productId}`)}
                className="mt-0.5 flex items-center gap-1 text-[11px] text-[#53bdeb] hover:underline"
              >
                <ShoppingBag className="h-3 w-3" /> View Product
              </button>
            </div>
          </div>
        )}

        {/* Order Status Card Attachment */}
        {message.type === 'order_card' && message.metadata && (
          <div className="mt-2 rounded-lg bg-[#182229] border border-[#2a3942] p-2.5 text-[#e9edef]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="flex items-center gap-1 text-xs font-bold text-[#00a884]">
                <Package className="h-3.5 w-3.5" /> Order #{message.metadata.orderId}
              </span>
              {message.metadata.orderStatus && (
                <span className="rounded bg-[#2a3942] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#53bdeb]">
                  {message.metadata.orderStatus}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#8696a0]">
              <span>
                {message.metadata.orderItemsCount
                  ? `${message.metadata.orderItemsCount} item(s)`
                  : 'Verified Order'}
              </span>
              {message.metadata.orderTotal !== undefined && (
                <span className="font-bold text-white">
                  {formatCurrency(message.metadata.orderTotal)}
                </span>
              )}
            </div>
            {message.metadata.trackingNumber && (
              <p className="mt-1 font-mono text-[10px] text-[#8696a0]">
                Tracking: {message.metadata.trackingNumber}
              </p>
            )}
          </div>
        )}

        {/* Payment Request Card */}
        {message.type === 'payment_request' && message.metadata && (
          <div className="mt-2 rounded-lg bg-[#182229] border border-[#2a3942] p-2.5 text-[#e9edef]">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-xs font-bold text-[#53bdeb]">
                <CreditCard className="h-3.5 w-3.5" /> Payment Request
              </span>
              <span className="text-xs font-bold text-white">
                {message.metadata.paymentAmount
                  ? formatCurrency(message.metadata.paymentAmount)
                  : '$0.00'}
              </span>
            </div>
            <p className="text-[11px] text-[#8696a0] mb-2">
              Authorized secure payment request from merchant.
            </p>
            {onPayRequest && (
              <button
                onClick={() =>
                  onPayRequest(message.metadata?.paymentAmount || 0, message.metadata?.orderId)
                }
                className="w-full rounded bg-[#00a884] py-1.5 text-xs font-bold text-[#111b21] hover:bg-[#029676] transition-colors"
              >
                Pay with Razorpay
              </button>
            )}
          </div>
        )}

        {/* Footer row: Translate action + Edit/Recall + Timestamp & Double-Ticks */}
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-[#8696a0] select-none">
          <div className="flex items-center gap-2">
            {message.text && message.type === 'text' && (
              <button
                onClick={() => void handleTranslateClick()}
                disabled={isTranslatingLocal}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-[#53bdeb] hover:text-[#7bd3f7] transition-colors"
                title={`Translate to ${targetLangObj?.nativeName || activeTargetLang}`}
              >
                {isTranslatingLocal ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <Languages className="h-2.5 w-2.5" />
                )}
                <span>
                  {hasTranslation
                    ? hideTranslation
                      ? 'Show Translation'
                      : 'Hide Translation'
                    : `Translate (${activeTargetLang.toUpperCase()})`}
                </span>
              </button>
            )}

            {isMe && !isEditing && (
              <span className="hidden group-hover:inline-flex items-center gap-1.5">
                {message.type === 'text' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditText(decryptedText || '');
                      setIsEditing(true);
                    }}
                    className="text-[#aebac1] hover:text-white"
                    title="Edit message"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void deleteMessage(message.conversationId, message.id)}
                  className="text-[#aebac1] hover:text-rose-400"
                  title="Recall message"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {message.metadata?.storageProvider === 'firebase' && (
              <span title="Encrypted Cloud Media" className="text-[9px] text-amber-300 font-semibold">
                CLOUD
              </span>
            )}
            {message.metadata?.encrypted && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-300"
                title={
                  isMessageRsaEncrypted
                    ? `Encrypted with Receiver RSA-2048 Public Key · ${
                        decryptedKeyRole === 'recipient-private-key'
                          ? 'Decrypted with Receiver Private Key Only'
                          : decryptedKeyRole === 'sender-private-key'
                          ? 'Decrypted with Sender Private Key Copy'
                          : 'Requires Receiver Private Key'
                      }`
                    : 'End-to-End Encrypted'
                }
              >
                <Lock className="h-2.5 w-2.5" />
                {isMessageRsaEncrypted ? 'RSA-2048' : ''}
              </span>
            )}
            {message.metadata?.isEdited && <span className="italic">(edited)</span>}
            <span>{formattedTime}</span>
            {isMe && (
              <span>
                {message.status === 'read' ? (
                  <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-[#8696a0]" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
