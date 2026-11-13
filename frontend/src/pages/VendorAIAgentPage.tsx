import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { AIAgentConfig } from '@convocart/shared';
import {
  Bot,
  Save,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

export const VendorAIAgentPage: React.FC = () => {
  const [config, setConfig] = useState<AIAgentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // New FAQ inputs
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // AI Response Simulator / Tester
  const [testQuery, setTestQuery] = useState('Do the headphones support Bluetooth multi-point?');
  const [simulatedReply, setSimulatedReply] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<AIAgentConfig>('/ai-agent/config');
      setConfig(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      await apiRequest('/ai-agent/config', {
        method: 'PATCH',
        body: JSON.stringify(config),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Error updating AI config');
    }
  };

  const handleToggleTakeover = async () => {
    if (!config) return;
    const nextVal = !config.humanTakeoverActive;
    try {
      await apiRequest('/ai-agent/takeover', {
        method: 'POST',
        body: JSON.stringify({ takeoverActive: nextVal }),
      });
      setConfig({ ...config, humanTakeoverActive: nextVal });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddFaq = () => {
    if (newQuestion.trim() && newAnswer.trim() && config) {
      const updatedFaqs = [...config.faqs, { question: newQuestion.trim(), answer: newAnswer.trim() }];
      setConfig({ ...config, faqs: updatedFaqs });
      setNewQuestion('');
      setNewAnswer('');
    }
  };

  const handleRemoveFaq = (idx: number) => {
    if (!config) return;
    const updated = config.faqs.filter((_, i) => i !== idx);
    setConfig({ ...config, faqs: updated });
  };

  const handleRunSimulation = async () => {
    if (!testQuery.trim()) return;
    setIsSimulating(true);
    setSimulatedReply(null);
    try {
      const res = await apiRequest<{ replyText: string; isAiGenerated: boolean; escalateToHuman: boolean }>(
        '/ai-agent/respond',
        {
          method: 'POST',
          body: JSON.stringify({ query: testQuery }),
        }
      );
      setSimulatedReply(res.replyText);
    } catch (err: any) {
      setSimulatedReply('Error generating simulation: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading || !config) {
    return <div className="py-20 text-center text-slate-400">Loading AI Agent Configuration...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-purple-100 p-1.5 text-purple-700">
              <Bot className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900">AI Vendor Commerce Assistant</h1>
          </div>
          <p className="text-xs text-slate-500">
            Ground your store's autonomous agent in verified policies, specifications, and FAQs.
          </p>
        </div>

        {/* Human Takeover Master Switch */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleTakeover}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
              config.humanTakeoverActive
                ? 'bg-amber-500 text-white shadow-amber-500/25 ring-4 ring-amber-100'
                : 'bg-emerald-600 text-white shadow-emerald-600/25 ring-4 ring-emerald-100'
            }`}
          >
            {config.humanTakeoverActive ? (
              <>
                <UserCheck className="h-4 w-4" /> Human Seller Handling Active (AI Paused)
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" /> AI Auto-Answering Active
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveConfig} className="space-y-8 text-xs">
        {/* 1. General Agent Identity */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              1. Agent Identity & Persona
            </h3>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="h-4 w-4 accent-brand-600 rounded"
              />
              <span>Enable AI Assistant for Customers</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Agent Name</label>
              <input
                type="text"
                required
                value={config.agentName}
                onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Tone & Personality</label>
              <select
                value={config.personality}
                onChange={(e: any) => setConfig({ ...config, personality: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-medium bg-white focus:border-brand-500 focus:outline-none"
              >
                <option value="friendly">Friendly & Helpful (Recommended)</option>
                <option value="professional">Professional & Direct</option>
                <option value="concise">Concise & Fast</option>
                <option value="technical">Technical & Detail-Oriented</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Greeting Message (Sent when customer initiates inquiry)
              </label>
              <textarea
                rows={2}
                required
                value={config.greetingMessage}
                onChange={(e) => setConfig({ ...config, greetingMessage: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Grounded Policies & Knowledge */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            2. Grounded Business Policies (Strict Source of Truth)
          </h3>
          <p className="text-[11px] text-slate-500">
            The AI engine references these verbatim to prevent hallucinations or unauthorized promises.
          </p>

          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Shipping & Dispatch Policy</label>
              <textarea
                rows={2}
                value={config.shippingPolicy}
                onChange={(e) => setConfig({ ...config, shippingPolicy: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Returns & Replacement Policy</label>
              <textarea
                rows={2}
                value={config.returnPolicy}
                onChange={(e) => setConfig({ ...config, returnPolicy: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Warranty Information</label>
              <textarea
                rows={2}
                value={config.warrantyInfo}
                onChange={(e) => setConfig({ ...config, warrantyInfo: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Knowledge Base FAQs */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            3. Frequently Asked Questions (Store Knowledge Base)
          </h3>

          <div className="space-y-3">
            {config.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80"
              >
                <div className="space-y-1 pr-4">
                  <h4 className="font-bold text-slate-900">Q: {faq.question}</h4>
                  <p className="text-slate-600">A: {faq.answer}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFaq(idx)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add FAQ inputs */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50/30 p-4 space-y-2.5">
            <h4 className="font-bold text-brand-900">Add New FAQ</h4>
            <input
              type="text"
              placeholder="Question (e.g. Do you ship to Australia?)"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 bg-white"
            />
            <input
              type="text"
              placeholder="Answer (e.g. Yes, via DHL Express Worldwide in 4-6 business days.)"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 bg-white"
            />
            <button
              type="button"
              onClick={handleAddFaq}
              className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-brand-600"
            >
              Add to Knowledge Base
            </button>
          </div>
        </div>

        {/* 4. Live Grounded Response Tester */}
        <div className="rounded-3xl border border-purple-200 bg-purple-50/40 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>AI Response Grounding Test Simulator</span>
          </div>
          <p className="text-slate-600">
            Type any question to simulate how Aria or your configured AI agent responds to customers using verified data.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Test query..."
              className="flex-1 rounded-xl border border-purple-200 bg-white p-2.5"
            />
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="rounded-xl bg-purple-600 px-5 py-2.5 font-bold text-white shadow-sm hover:bg-purple-700 flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5" /> {isSimulating ? 'Evaluating...' : 'Simulate'}
            </button>
          </div>

          {simulatedReply && (
            <div className="rounded-2xl border border-purple-200 bg-white p-4 text-slate-800 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block">
                Simulated AI Output:
              </span>
              <p className="leading-relaxed font-medium">{simulatedReply}</p>
            </div>
          )}
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          {isSaved && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
              <Check className="h-4 w-4" /> AI configuration saved successfully!
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 font-bold text-white shadow-md hover:bg-brand-700 active:scale-95 transition-all"
          >
            <Save className="h-4 w-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
