"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronDown, Lock } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { OfferVariant } from "@/context/StoreContext";

type ApplyStep = 'details' | 'review' | 'vehicle' | 'contact' | 'terms';

const VEHICLE_PRODUCT_TYPES = ['auto-loan', 'auto-refi'];

interface ApplicationData {
    loanAmount: string;
    term: string;
    monthlyPayment: number;
    wantsGAP: boolean;
    agreedToDisclosures: boolean;
    vin: string;
    year: string;
    make: string;
    model: string;
    trim: string;
    estimatedValue: string;
    mileage: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    agreedToTerms: boolean;
    agreedToESign: boolean;
}

export default function StrangerApplyPage() {
    const params = useParams();
    const router = useRouter();
    const { offers, strangerOffers } = useStore();

    const offerId = params.id as string;
    const offer = offers.find(o => o.id === offerId);
    const strangerConfig = strangerOffers.find(so => so.offerId === offerId);
    const displayVariant: OfferVariant = strangerConfig?.variant || offer?.variant || 'ita';

    // Redirect new-member offers to the dedicated membership application
    const isNewMember = displayVariant === 'new-member';
    useEffect(() => {
        if (isNewMember) {
            router.replace('/stranger-storefront/apply/membership');
        }
    }, [isNewMember, router]);

    const [currentStep, setCurrentStep] = useState<ApplyStep>('details');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applicationData, setApplicationData] = useState<ApplicationData>({
        loanAmount: '',
        term: '60 months (4.24%*)',
        monthlyPayment: 0,
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
        agreedToESign: false,
    });

    // While redirecting new-member offers, show nothing
    if (isNewMember) {
        return null;
    }

    if (!offer) {
        return (
            <div className="min-h-screen bg-[#E8EBED] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-[#262C30] mb-2">Offer Not Found</h1>
                    <p className="text-[#677178] mb-4">This offer may no longer be available.</p>
                    <Link href="/stranger-storefront" className="text-[#143C67] underline hover:no-underline">
                        Return to Storefront
                    </Link>
                </div>
            </div>
        );
    }

    const calculateMonthlyPayment = (amount: number, termMonths: number = 60, apr: number = 4.24) => {
        if (!amount || amount <= 0) return 0;
        const monthlyRate = apr / 100 / 12;
        return (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
               (Math.pow(1 + monthlyRate, termMonths) - 1);
    };

    const handleAmountChange = (value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        const amount = parseInt(numericValue) || 0;
        setApplicationData(prev => ({
            ...prev,
            loanAmount: numericValue ? `$${parseInt(numericValue).toLocaleString()}` : '',
            monthlyPayment: calculateMonthlyPayment(amount),
        }));
    };

    const updateField = (field: keyof ApplicationData, value: string | boolean) => {
        setApplicationData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        // Build query params with contact data for prefilling membership app
        const prefillParams = new URLSearchParams();
        if (applicationData.firstName) prefillParams.set('firstName', applicationData.firstName);
        if (applicationData.lastName) prefillParams.set('lastName', applicationData.lastName);
        if (applicationData.phone) prefillParams.set('phone', applicationData.phone);
        if (applicationData.email) prefillParams.set('email', applicationData.email);
        prefillParams.set('fromOffer', offer.id);
        prefillParams.set('offerTitle', offer.title);

        const queryString = prefillParams.toString();
        setTimeout(() => {
            router.push(`/stranger-storefront/offer/${offer.id}/confirmation?${queryString}`);
        }, 800);
    };

    const requiresVehicleInfo = VEHICLE_PRODUCT_TYPES.includes(offer.productType);

    const handleBack = () => {
        switch (currentStep) {
            case 'terms': setCurrentStep('contact'); break;
            case 'contact': setCurrentStep(requiresVehicleInfo ? 'vehicle' : 'review'); break;
            case 'vehicle': setCurrentStep('review'); break;
            case 'review': setCurrentStep('details'); break;
            case 'details': router.back(); break;
        }
    };

    const handleContinue = () => {
        switch (currentStep) {
            case 'details': setCurrentStep('review'); break;
            case 'review': setCurrentStep(requiresVehicleInfo ? 'vehicle' : 'contact'); break;
            case 'vehicle': setCurrentStep('contact'); break;
            case 'contact': setCurrentStep('terms'); break;
            case 'terms': handleSubmit(); break;
        }
    };

    const maxAmount = parseInt(offer.attributes?.[0]?.value?.replace(/[^0-9]/g, '') || '60000');

    const getStepNumber = () => {
        if (requiresVehicleInfo) {
            switch (currentStep) {
                case 'details': return 1;
                case 'review': return 2;
                case 'vehicle': return 3;
                case 'contact': return 4;
                case 'terms': return 5;
            }
        } else {
            switch (currentStep) {
                case 'details': return 1;
                case 'review': return 2;
                case 'contact': return 3;
                case 'terms': return 4;
            }
        }
    };

    const getStepLabels = () => {
        if (requiresVehicleInfo) {
            return ['Details', 'Review', 'Vehicle', 'Contact', 'Terms', 'Confirm'];
        }
        return ['Details', 'Review', 'Contact', 'Terms', 'Confirm'];
    };

    const canContinue = () => {
        if (currentStep === 'terms') {
            return applicationData.agreedToTerms && applicationData.agreedToESign;
        }
        return true;
    };

    const getBadgeForVariant = () => {
        switch (displayVariant) {
            case 'preapproved':
            case 'auto-refi':
            case 'credit-limit':
                return <span className="inline-block text-xs font-bold px-3 py-1.5 rounded bg-[#7CEB87] text-[#1a472a] uppercase tracking-wide mb-3">You&apos;re Preapproved</span>;
            case 'ita':
                return <span className="inline-block text-xs font-bold px-3 py-1.5 rounded bg-[#C4B5FD] text-[#4c1d95] uppercase tracking-wide mb-3">Apply Now</span>;
            default:
                return <span className="inline-block text-xs font-bold px-3 py-1.5 rounded bg-[#374151] text-white uppercase tracking-wide mb-3">Special Offer</span>;
        }
    };

    const getIntroText = () => {
        switch (displayVariant) {
            case 'preapproved':
            case 'auto-refi':
            case 'credit-limit':
                return "Great news! You're pre-approved for this offer. Answer a few questions and we'll take care of the rest.";
            case 'ita':
                return "You're invited to apply for this offer. Complete the details below to get started.";
            default:
                return "Take advantage of this special offer. Complete the details below to apply.";
        }
    };

    return (
        <div className="min-h-screen bg-[#E8EBED] font-sans text-[#262C30]">
            {/* Navigation */}
            <nav className="bg-white px-6 lg:px-8 h-14 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1 text-[13px] font-medium text-[#677178] hover:text-[#262C30] transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="h-5 w-px bg-gray-200" />
                    <Link href="/stranger-storefront" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#143C67] rounded flex items-center justify-center">
                            <div className="grid grid-cols-2 gap-[2px] w-3.5 h-3.5">
                                <div className="bg-white rounded-[1px]"></div>
                                <div className="bg-white rounded-[1px]"></div>
                                <div className="bg-white rounded-[1px]"></div>
                                <div className="bg-white/50 rounded-[1px]"></div>
                            </div>
                        </div>
                        <span className="text-[15px] font-semibold text-[#143C67]">Credit Union</span>
                    </Link>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-[#677178]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Secure Application</span>
                </div>
            </nav>

            <main className="max-w-[700px] mx-auto px-6 lg:px-8 py-8">
                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto">
                    {getStepLabels().map((step, idx) => {
                        const stepNum = idx + 1;
                        const isActive = stepNum === getStepNumber();
                        const isComplete = stepNum < (getStepNumber() || 0);
                        const totalSteps = getStepLabels().length;
                        return (
                            <div key={step} className="flex items-center">
                                <div className="flex items-center gap-1.5">
                                    <div className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold",
                                        isComplete ? "bg-[#22C55E] text-white" :
                                        isActive ? "bg-[#143C67] text-white" :
                                        "bg-gray-300 text-[#677178]"
                                    )}>
                                        {stepNum}
                                    </div>
                                    <span className={cn(
                                        "text-[11px] font-medium hidden sm:block",
                                        isActive ? "text-[#262C30]" : "text-[#677178]"
                                    )}>
                                        {step}
                                    </span>
                                </div>
                                {idx < totalSteps - 1 && <div className="w-4 h-px bg-gray-300 mx-1" />}
                            </div>
                        );
                    })}
                </div>

                {/* Step 1: Offer Details */}
                {currentStep === 'details' && (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                        <div className="relative w-full aspect-[3/1]">
                            <img
                                src={offer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80"}
                                alt={offer.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="p-6 lg:p-8">
                            {getBadgeForVariant()}

                            <h1 className="text-2xl font-semibold text-[#262C30] mb-2">{offer.title}</h1>
                            <p className="text-[14px] text-[#677178] mb-6">{getIntroText()}</p>

                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <span className="text-[#677178]">Up to </span>
                                <span className="text-3xl font-bold text-[#262C30]">${maxAmount.toLocaleString()}</span>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-2">Requested Loan Amount</label>
                                    <input
                                        type="text"
                                        value={applicationData.loanAmount}
                                        onChange={(e) => handleAmountChange(e.target.value)}
                                        placeholder="Enter loan amount"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[15px] text-[#262C30] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#143C67] focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-2">Term & APR</label>
                                    <div className="relative">
                                        <select
                                            value={applicationData.term}
                                            onChange={(e) => updateField('term', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[15px] text-[#262C30] appearance-none focus:outline-none focus:ring-2 focus:ring-[#143C67] focus:border-transparent bg-white"
                                        >
                                            <option>36 months (3.99%*)</option>
                                            <option>48 months (4.09%*)</option>
                                            <option>60 months (4.24%*)</option>
                                            <option>72 months (4.49%*)</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between py-4 bg-[#F9FAFB] rounded-lg px-4">
                                    <span className="text-[14px] text-[#677178]">Estimated Monthly Payment:</span>
                                    <span className="text-xl font-bold text-[#262C30]">
                                        {applicationData.monthlyPayment > 0 ? `$${applicationData.monthlyPayment.toFixed(2)}` : '—'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                <button onClick={handleContinue} className="flex-1 py-3 bg-[#262C30] hover:bg-black text-white text-[13px] font-bold tracking-wider uppercase rounded-full transition-colors">
                                    Continue
                                </button>
                                <button onClick={handleBack} className="flex-1 py-3 border border-gray-300 text-[#262C30] text-[13px] font-medium rounded-full hover:border-gray-400 transition-colors">
                                    Back
                                </button>
                            </div>

                            <div className="text-center mt-4">
                                <button className="text-[13px] text-[#677178] underline">Details & disclosures</button>
                            </div>

                            <div className="mt-6 text-[11px] text-[#9CA3AF] space-y-2">
                                <p>*An annual percentage rate (APR) is the annual rate charged for borrowing or earned through an investment, and is expressed as a percentage that represents the actual yearly cost of funds over the term of a loan.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Review */}
                {currentStep === 'review' && (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                        <div className="relative w-full aspect-[4/1]">
                            <img src={offer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80"} alt={offer.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="p-6 lg:p-8">
                            {getBadgeForVariant()}

                            <h1 className="text-xl font-semibold text-[#262C30] mb-2">Review & Submit Your {offer.title} Application</h1>
                            <p className="text-[14px] text-[#677178] mb-6">Please review your requested terms. If everything looks good, click &quot;Continue.&quot;</p>

                            <div className="bg-[#F9FAFB] rounded-lg p-5 mb-6 space-y-3">
                                <div className="flex justify-between text-[14px]">
                                    <span className="text-[#677178]">Requested loan amount:</span>
                                    <span className="font-semibold text-[#262C30]">{applicationData.loanAmount || '$##,###.##'}</span>
                                </div>
                                <div className="flex justify-between text-[14px]">
                                    <span className="text-[#677178]">Term & APR*†:</span>
                                    <span className="font-semibold text-[#262C30]">{applicationData.term}</span>
                                </div>
                                <div className="flex justify-between text-[14px]">
                                    <span className="text-[#677178]">Guaranteed Asset Protection:</span>
                                    <span className="font-semibold text-[#262C30]">{applicationData.wantsGAP ? 'Interested' : 'Not interested'}</span>
                                </div>
                                <div className="flex justify-between text-[14px] pt-2 border-t border-gray-200">
                                    <span className="text-[#677178]">Estimated monthly payment:</span>
                                    <span className="font-bold text-lg text-[#262C30]">{applicationData.monthlyPayment > 0 ? `$${applicationData.monthlyPayment.toFixed(2)}` : '$###.##'}</span>
                                </div>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer mb-6">
                                <input type="checkbox" checked={applicationData.agreedToDisclosures} onChange={(e) => updateField('agreedToDisclosures', e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#143C67] focus:ring-[#143C67]" />
                                <span className="text-[13px] text-[#374151]">I have read & agree to the <button className="text-[#143C67] underline">Details & Disclosures</button></span>
                            </label>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={handleContinue} className="flex-1 py-3 bg-[#262C30] hover:bg-black text-white text-[13px] font-bold tracking-wider uppercase rounded-full transition-colors">Continue</button>
                                <button onClick={handleBack} className="flex-1 py-3 border border-gray-300 text-[#262C30] text-[13px] font-medium rounded-full hover:border-gray-400 transition-colors">Back</button>
                            </div>

                            <div className="mt-6 text-[11px] text-[#9CA3AF] space-y-2">
                                <p>* [Configured by admin] An annual percentage rate (APR) is the annual rate charged for borrowing...</p>
                                <p>† [Configured by admin] Additional product-specific disclosure block goes here...</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Vehicle Information */}
                {currentStep === 'vehicle' && (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                        <div className="px-6 py-3 bg-[#374151] text-white text-[13px]">
                            Offer Application: {offer.title}
                        </div>

                        <div className="p-6 lg:p-8">
                            <h1 className="text-xl font-semibold text-[#374151] mb-2">Verify Vehicle Information</h1>
                            <p className="text-[14px] text-[#677178] mb-6">Vehicle details are optional, but anything you&apos;re able to provide now may help expedite processing.</p>

                            <div className="bg-[#F9FAFB] rounded-xl p-6 space-y-5">
                                <div>
                                    <label className="block text-[13px] text-[#677178] mb-2">VIN (optional)</label>
                                    <input type="text" value={applicationData.vin} onChange={(e) => updateField('vin', e.target.value)} placeholder="Enter VIN" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px]" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] text-[#677178] mb-2">Year (optional)</label>
                                        <div className="relative">
                                            <select value={applicationData.year} onChange={(e) => updateField('year', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px] appearance-none">
                                                <option value="">Select vehicle year</option>
                                                {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => <option key={y}>{y}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-[#677178] mb-2">Make (optional)</label>
                                        <input type="text" value={applicationData.make} onChange={(e) => updateField('make', e.target.value)} placeholder="Enter vehicle make" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px]" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] text-[#677178] mb-2">Model (optional)</label>
                                        <input type="text" value={applicationData.model} onChange={(e) => updateField('model', e.target.value)} placeholder="Enter vehicle model" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px]" />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-[#677178] mb-2">Trim (optional)</label>
                                        <input type="text" value={applicationData.trim} onChange={(e) => updateField('trim', e.target.value)} placeholder="Enter vehicle trim" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px]" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] text-[#677178] mb-2">Estimated Value (optional)</label>
                                        <input type="text" value={applicationData.estimatedValue} onChange={(e) => updateField('estimatedValue', e.target.value)} placeholder="Enter estimated vehicle value" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px]" />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-[#677178] mb-2">Mileage (optional)</label>
                                        <input type="text" value={applicationData.mileage} onChange={(e) => updateField('mileage', e.target.value)} placeholder="Enter vehicle mileage" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px]" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                <button onClick={handleContinue} className="flex-1 py-3 bg-[#262C30] hover:bg-black text-white text-[13px] font-bold tracking-wider uppercase rounded-full transition-colors">Continue</button>
                                <button onClick={handleBack} className="flex-1 py-3 border border-gray-300 text-[#262C30] text-[13px] font-medium rounded-full hover:border-gray-400 transition-colors">Back</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Contact Information */}
                {currentStep === 'contact' && (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                        <div className="px-6 py-3 bg-[#374151] text-white text-[13px]">
                            Offer Application: {offer.title}
                        </div>

                        <div className="p-6 lg:p-8">
                            <h1 className="text-xl font-semibold text-[#374151] mb-6">Contact Information</h1>

                            <div className="bg-[#F9FAFB] rounded-xl p-6 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] text-[#677178] mb-2">First Name</label>
                                        <input type="text" value={applicationData.firstName} onChange={(e) => updateField('firstName', e.target.value)} placeholder="Enter your first name" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px]" />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-[#677178] mb-2">Last Name</label>
                                        <input type="text" value={applicationData.lastName} onChange={(e) => updateField('lastName', e.target.value)} placeholder="Enter your last name" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px]" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[13px] text-[#677178] mb-2">Phone Number</label>
                                    <input type="tel" value={applicationData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Enter your phone number" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px]" />
                                </div>

                                <div>
                                    <label className="block text-[13px] text-[#677178] mb-2">Email Address</label>
                                    <input type="email" value={applicationData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="Enter your email address" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px]" />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                <button onClick={handleContinue} className="flex-1 py-3 bg-[#262C30] hover:bg-black text-white text-[13px] font-bold tracking-wider uppercase rounded-full transition-colors">Continue</button>
                                <button onClick={handleBack} className="flex-1 py-3 border border-gray-300 text-[#262C30] text-[13px] font-medium rounded-full hover:border-gray-400 transition-colors">Back</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Terms & Conditions */}
                {currentStep === 'terms' && (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                        <div className="relative w-full aspect-[4/1]">
                            <img src={offer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80"} alt={offer.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="p-6 lg:p-8">
                            {getBadgeForVariant()}

                            <h1 className="text-xl font-semibold text-[#262C30] mb-2">Review & Submit Your {offer.title} Application</h1>
                            <p className="text-[14px] text-[#677178] mb-6">Please review and accept the terms below to complete your application.</p>

                            <h3 className="text-lg font-semibold text-[#262C30] mb-3">Terms and Conditions</h3>
                            <div className="text-[12px] text-[#677178] space-y-3 mb-6 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-[#F9FAFB]">
                                <p className="font-semibold">[Configured in Admin]</p>
                                <p>You authorize [the Credit Union] to obtain credit reports in connection with this application for credit and for any update, increase, renewal, extension, or collection of the credit received.</p>
                                <p>If your loan is approved, the loan terms and interest rate will depend on your creditworthiness. If your loan is not approved, we may counteroffer with different terms or deny your loan application.</p>
                                <p>By applying, you acknowledge the interest rate shown throughout this application will differ from the Annual Percentage Rate (APR) that will be disclosed if your application is approved.</p>
                            </div>

                            <h3 className="text-lg font-semibold text-[#262C30] mb-3">Consent to Electronic Documents and Signatures</h3>
                            <p className="text-[13px] text-[#677178] mb-3">To submit an application electronically, you must consent to the use of electronic documents and signatures.</p>
                            <p className="text-[13px] text-[#143C67] underline mb-6 cursor-pointer">Click to Access Electronic Documents and Signatures PDF</p>

                            <div className="space-y-4 mb-6">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" checked={applicationData.agreedToTerms} onChange={(e) => updateField('agreedToTerms', e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#143C67] focus:ring-[#143C67]" />
                                    <span className="text-[14px] text-[#374151]">I agree to Terms and Conditions.</span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" checked={applicationData.agreedToESign} onChange={(e) => updateField('agreedToESign', e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#143C67] focus:ring-[#143C67]" />
                                    <span className="text-[14px] text-[#374151]">I accessed the Electronic Documents and Signatures PDF and agree to the terms.</span>
                                </label>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleContinue}
                                    disabled={!canContinue() || isSubmitting}
                                    className={cn(
                                        "flex-1 py-3 text-white text-[13px] font-bold tracking-wider uppercase rounded-full transition-colors",
                                        canContinue() && !isSubmitting ? "bg-[#262C30] hover:bg-black" : "bg-gray-300 cursor-not-allowed"
                                    )}
                                >
                                    {isSubmitting ? "Processing..." : "Submit Application"}
                                </button>
                                <button onClick={handleBack} disabled={isSubmitting} className="flex-1 py-3 border border-gray-300 text-[#262C30] text-[13px] font-medium rounded-full hover:border-gray-400 transition-colors">
                                    Back
                                </button>
                            </div>

                            <div className="mt-6 text-[11px] text-[#9CA3AF] space-y-2">
                                <p>* [Configured by admin] An annual percentage rate (APR) is the annual rate charged for borrowing...</p>
                                <p>† [Configured by admin] Additional product-specific disclosure block goes here...</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 text-[11px] text-[#677178] leading-relaxed">
                    <p>This is a prototype for demonstration purposes only. No actual application will be submitted. All information shown is simulated.</p>
                </div>
            </main>
        </div>
    );
}
