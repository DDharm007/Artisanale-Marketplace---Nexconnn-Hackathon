import React from 'react';
import { ShieldCheck, Truck, MessageSquare, RefreshCw, Globe, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#171717] text-white border-t border-[#262626] mt-20">
      {/* Editorial Mission Statement */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <p
          className="text-2xl sm:text-3xl font-normal text-white mb-8 tracking-tight"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
        >
          We're on a mission to keep craftsmanship &amp; commerce deeply human.
        </p>

        {/* Assurances in Black + Gold */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-10 border-b border-[#2E2E2E]">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              <MessageSquare className="h-5 w-5 text-[#D6B875]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Direct Artisan Chat</h4>
              <p className="text-xs text-[#A8A29E] mt-0.5">Real-time 1-on-1 dialogue with certified makers</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              <Globe className="h-5 w-5 text-[#D6B875]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Global Express</h4>
              <p className="text-xs text-[#A8A29E] mt-0.5">Pre-cleared customs &amp; worldwide door delivery</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              <ShieldCheck className="h-5 w-5 text-[#D6B875]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Verified Authentic</h4>
              <p className="text-xs text-[#A8A29E] mt-0.5">Server-side verified fraud protection</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              <RefreshCw className="h-5 w-5 text-[#D6B875]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Craft Guarantee</h4>
              <p className="text-xs text-[#A8A29E] mt-0.5">Damage-free transit &amp; hassle-free returns</p>
            </div>
          </div>
        </div>

        {/* Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-b border-[#2E2E2E]">
          <div>
            <Link
              to="/shop"
              className="text-3xl font-normal text-[#D6B875] tracking-tight block mb-3"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              artisanale
            </Link>
            <p className="text-xs text-[#A8A29E] leading-relaxed">
              Curated marketplace for handcrafted creations where authentic tradition meets timeless contemporary design.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#D6B875] mb-3.5">Shop</h5>
            <ul className="space-y-2 text-sm text-[#A8A29E]">
              <li><Link to="/shop/products?categoryId=cat-home" className="hover:text-white transition-colors">Home Decor &amp; Ceramics</Link></li>
              <li><Link to="/shop/products?categoryId=cat-gifts" className="hover:text-white transition-colors">Artisanal Gifts</Link></li>
              <li><Link to="/shop/products?categoryId=cat-fashion" className="hover:text-white transition-colors">Apparel &amp; Textiles</Link></li>
              <li><Link to="/shop/products?categoryId=cat-vintage" className="hover:text-white transition-colors">Vintage Finds</Link></li>
              <li><Link to="/shop/products" className="hover:text-white transition-colors">All Creations</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#D6B875] mb-3.5">Artisans</h5>
            <ul className="space-y-2 text-sm text-[#A8A29E]">
              <li><Link to="/vendor" className="hover:text-white transition-colors">Studio Dashboard</Link></li>
              <li><Link to="/vendor/ai-agent" className="hover:text-white transition-colors">AI Concierge Config</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">Artisan Dispatch</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Marketplace Governance</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#D6B875] mb-3.5">Support</h5>
            <ul className="space-y-2 text-sm text-[#A8A29E]">
              <li><Link to="/shop/support" className="hover:text-white transition-colors">Artisan Support Hub</Link></li>
              <li><Link to="/shop/orders" className="hover:text-white transition-colors">Track Orders</Link></li>
              <li><Link to="/auth" className="hover:text-white transition-colors">Sign In / Register</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#78716C]">
          <span>© {new Date().getFullYear()} artisanale × ConvoCart. Built for Nexconn Hackathon.</span>
          <span>Crafted with Instrument Serif &amp; Poppins.</span>
        </div>
      </div>
    </footer>
  );
};
