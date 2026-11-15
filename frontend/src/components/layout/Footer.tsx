import React from 'react';
import { ShieldCheck, Truck, MessageSquare, RefreshCw, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 mt-20">
      {/* Assurances Grid */}
      <div className="border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Direct Seller Chat</h4>
              <p className="text-xs text-slate-500">Real-time Nexconn messaging with every vendor</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Ubuy Global Express</h4>
              <p className="text-xs text-slate-500">Pre-cleared customs & express door-to-door</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Razorpay Secure Checkout</h4>
              <p className="text-xs text-slate-500">Server-side verified fraud protection</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">30-Day Buyer Guarantee</h4>
              <p className="text-xs text-slate-500">Fast replacements and automated refunds</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="ConvoCart" className="h-10 w-auto brightness-110" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            ConvoCart is the conversation-first multi-vendor marketplace bringing real-time human connection and grounded AI assistance to global commerce.
          </p>
        </div>

        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            Shop Categories
          </h5>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li><Link to="/shop/products?categoryId=cat-electronics" className="hover:text-brand-600">Electronics & Audio</Link></li>
            <li><Link to="/shop/products?categoryId=cat-global" className="hover:text-brand-600">Ubuy Global Express</Link></li>
            <li><Link to="/shop/products?categoryId=cat-fashion" className="hover:text-brand-600">Fashion & Apparel</Link></li>
            <li><Link to="/shop/products?categoryId=cat-home" className="hover:text-brand-600">Home & Kitchen</Link></li>
            <li><Link to="/shop/products?categoryId=cat-beauty" className="hover:text-brand-600">Beauty & Wellness</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            Platform Roles
          </h5>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li><Link to="/shop" className="hover:text-brand-600">Consumer Marketplace</Link></li>
            <li><Link to="/vendor" className="hover:text-brand-600">Vendor 3-Column Studio</Link></li>
            <li><Link to="/vendor/ai-agent" className="hover:text-brand-600">AI Vendor Agent Config</Link></li>
            <li><Link to="/support" className="hover:text-brand-600">Support Agent Queue</Link></li>
            <li><Link to="/admin" className="hover:text-brand-600">Admin Governance Portal</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            Technology & Integration
          </h5>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li><span className="font-semibold text-slate-700">Nexconn:</span> Chat & Call SDK 26.2.1</li>
            <li><span className="font-semibold text-slate-700">Payments:</span> Razorpay HMAC Verified</li>
            <li><span className="font-semibold text-slate-700">AI Engine:</span> Grounded Multimodal LLM</li>
            <li><span className="font-semibold text-slate-700">Infrastructure:</span> Real-Time Cloud Sync</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ConvoCart. Built for Nexconn Hackathon. All rights reserved.
      </div>
    </footer>
  );
};
