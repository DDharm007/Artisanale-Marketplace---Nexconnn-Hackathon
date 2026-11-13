import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-6xl font-black text-brand-600 mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-900 mb-4">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mb-6">
        The requested marketplace or dashboard resource does not exist or has been relocated.
      </p>
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-brand-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Return to Marketplace
      </Link>
    </div>
  );
};
