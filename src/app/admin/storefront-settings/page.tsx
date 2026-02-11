"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { Check, Eye } from "lucide-react";
import Link from "next/link";

export default function StorefrontSettingsPage() {
    const { storefrontConfig, updateStorefrontConfig } = useStore();
    const [saved, setSaved] = useState(false);

    const [formData, setFormData] = useState({
        userName: storefrontConfig.userName || "",
        welcomeMessage: storefrontConfig.welcomeMessage || "",
        footerDisclaimer: storefrontConfig.footerDisclaimer || "",
        theme: storefrontConfig.theme || "galaxy",
    });

    // Sync form when context changes
    useEffect(() => {
        setFormData({
            userName: storefrontConfig.userName || "",
            welcomeMessage: storefrontConfig.welcomeMessage || "",
            footerDisclaimer: storefrontConfig.footerDisclaimer || "",
            theme: storefrontConfig.theme || "galaxy",
        });
    }, [storefrontConfig]);

    const handleSave = () => {
        updateStorefrontConfig({
            userName: formData.userName || undefined,
            welcomeMessage: formData.welcomeMessage,
            footerDisclaimer: formData.footerDisclaimer,
            theme: formData.theme as 'galaxy' | 'big-bend' | 'adirondack',
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const themes: Array<{ id: 'galaxy' | 'big-bend' | 'adirondack'; name: string; description: string; colors: string[] }> = [
        { id: 'galaxy', name: 'Galaxy', description: 'Deep blue navy theme', colors: ['#143C67', '#262C30', '#E8EBED'] },
        { id: 'big-bend', name: 'Big Bend', description: 'Warm earth tones', colors: ['#8B4513', '#2F4F4F', '#F5F5DC'] },
        { id: 'adirondack', name: 'Adirondack', description: 'Forest greens', colors: ['#228B22', '#1C1C1C', '#F0FFF0'] },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Storefront Settings</h1>
                    <p className="text-slate-500 text-sm mt-1">Customize the look and feel of your storefront.</p>
                </div>
                <Link
                    href="/storefront"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <Eye className="w-4 h-4" />
                    Preview Storefront
                </Link>
            </div>

            {/* Personalization */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-900">Personalization</h2>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Member Name
                        </label>
                        <input
                            type="text"
                            value={formData.userName}
                            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                            placeholder="Cameron"
                            className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Shows as "Hi [Name]," in the greeting. Leave empty for generic "Offers for You".
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Welcome Message
                        </label>
                        <textarea
                            value={formData.welcomeMessage}
                            onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                            placeholder="We're glad you're here. Browse these recommended options..."
                        />
                    </div>
                </div>
            </div>

            {/* Theme Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-900">Theme</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Visual theme for the storefront (preview only in prototype)</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                        {themes.map((theme) => (
                            <button
                                key={theme.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, theme: theme.id })}
                                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                                    formData.theme === theme.id
                                        ? 'border-slate-900 bg-slate-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {formData.theme === theme.id && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                                <div className="flex gap-1 mb-3">
                                    {theme.colors.map((color, idx) => (
                                        <div
                                            key={idx}
                                            className="w-6 h-6 rounded-full border border-slate-200"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <div className="font-semibold text-slate-900 text-sm">{theme.name}</div>
                                <div className="text-xs text-slate-500">{theme.description}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-900">Footer Disclosures</h2>
                </div>
                <div className="p-6">
                    <textarea
                        value={formData.footerDisclaimer}
                        onChange={(e) => setFormData({ ...formData, footerDisclaimer: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                        placeholder="Legal disclaimers and disclosures..."
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Appears at the bottom of the storefront page.
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={handleSave}
                    className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                        saved
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                >
                    {saved ? (
                        <>
                            <Check className="w-4 h-4" />
                            Saved!
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>
        </div>
    );
}
