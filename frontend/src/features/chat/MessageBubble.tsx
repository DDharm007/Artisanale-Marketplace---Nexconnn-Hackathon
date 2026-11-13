import React, { useState } from 'react';
import { Message } from '@convocart/shared';
import { Check, CheckCheck, Play, Pause, ShoppingBag, CreditCard } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  onPayRequest?: (amount: number, orderId?: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe, onPayRequest }) => {
  const navigate = useNavigate();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn('flex flex-col mb-2.5', isMe ? 'items-end' : 'items-start')}>
      {/* Sender Name in subtle green/teal for non-me */}
      {!isMe && (
        <span className="text-[11px] font-bold text-[#00a884] px-1 mb-0.5">
          {message.senderName}
        </span>
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
        {/* Text Body */}
        {message.text && (
          <p className="whitespace-pre-wrap leading-relaxed break-words text-[13px]">
            {message.text}
          </p>
        )}

        {/* Image Attachment */}
        {message.type === 'image' && message.mediaUrl && (
          <div className="mt-1.5 overflow-hidden rounded-lg">
            <img
              src={message.mediaUrl}
              alt="attachment"
              className="max-h-60 w-full object-cover rounded-md cursor-pointer hover:opacity-95"
              onClick={() => window.open(message.mediaUrl, '_blank')}
            />
          </div>
        )}

        {/* WhatsApp Voice Note Waveform Player */}
        {message.type === 'audio' && (
          <div className={cn(
            'mt-1.5 flex items-center gap-3 rounded-lg px-2.5 py-2',
            isMe ? 'bg-[#004739]' : 'bg-[#182229]'
          )}>
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00a884] text-[#111b21] transition-transform active:scale-90"
            >
              {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-0.5 h-4">
                {[40, 70, 30, 90, 50, 80, 45, 60, 35, 75, 50, 65, 80, 40].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={cn(
                      'w-1 rounded-full transition-colors',
                      isPlayingAudio && i < 8 ? 'bg-[#00a884]' : 'bg-[#8696a0]'
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[#8696a0] mt-0.5 block">
                {message.metadata?.audioDuration ? `0:${String(message.metadata.audioDuration).padStart(2, '0')}` : '0:14'}
              </span>
            </div>
          </div>
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

        {/* Payment Request Card */}
        {message.type === 'payment_request' && message.metadata && (
          <div className="mt-2 rounded-lg bg-[#182229] border border-[#2a3942] p-2.5 text-[#e9edef]">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-xs font-bold text-[#53bdeb]">
                <CreditCard className="h-3.5 w-3.5" /> Payment Request
              </span>
              <span className="text-xs font-bold text-white">
                {message.metadata.paymentAmount ? formatCurrency(message.metadata.paymentAmount) : '$0.00'}
              </span>
            </div>
            <p className="text-[11px] text-[#8696a0] mb-2">Authorized secure payment request from merchant.</p>
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

        {/* Timestamp & WhatsApp Blue Double-Ticks */}
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#8696a0] select-none float-right ml-2 -mb-0.5">
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
  );
};
