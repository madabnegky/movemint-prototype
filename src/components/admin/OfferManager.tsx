"use client";

import React, { useState } from "react";
import { useStore, Offer, OfferVariant, OfferAttribute, ProductType } from "@/context/StoreContext";
import { Plus, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Components ---

function Label({ children, className, required }: { children: React.ReactNode; className?: string; required?: boolean }) {
    return (
        <label className={cn("block text-sm font-medium text-slate-700 mb-1.5", className)}>
            {children}
            {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
    );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all duration-200",
                className
            )}
            {...props}
        />
    );
}

function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div className="relative">
            <select
                className={cn(
                    "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent appearance-none transition-all duration-200",
                    className
                )}
                {...props}
            />
            <div className="absolute right-3 top-3 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-slate-500">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
}

// Variant display config
const VARIANT_CONFIG: Record<OfferVariant, { label: string; color: string }> = {
    'preapproved': { label: "Preapproved", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    'prequalified': { label: "Prequalified", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    'ita': { label: "Invite to Apply", color: "bg-purple-50 text-purple-700 border-purple-200" },
    'wildcard': { label: "Special Offer", color: "bg-amber-50 text-amber-700 border-amber-200" },
    'redeemed': { label: "Redeemed", color: "bg-slate-50 text-slate-500 border-slate-200" },
    'auto-refi': { label: "Auto Refi", color: "bg-teal-50 text-teal-700 border-teal-200" },
    'credit-limit': { label: "Credit Limit", color: "bg-blue-50 text-blue-700 border-blue-200" },
    'protection': { label: "Protection", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
    { value: 'auto-loan', label: 'Auto Loan' },
    { value: 'auto-refi', label: 'Auto Refinance' },
    { value: 'home-loan', label: 'Home Loan' },
    { value: 'heloc', label: 'HELOC' },
    { value: 'credit-card', label: 'Credit Card' },
    { value: 'credit-limit-increase', label: 'Credit Limit Increase' },
    { value: 'term-life', label: 'Term Life Insurance' },
    { value: 'gap', label: 'GAP Coverage' },
    { value: 'mrc', label: 'Mechanical Repair Coverage' },
    { value: 'debt-protection', label: 'Debt Protection' },
];

// --- Main Component ---

export function OfferManager() {
    const { offers, sections, addOffer, updateOffer, deleteOffer, addSection } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Offer>>({
        title: "",
        variant: "preapproved",
        productType: "auto-loan",
        section: sections[0],
        isFeatured: false,
        attributes: [
            { label: "Up to", value: "" },
            { label: "As low as", value: "", subtext: "APR*†" }
        ],
        imageUrl: ""
    });

    const resetForm = () => {
        setFormData({
            title: "",
            variant: "preapproved",
            productType: "auto-loan",
            section: sections[0],
            isFeatured: false,
            attributes: [
                { label: "Up to", value: "" },
                { label: "As low as", value: "", subtext: "APR*†" }
            ],
            imageUrl: ""
        });
        setIsEditing(false);
        setEditingId(null);
        setConfirmDeleteId(null);
    };

    const handleEdit = (offer: Offer) => {
        setFormData(offer);
        setEditingId(offer.id);
        setIsEditing(true);
        setConfirmDeleteId(null);
    };

    const handleDelete = (id: string) => {
        deleteOffer(id);
        setConfirmDeleteId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newOffer: Offer = {
            id: editingId || crypto.randomUUID(),
            title: formData.title || "Untitled Offer",
            variant: formData.variant || "preapproved",
            productType: formData.productType || "auto-loan",
            section: formData.section || sections[0],
            isFeatured: formData.isFeatured || false,
            attributes: formData.attributes || [],
            imageUrl: formData.imageUrl,
            ctaText: formData.ctaText || "Learn More",
            description: formData.description,
            featuredHeadline: formData.featuredHeadline,
            featuredDescription: formData.featuredDescription,
            isRedeemed: formData.isRedeemed,
        };

        if (editingId) {
            updateOffer(newOffer);
        } else {
            addOffer(newOffer);
        }
        resetForm();
    };

    const handleAttributeChange = (idx: number, field: keyof OfferAttribute, value: string) => {
        const newAttrs = [...(formData.attributes || [])];
        newAttrs[idx] = { ...newAttrs[idx], [field]: value };
        setFormData({ ...formData, attributes: newAttrs });
    };

    const handleNewSection = () => {
        const name = prompt("Enter new section name:");
        if (name) {
            addSection(name);
            setFormData({ ...formData, section: name });
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Offer Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Create and manage dynamic offers for the storefront.</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Offer
                    </button>
                )}
            </div>

            {/* List View */}
            {!isEditing && (
                <div className="grid grid-cols-1 gap-4">
                    {offers.map(offer => (
                        <div key={offer.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-all">
                            <div className="flex items-center gap-4">
                                {offer.imageUrl ? (
                                    <div className="w-16 h-10 rounded-md overflow-hidden bg-slate-100">
                                        <img src={offer.imageUrl} className="w-full h-full object-cover" alt="" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-10 bg-slate-100 rounded-md flex items-center justify-center text-xs text-slate-400">
                                        No Img
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-slate-900">{offer.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200 font-medium">
                                            {offer.section}
                                        </span>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider",
                                            VARIANT_CONFIG[offer.variant]?.color || "bg-slate-50 text-slate-600 border-slate-200"
                                        )}>
                                            {VARIANT_CONFIG[offer.variant]?.label || offer.variant}
                                        </span>
                                        {offer.isFeatured && (
                                            <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Featured
                                            </span>
                                        )}
                                        {offer.isRedeemed && (
                                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full font-medium">
                                                Redeemed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleEdit(offer)}
                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                                    title="Edit Offer"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>

                                {confirmDeleteId === offer.id ? (
                                    <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(offer.id)}
                                            className="px-2 py-1 text-xs font-bold text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors shadow-sm"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId(null)}
                                            className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(offer.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Delete Offer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {offers.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-500">No offers created yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit/Create Form */}
            {isEditing && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900">
                            {editingId ? "Edit Offer" : "Create New Offer"}
                        </h2>
                        <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                            Close
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label required>Offer Title</Label>
                                <Input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. New Auto Loan"
                                />
                                <p className="text-xs text-slate-400 mt-1">15-28 characters recommended</p>
                            </div>

                            <div>
                                <Label required>Offer Variant</Label>
                                <Select
                                    value={formData.variant}
                                    onChange={e => setFormData({ ...formData, variant: e.target.value as OfferVariant })}
                                >
                                    <option value="preapproved">Preapproved (Teal)</option>
                                    <option value="ita">Invite to Apply (Purple)</option>
                                    <option value="wildcard">Special Offer</option>
                                    <option value="auto-refi">Auto Refinance</option>
                                    <option value="credit-limit">Credit Limit Increase</option>
                                    <option value="protection">Protection Product</option>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label required>Product Type</Label>
                                <Select
                                    value={formData.productType}
                                    onChange={e => setFormData({ ...formData, productType: e.target.value as ProductType })}
                                >
                                    {PRODUCT_TYPES.map(pt => (
                                        <option key={pt.value} value={pt.value}>{pt.label}</option>
                                    ))}
                                </Select>
                                <p className="text-xs text-slate-400 mt-1">Determines the redemption flow</p>
                            </div>

                            <div>
                                <Label required>Section</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={formData.section}
                                        onChange={e => setFormData({ ...formData, section: e.target.value })}
                                        className="flex-1"
                                    >
                                        {sections.map(s => <option key={s} value={s}>{s}</option>)}
                                    </Select>
                                    <button
                                        type="button"
                                        onClick={handleNewSection}
                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 border border-slate-200 font-medium text-xs whitespace-nowrap"
                                    >
                                        + New
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label>Image URL</Label>
                                <Input
                                    value={formData.imageUrl || ""}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Input
                                    value={formData.description || ""}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="For wildcard/protection tiles..."
                                />
                            </div>
                        </div>

                        {/* Featured toggle */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isFeatured}
                                    onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="font-bold text-slate-900 block">Mark as Featured Offer</span>
                                    <span className="text-xs text-slate-500">Will appear in the main Hero Carousel</span>
                                </div>
                            </label>

                            {formData.isFeatured && (
                                <div className="mt-4 pl-8 space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <Label>Featured Headline</Label>
                                        <Input
                                            value={formData.featuredHeadline || ""}
                                            onChange={e => setFormData({ ...formData, featuredHeadline: e.target.value })}
                                            placeholder="You're preapproved!"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">15-28 characters recommended</p>
                                    </div>
                                    <div>
                                        <Label>Featured Description</Label>
                                        <Input
                                            value={formData.featuredDescription || ""}
                                            onChange={e => setFormData({ ...formData, featuredDescription: e.target.value })}
                                            placeholder="Short description for the hero..."
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Max 100 characters recommended</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Redeemed toggle */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isRedeemed}
                                    onChange={e => setFormData({ ...formData, isRedeemed: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                                />
                                <div>
                                    <span className="font-bold text-slate-900 block">Mark as Redeemed</span>
                                    <span className="text-xs text-slate-500">Card will be greyed out and non-clickable</span>
                                </div>
                            </label>
                        </div>

                        {/* Attributes */}
                        <div>
                            <Label>Key Attributes</Label>
                            <p className="text-xs text-slate-500 mb-3">Values shown on the card (e.g. "Up to $40,000", "As low as 3.62% APR")</p>
                            <div className="space-y-3">
                                {(formData.attributes || []).map((attr, idx) => (
                                    <div key={idx} className="flex gap-3 items-start">
                                        <Input
                                            placeholder="Label (e.g. Up to)"
                                            value={attr.label}
                                            onChange={e => handleAttributeChange(idx, 'label', e.target.value)}
                                            className="flex-1"
                                        />
                                        <Input
                                            placeholder="Value (e.g. $40,000)"
                                            value={attr.value}
                                            onChange={e => handleAttributeChange(idx, 'value', e.target.value)}
                                            className="flex-1"
                                        />
                                        <Input
                                            placeholder="Subtext (e.g. APR*†)"
                                            value={attr.subtext || ""}
                                            onChange={e => handleAttributeChange(idx, 'subtext', e.target.value)}
                                            className="w-32"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newAttrs = formData.attributes?.filter((_, i) => i !== idx);
                                                setFormData({ ...formData, attributes: newAttrs });
                                            }}
                                            className="p-2 text-slate-400 hover:text-rose-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, attributes: [...(formData.attributes || []), { label: "", value: "" }] })}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1"
                                >
                                    <Plus className="w-3 h-3" /> Add Attribute
                                </button>
                            </div>
                        </div>

                    </div>

                    <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            {editingId ? "Update Offer" : "Create Offer"}
                        </button>
                    </div>
                </form>
            )}

        </div>
    );
}
