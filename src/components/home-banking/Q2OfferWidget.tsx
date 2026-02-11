"use client";

import { ChevronRight, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/context/StoreContext";
import type { Offer } from "@/context/StoreContext";
import { CreditMountainCard } from "@/components/storefront/CreditMountainCard";
import { PrequalificationWidget } from "@/components/home-banking/PrequalificationWidget";
import { useStorefront } from "@/hooks/useStorefront";

type WidgetView = 'list' | 'details' | 'review' | 'vehicle' | 'contact' | 'terms' | 'confirmation';

interface ApplicationData {
    loanAmount: string;
    term: string;
    monthlyPayment: number;
    withCoBorrower: boolean;
    wantsGAP: boolean;
    agreedToDisclosures: boolean;
    // Vehicle info
    vin: string;
    year: string;
    make: string;
    model: string;
    trim: string;
    estimatedValue: string;
    mileage: string;
    // Contact info
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    // Terms
    agreedToTerms: boolean;
    agreedToESign: boolean;
}

export function Q2OfferWidget() {
    const { storefrontConfig, updateOffer, featureFlags } = useStore();
    const { sections, isCreditMountainGraduate, hasOffers } = useStorefront();

    const [expanded, setExpanded] = useState(true);
    const [currentView, setCurrentView] = useState<WidgetView>('list');
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [activeTab, setActiveTab] = useState<'amount' | 'payment'>('amount');
    const [applicationData, setApplicationData] = useState<ApplicationData>({
        loanAmount: '',
        term: '60 months (4.24%*)',
        monthlyPayment: 0,
        withCoBorrower: false,
        wantsGAP: true,
        agreedToDisclosures: false,
        vin: '',
        year: '',
        make: '',
        model: '',
        trim: '',
        estimatedValue: '',
        mileage: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        agreedToTerms: false,
        agreedToESign: false
    });

    // Get visible sections based on expanded state
    const visibleSections = expanded ? sections : sections.slice(0, 1);

    const getBadge = (variant: string) => {
        switch (variant) {
            case 'preapproved':
            case 'auto-refi':
            case 'credit-limit':
                return { text: "YOU'RE PREAPPROVED!", className: "bg-green-500 text-white" };
            case 'ita':
                return { text: "APPLY NOW", className: "bg-purple-500 text-white" };
            default:
                return null;
        }
    };

    const calculateMonthlyPayment = (amount: number, termMonths: number = 60, apr: number = 4.24) => {
        if (!amount || amount <= 0) return 0;
        const monthlyRate = apr / 100 / 12;
        const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
                       (Math.pow(1 + monthlyRate, termMonths) - 1);
        return payment;
    };

    const handleOfferClick = (offer: Offer) => {
        setSelectedOffer(offer);
        setCurrentView('details');
        setApplicationData({
            loanAmount: '',
            term: '60 months (4.24%*)',
            monthlyPayment: 0,
            withCoBorrower: false,
            wantsGAP: true,
            agreedToDisclosures: false,
            vin: '',
            year: '',
            make: '',
            model: '',
            trim: '',
            estimatedValue: '',
            mileage: '',
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            agreedToTerms: false,
            agreedToESign: false
        });
    };

    const handleFinish = () => {
        if (selectedOffer) {
            updateOffer({
                ...selectedOffer,
                isRedeemed: true,
                redeemedTitle: `You've redeemed this ${selectedOffer.title.toLowerCase()} offer!`
            });
        }
        setCurrentView('list');
        setSelectedOffer(null);
    };

    const handleBack = () => {
        switch (currentView) {
            case 'confirmation':
                handleFinish();
                break;
            case 'terms':
                setCurrentView('contact');
                break;
            case 'contact':
                setCurrentView('vehicle');
                break;
            case 'vehicle':
                setCurrentView('review');
                break;
            case 'review':
                setCurrentView('details');
                break;
            case 'details':
                setCurrentView('list');
                setSelectedOffer(null);
                break;
        }
    };

    const handleAmountChange = (value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        const amount = parseInt(numericValue) || 0;
        setApplicationData(prev => ({
            ...prev,
            loanAmount: numericValue ? `$${parseInt(numericValue).toLocaleString()}` : '',
            monthlyPayment: calculateMonthlyPayment(amount)
        }));
    };

    const updateField = (field: keyof ApplicationData, value: string | boolean) => {
        setApplicationData(prev => ({ ...prev, [field]: value }));
    };

    // Count total offers for show more/less button
    const totalOffers = sections.reduce((sum, s) => sum + s.offers.length, 0);

    if (sections.length === 0) {
        return null;
    }

    // Offer List View
    if (currentView === 'list') {
        return (
            <div className="space-y-3">
                {/* Consumer Prequalification Widget */}
                {featureFlags.consumer_prequalification && (
                    <PrequalificationWidget />
                )}

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 space-y-6">
                        {/* Render all sections from useStorefront */}
                        {visibleSections.map((section) => (
                            <div key={section.name}>
                                {/* Section Header */}
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    {section.name}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Credit Mountain Card for Credit Mountain section */}
                                    {section.isCreditMountain && (
                                        <CreditMountainCard variant="widget" />
                                    )}

                                    {/* Section offers */}
                                    {section.offers.map((offer) => {
                                        const badge = getBadge(offer.variant);
                                        const isGraduateOffer = section.isCreditMountain && isCreditMountainGraduate;
                                        return (
                                            <button
                                                key={offer.id}
                                                onClick={() => handleOfferClick(offer as Offer)}
                                                className={cn(
                                                    "group rounded-lg border p-3 hover:shadow-md transition-shadow flex items-center gap-3 text-left w-full",
                                                    isGraduateOffer
                                                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                                                        : "bg-white border-gray-200"
                                                )}
                                            >
                                                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                                                    <img
                                                        src={offer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=200&q=80"}
                                                        alt={offer.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {isGraduateOffer ? (
                                                        <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mb-1 bg-green-500 text-white">
                                                            NEW OPPORTUNITY
                                                        </span>
                                                    ) : badge && (
                                                        <span className={cn(
                                                            "inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mb-1",
                                                            badge.className
                                                        )}>
                                                            {badge.text}
                                                        </span>
                                                    )}
                                                    <h4 className="font-medium text-gray-900 text-sm truncate">
                                                        {offer.title}
                                                    </h4>
                                                    {offer.attributes && offer.attributes.length > 0 && (
                                                        <div className="flex gap-4 mt-0.5">
                                                            {offer.attributes.slice(0, 2).map((attr, idx) => (
                                                                <div key={idx} className="text-xs">
                                                                    <span className="text-gray-500">{attr.label}</span>
                                                                    <span className="font-bold text-gray-900 ml-1">
                                                                        {attr.value}
                                                                        {attr.subtext && (
                                                                            <span className="font-normal text-gray-500 text-[10px] ml-0.5">
                                                                                {attr.subtext}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <ChevronRight className={cn(
                                                    "w-5 h-5 shrink-0",
                                                    isGraduateOffer ? "text-green-600" : "text-gray-400"
                                                )} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalOffers > 1 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="w-full py-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 border-t border-gray-100"
                        >
                            {expanded ? (
                                <>Show Less <ChevronUp className="w-4 h-4" /></>
                            ) : (
                                <>Show More <ChevronDown className="w-4 h-4" /></>
                            )}
                        </button>
                    )}

                    <div className="px-4 pb-4 pt-2 text-[11px] text-gray-500 leading-relaxed border-t border-gray-100">
                        {storefrontConfig.footerDisclaimer}
                    </div>
                </div>
            </div>
        );
    }

    // Step 1: Offer Details View
    if (currentView === 'details' && selectedOffer) {
        const maxAmount = parseInt(selectedOffer.attributes?.[0]?.value?.replace(/[^0-9]/g, '') || '60000');

        return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-h-[500px] overflow-y-auto">
                <div className="p-4">
                    {/* Title */}
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {selectedOffer.title}
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Great news! You're pre-approved for this new Auto offer. To take advantage of this offer, just answer a few questions and we'll take care of the rest.
                    </p>

                    {/* Hero Image */}
                    <div className="rounded-lg overflow-hidden mb-4">
                        <img
                            src={selectedOffer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"}
                            alt={selectedOffer.title}
                            className="w-full h-40 object-cover"
                        />
                    </div>

                    {/* Badge */}
                    <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-[#5B9A8B] text-white mb-3">
                        YOU'RE PREAPPROVED
                    </span>

                    {/* Up to Amount */}
                    <div className="mb-4">
                        <span className="text-gray-600">Up to </span>
                        <span className="text-2xl font-bold text-gray-900">${maxAmount.toLocaleString()}</span>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 mb-4">
                        <button
                            onClick={() => setActiveTab('amount')}
                            className={cn(
                                "pb-2 px-1 text-sm font-medium border-b-2 -mb-px",
                                activeTab === 'amount'
                                    ? "border-gray-900 text-gray-900"
                                    : "border-transparent text-gray-500"
                            )}
                        >
                            Loan Amount
                        </button>
                        <button
                            onClick={() => setActiveTab('payment')}
                            className={cn(
                                "pb-2 px-4 text-sm font-medium border-b-2 -mb-px ml-4",
                                activeTab === 'payment'
                                    ? "border-gray-900 text-gray-900"
                                    : "border-transparent text-gray-500"
                            )}
                        >
                            Monthly Payment
                        </button>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Requested Loan Amount:</label>
                            <input
                                type="text"
                                value={applicationData.loanAmount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                placeholder="Enter loan amount"
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Term & APR:</label>
                            <div className="relative">
                                <select
                                    value={applicationData.term}
                                    onChange={(e) => updateField('term', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option>36 months (3.99%*)</option>
                                    <option>48 months (4.09%*)</option>
                                    <option>60 months (4.24%*)</option>
                                    <option>72 months (4.49%*)</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-2 border-t border-gray-100">
                            <span className="text-sm text-gray-600">Estimated Monthly Payment:</span>
                            <span className="text-lg font-bold text-gray-900">
                                {applicationData.monthlyPayment > 0 ? `$${applicationData.monthlyPayment.toFixed(2)}` : '—'}
                            </span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button onClick={handleBack} className="flex-1 py-3 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50">
                            BACK
                        </button>
                        <button onClick={() => setCurrentView('review')} className="flex-1 py-3 bg-[#4A7C94] hover:bg-[#3d6579] text-white text-sm font-semibold rounded-lg">
                            CONTINUE
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <button className="text-sm text-gray-600 underline">Details & disclosures</button>
                    </div>

                    {/* Disclaimers */}
                    <div className="mt-4 text-[10px] text-gray-400 space-y-2">
                        <p>*An annual percentage rate (APR) is the annual rate charged for borrowing or earned through an investment, and is expressed as a percentage that represents the actual yearly cost of funds over the term of a loan.</p>
                        <p>** [Additional product-specific disclosure block goes here lorem ipsum dolor sit amet, consectetur adipiscing elit.]</p>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Review & Submit View
    if (currentView === 'review' && selectedOffer) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-h-[500px] overflow-y-auto">
                <div className="p-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        Review & Submit Your {selectedOffer.title} Application
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Please review your requested terms. If everything looks good, click "Continue."
                    </p>

                    {/* Hero Image */}
                    <div className="rounded-lg overflow-hidden mb-4">
                        <img
                            src={selectedOffer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"}
                            alt={selectedOffer.title}
                            className="w-full h-36 object-cover"
                        />
                    </div>

                    {/* Badge */}
                    <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-orange-500 text-white mb-4">
                        APPLY NOW
                    </span>

                    {/* Summary */}
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Requested loan amount:</span>
                            <span className="font-semibold text-gray-900">{applicationData.loanAmount || '$##,###.##'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Term & APR*†:</span>
                            <span className="font-semibold text-gray-900">{applicationData.term}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Guaranteed Asset Protection:</span>
                            <span className="font-semibold text-gray-900">{applicationData.wantsGAP ? 'Interested' : 'Not interested'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Estimated monthly payment:</span>
                            <span className="font-semibold text-gray-900">{applicationData.monthlyPayment > 0 ? `$${applicationData.monthlyPayment.toFixed(2)}` : '$###.##'}</span>
                        </div>
                    </div>

                    {/* Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer mb-4">
                        <input
                            type="checkbox"
                            checked={applicationData.agreedToDisclosures}
                            onChange={(e) => updateField('agreedToDisclosures', e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                            I have read & agree to the <button className="text-blue-600 underline">Details & Disclosures</button>
                        </span>
                    </label>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button onClick={handleBack} className="flex-1 py-3 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50">
                            BACK
                        </button>
                        <button onClick={() => setCurrentView('vehicle')} className="flex-1 py-3 bg-[#4A7C94] hover:bg-[#3d6579] text-white text-sm font-semibold rounded-lg">
                            CONTINUE
                        </button>
                    </div>

                    {/* Disclaimers */}
                    <div className="mt-4 text-[10px] text-gray-400 space-y-2">
                        <p>* [Configured by admin An annual percentage rate (APR) is the annual rate charged for borrowing...]</p>
                        <p>† [Configured by admin.Additional product-specific disclosure block goes here...]</p>
                    </div>
                </div>
            </div>
        );
    }

    // Step 3: Vehicle Information View
    if (currentView === 'vehicle' && selectedOffer) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-h-[500px] overflow-y-auto">
                {/* Header */}
                <div className="px-4 py-2 bg-gray-700 text-white text-sm">
                    Pre-Approval Offer: [{selectedOffer.title}]
                </div>

                <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-[#5B9A8B] rounded flex items-center justify-center">
                            <span className="text-white text-xs">≡</span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-700">Offer Redemption</h4>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                        <h5 className="text-xl font-semibold text-gray-700 mb-1">Verify Vehicle Information</h5>
                        <p className="text-sm text-gray-500 mb-4">
                            Vehicle details are optional, but anything you're able to provide now may help expedite processing.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">VIN (optional)</label>
                                <input
                                    type="text"
                                    value={applicationData.vin}
                                    onChange={(e) => updateField('vin', e.target.value)}
                                    placeholder="Enter VIN"
                                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Year (optional)</label>
                                    <div className="relative">
                                        <select
                                            value={applicationData.year}
                                            onChange={(e) => updateField('year', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg appearance-none"
                                        >
                                            <option value="">Select vehicle year</option>
                                            {[2024, 2023, 2022, 2021, 2020].map(y => <option key={y}>{y}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Make (optional)</label>
                                    <input
                                        type="text"
                                        value={applicationData.make}
                                        onChange={(e) => updateField('make', e.target.value)}
                                        placeholder="Enter vehicle make"
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Model (optional)</label>
                                    <input
                                        type="text"
                                        value={applicationData.model}
                                        onChange={(e) => updateField('model', e.target.value)}
                                        placeholder="Enter vehicle model"
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Trim (optional)</label>
                                    <input
                                        type="text"
                                        value={applicationData.trim}
                                        onChange={(e) => updateField('trim', e.target.value)}
                                        placeholder="Enter vehicle trim"
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Estimated Value</label>
                                    <input
                                        type="text"
                                        value={applicationData.estimatedValue}
                                        onChange={(e) => updateField('estimatedValue', e.target.value)}
                                        placeholder="Enter estimated vehicle value"
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Vehicle Mileage (optional)</label>
                                    <input
                                        type="text"
                                        value={applicationData.mileage}
                                        onChange={(e) => updateField('mileage', e.target.value)}
                                        placeholder="Enter vehicle mileage"
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-6">
                        <button onClick={handleBack} className="w-full py-3 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-50">
                            BACK
                        </button>
                        <button onClick={() => setCurrentView('contact')} className="w-full py-3 bg-[#4A7C94] hover:bg-[#3d6579] text-white text-sm font-semibold rounded-full">
                            CONTINUE
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Step 4: Contact Information View
    if (currentView === 'contact' && selectedOffer) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-h-[500px] overflow-y-auto">
                {/* Header */}
                <div className="px-4 py-2 bg-gray-700 text-white text-sm">
                    Pre-Approval Offer: [{selectedOffer.title}]
                </div>

                <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-[#5B9A8B] rounded flex items-center justify-center">
                            <span className="text-white text-xs">≡</span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-700">Offer Redemption</h4>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                        <h5 className="text-xl font-semibold text-gray-700 mb-4">Contact Information</h5>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">First Name</label>
                                <input
                                    type="text"
                                    value={applicationData.firstName}
                                    onChange={(e) => updateField('firstName', e.target.value)}
                                    placeholder="Enter your first name"
                                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    value={applicationData.lastName}
                                    onChange={(e) => updateField('lastName', e.target.value)}
                                    placeholder="Enter your last name"
                                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={applicationData.phone}
                                    onChange={(e) => updateField('phone', e.target.value)}
                                    placeholder="Enter your phone number"
                                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={applicationData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    placeholder="Enter your email address"
                                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-6">
                        <button onClick={handleBack} className="w-full py-3 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-50">
                            BACK
                        </button>
                        <button onClick={() => setCurrentView('terms')} className="w-full py-3 bg-[#4A7C94] hover:bg-[#3d6579] text-white text-sm font-semibold rounded-full">
                            CONTINUE
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Step 5: Terms & Conditions View
    if (currentView === 'terms' && selectedOffer) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-h-[500px] overflow-y-auto">
                <div className="p-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        Review & Submit Your {selectedOffer.title} Application
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Please review your requested terms. If everything looks good, click "Continue."
                    </p>

                    {/* Hero Image */}
                    <div className="rounded-lg overflow-hidden mb-4">
                        <img
                            src={selectedOffer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"}
                            alt={selectedOffer.title}
                            className="w-full h-32 object-cover"
                        />
                    </div>

                    {/* Badge */}
                    <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-orange-500 text-white mb-4">
                        APPLY NOW
                    </span>

                    {/* Terms and Conditions */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms and Conditions</h3>
                    <div className="text-xs text-gray-600 space-y-3 mb-4 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <p className="font-semibold">[Configured in Admin]</p>
                        <p>You authorize [the Credit Union] to obtain credit reports in connection with this application for credit and for any update, increase, renewal, extension, or collection of the credit received...</p>
                        <p>If your loan is approved, the loan terms and interest rate will depend on your creditworthiness. If your loan is not approved, we may counteroffer with different terms or deny your loan application...</p>
                        <p>By applying, you acknowledge the interest rate shown throughout this application will differ from the Annual Percentage Rate (APR) that will be disclosed if your application is approved...</p>
                        <p className="font-semibold">State Notices:</p>
                        <p>Ohio Residents Only: The Ohio laws against discrimination require that all creditors make credit equally available to all creditworthy customers...</p>
                    </div>

                    {/* Consent to Electronic Documents */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Consent to Electronic Documents and Signatures</h3>
                    <p className="text-xs text-gray-600 mb-3">
                        To submit an application electronically, you must consent to the use of electronic documents and signatures in connection with your request for credit.
                    </p>
                    <p className="text-xs text-blue-600 underline mb-4">Click to Access Electronic Documents and Signatures PDF</p>

                    {/* Checkboxes */}
                    <div className="space-y-3 mb-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={applicationData.agreedToTerms}
                                onChange={(e) => updateField('agreedToTerms', e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">I agree to Terms and Conditions.</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={applicationData.agreedToESign}
                                onChange={(e) => updateField('agreedToESign', e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">I accessed the Electronic Documents and Signatures PDF and agree to the terms.</span>
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button onClick={handleBack} className="flex-1 py-3 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50">
                            BACK
                        </button>
                        <button
                            onClick={() => setCurrentView('confirmation')}
                            disabled={!applicationData.agreedToTerms || !applicationData.agreedToESign}
                            className={cn(
                                "flex-1 py-3 text-white text-sm font-semibold rounded-lg",
                                applicationData.agreedToTerms && applicationData.agreedToESign
                                    ? "bg-[#4A7C94] hover:bg-[#3d6579]"
                                    : "bg-gray-300 cursor-not-allowed"
                            )}
                        >
                            FINISH
                        </button>
                    </div>

                    {/* Disclaimers */}
                    <div className="mt-4 text-[10px] text-gray-400 space-y-2">
                        <p>* [Configured by admin An annual percentage rate (APR) is the annual rate charged...]</p>
                        <p>† [Configured by admin.Additional product-specific disclosure block...]</p>
                    </div>
                </div>
            </div>
        );
    }

    // Step 6: Confirmation View
    if (currentView === 'confirmation' && selectedOffer) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-8 text-center">
                    <div className="w-48 h-32 mx-auto mb-6 rounded-lg overflow-hidden">
                        <img
                            src={selectedOffer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80"}
                            alt="Success"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                        That Was Easy!
                    </h3>

                    <p className="text-gray-600 mb-6">
                        We're processing your request and will be in touch shortly.
                        <br />
                        Questions? Please contact us at [tenant phone].
                    </p>

                    <button
                        onClick={handleFinish}
                        className="px-8 py-3 bg-[#4A7C94] hover:bg-[#3d6579] text-white text-sm font-semibold rounded-full"
                    >
                        OKAY
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
