import React, { useState } from 'react';
import { apiRequest } from '../lib/api';
import { HelpCircle, Send, Check } from 'lucide-react';

export const VendorSupportPage: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Payment / Commission Inquiry');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject, category, description, priority }),
      });
      setIsSent(true);
      setSubject('');
      setDescription('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-xs">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900">Vendor Partner Support</h1>
        <p className="text-xs text-slate-500 mt-1">
          Reach our platform engineering and dispute resolution teams directly.
        </p>
      </div>

      {isSent && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>Ticket created successfully! A platform administrator will reply shortly.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Subject</label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your inquiry..."
            className="w-full rounded-xl border border-slate-300 p-2.5 font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 font-medium bg-white"
            >
              <option value="Payment / Commission Inquiry">Payment / Commission Inquiry</option>
              <option value="Ubuy Global Logistics Assistance">Ubuy Global Logistics Assistance</option>
              <option value="Nexconn SDK Integration Help">Nexconn SDK Integration Help</option>
              <option value="Store Verification Question">Store Verification Question</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e: any) => setPriority(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 font-medium bg-white"
            >
              <option value="low">Low (48h SLA)</option>
              <option value="medium">Medium (24h SLA)</option>
              <option value="high">High (12h SLA)</option>
              <option value="urgent">Urgent Escalation (4h SLA)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Detailed Explanation</label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context, order numbers, or screenshots..."
            className="w-full rounded-xl border border-slate-300 p-2.5 font-medium"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="rounded-full bg-[#171717] px-6 py-2.5 font-bold text-[#D6B875] hover:bg-black transition-colors flex items-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" /> Submit Support Ticket
          </button>
        </div>
      </form>
    </div>
  );
};
