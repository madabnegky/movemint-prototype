import Link from "next/link";
import { LayoutDashboard, Store, Rocket, Building2, Globe } from "lucide-react";

export default function PrototypeLaunchpad() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Offer Platform Prototype</h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Interactive high-fidelity prototype for the digital storefront ecosystem. Select a persona to begin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl w-full">
        <Link href="/admin" className="group relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Admin Console</h2>
          <p className="text-slate-500 leading-relaxed text-sm">
            Configure products, manage offers, and view analytics.
          </p>
        </Link>

        <Link href="/landing" className="group relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Rocket className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Consumer Landing</h2>
          <p className="text-slate-500 leading-relaxed text-sm">
            Top-of-funnel marketing page for value proposition.
          </p>
        </Link>

        <Link href="/storefront" className="group relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Storefront</h2>
          <p className="text-slate-500 leading-relaxed text-sm">
            Authenticated shopping experience for browsing offers.
          </p>
        </Link>

        <Link href="/home-banking" className="group relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Partner Previews</h2>
          <p className="text-slate-500 leading-relaxed text-sm">
            See the DSF widget in Q2, Alkami, NCR, and other platforms.
          </p>
        </Link>

        <Link href="/stranger-storefront" className="group relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center mb-6 border border-cyan-100 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
            <Globe className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Stranger Storefront</h2>
          <p className="text-slate-500 leading-relaxed text-sm">
            Public-facing offers for non-members visiting the credit union website.
          </p>
        </Link>
      </div>

      <div className="mt-16 text-sm text-slate-400">
        Movemint Digital Storefront • Prototype v0.1
      </div>
    </div>
  );
}
