import React from 'react';
import { useChatStore } from '../stores/useChatStore';
import { MessageSquare, Bot, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';

export const VendorConversationsPage: React.FC = () => {
  const { conversations, selectConversation, activeConversationId } = useChatStore();

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900">Store Inquiries & Customer Communications</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review all buyer inquiries, oversee AI auto-responses, and take over conversations in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {conversations.map((c) => (
          <div
            key={c.conversationId}
            onClick={() => selectConversation(c.conversationId)}
            className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={
                      c.consumerAvatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                    }
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{c.consumerName}</h3>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(c.updatedAt)}
                    </span>
                  </div>
                </div>

                {c.aiHandlingEnabled ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                    <Bot className="h-3 w-3" /> AI Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    <User className="h-3 w-3" /> Human Mode
                  </span>
                )}
              </div>

              {c.productTitle && (
                <div className="rounded-xl bg-slate-50 p-2 text-[11px] font-medium text-slate-700 mb-3 truncate border border-slate-100">
                  Product: <strong>{c.productTitle}</strong>
                </div>
              )}

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                "{c.lastMessage?.text || 'No message preview'}"
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-brand-600 hover:underline">
                Open in Chat Panel →
              </span>
              {c.status === 'escalated' && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5" /> Escalated
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
