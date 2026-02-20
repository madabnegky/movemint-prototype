"use client";

import Link from "next/link";
import { useState } from "react";
import {
    ChevronLeft,
    ChevronDown,
    Lock,
    Check,
    CheckCircle,
    Users,
    FileText,
    Briefcase,
    CreditCard,
    DollarSign,
    LinkIcon,
    Eye,
    Upload,
    Camera,
    Building2,
    Phone,
    Mail,
    Download,
    Shield,
    MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MembershipStep =
    | "landing"
    | "eligibility"
    | "identity"
    | "details"
    | "employment"
    | "addons"
    | "fee-schedule"
    | "fund"
    | "link-accounts"
    | "review"
    | "confirmation";

const STEPS: { key: MembershipStep; label: string; icon: React.ElementType }[] = [
    { key: "eligibility", label: "Eligibility", icon: MapPin },
    { key: "identity", label: "Identity", icon: Shield },
    { key: "details", label: "Your Details", icon: Users },
    { key: "employment", label: "Employment", icon: Briefcase },
    { key: "addons", label: "Add-ons", icon: CreditCard },
    { key: "fee-schedule", label: "Fee Schedule", icon: FileText },
    { key: "fund", label: "Fund Accounts", icon: DollarSign },
    { key: "link-accounts", label: "Link Accounts", icon: LinkIcon },
    { key: "review", label: "Review", icon: Eye },
];

interface ApplicationData {
    // Eligibility
    eligibilityReason: string;
    eligibilityDetail: string;
    // Identity
    isUSCitizen: boolean | null;
    subjectToBackupWithholding: boolean | null;
    idVerificationMethod: string;
    // Details
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    email: string;
    phone: string;
    ssn: string;
    dateOfBirth: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    // Employment
    employmentStatus: string;
    employerName: string;
    jobTitle: string;
    // Add-ons
    wantsChecking: boolean;
    wantsDebitCard: boolean;
    debitCardDelivery: string;
    // Fund accounts
    savingsAmount: string;
    checkingAmount: string;
    holidayClubAmount: string;
    vacationClubAmount: string;
    // Link accounts
    linkExternalAccount: boolean;
    // Fee schedule
    agreedToFeeSchedule: boolean;
    // Review
    promoCode: string;
    agreedToTerms: boolean;
    agreedToESign: boolean;
}

const US_STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
    "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
    "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export default function MembershipApplicationPage() {
    const [currentStep, setCurrentStep] = useState<MembershipStep>("landing");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState<ApplicationData>({
        eligibilityReason: "",
        eligibilityDetail: "",
        isUSCitizen: null,
        subjectToBackupWithholding: null,
        idVerificationMethod: "",
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        email: "",
        phone: "",
        ssn: "",
        dateOfBirth: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        employmentStatus: "",
        employerName: "",
        jobTitle: "",
        wantsChecking: false,
        wantsDebitCard: false,
        debitCardDelivery: "mail",
        savingsAmount: "5.00",
        checkingAmount: "",
        holidayClubAmount: "",
        vacationClubAmount: "",
        linkExternalAccount: false,
        agreedToFeeSchedule: false,
        promoCode: "",
        agreedToTerms: false,
        agreedToESign: false,
    });

    const updateField = (field: keyof ApplicationData, value: string | boolean | null) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

    const goNext = () => {
        if (currentStep === "landing") {
            setCurrentStep("eligibility");
            return;
        }
        const idx = STEPS.findIndex((s) => s.key === currentStep);
        if (idx < STEPS.length - 1) {
            setCurrentStep(STEPS[idx + 1].key);
        } else if (currentStep === "review") {
            handleSubmit();
        }
    };

    const goBack = () => {
        if (currentStep === "eligibility") {
            setCurrentStep("landing");
            return;
        }
        if (currentStep === "confirmation") {
            return;
        }
        const idx = STEPS.findIndex((s) => s.key === currentStep);
        if (idx > 0) {
            setCurrentStep(STEPS[idx - 1].key);
        }
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setCurrentStep("confirmation");
        }, 1500);
    };

    const formatSSN = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 9);
        if (digits.length <= 3) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    };

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 10);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    };

    const formatDOB = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 8);
        if (digits.length <= 2) return digits;
        if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    };

    const confirmationNumber = `CU-MEM-${Date.now().toString().slice(-6)}`;

    // ── Landing Page ──
    if (currentStep === "landing") {
        return (
            <div className="min-h-screen bg-[#E8EBED] font-sans text-[#262C30]">
                <Nav />
                <main className="max-w-[600px] mx-auto px-6 py-12">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                        {/* Hero */}
                        <div className="relative w-full aspect-[2.5/1]">
                            <img
                                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80"
                                alt="Open a Membership"
                                className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute bottom-4 left-6 right-6">
                                <h1 className="text-2xl font-bold text-white">Open a Membership</h1>
                                <p className="text-white/80 text-sm mt-1">Join our credit union family today</p>
                            </div>
                        </div>

                        <div className="p-6 lg:p-8">
                            <p className="text-[14px] text-[#677178] mb-8 leading-relaxed">
                                Become a member and unlock exclusive rates, lower fees, and personalized financial guidance.
                                Choose an option below to get started.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={goNext}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#143C67] bg-[#143C67]/5 hover:bg-[#143C67]/10 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#143C67] flex items-center justify-center shrink-0">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-[15px] font-semibold text-[#143C67]">New Member</div>
                                        <div className="text-[12px] text-[#677178]">I&apos;d like to join the credit union</div>
                                    </div>
                                </button>

                                <button
                                    disabled
                                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50 text-left opacity-60 cursor-not-allowed"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-[15px] font-semibold text-[#374151]">Existing Member</div>
                                        <div className="text-[12px] text-[#677178]">I&apos;m already a member and want to add products</div>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-6 flex items-center gap-2 text-[12px] text-[#677178]">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Your information is encrypted and secure</span>
                            </div>
                        </div>
                    </div>

                    <Disclaimer />
                </main>
                <ProtoNav />
            </div>
        );
    }

    // ── Confirmation Page ──
    if (currentStep === "confirmation") {
        return (
            <div className="min-h-screen bg-[#E8EBED] font-sans text-[#262C30]">
                <Nav />
                <main className="max-w-[600px] mx-auto px-6 py-8">
                    {/* All-complete progress */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {["Apply", "Verify", "Complete"].map((label, idx) => (
                            <div key={label} className="flex items-center">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-7 h-7 rounded-full bg-[#22C55E] text-white flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                    <span className="text-[11px] font-medium text-[#22C55E]">{label}</span>
                                </div>
                                {idx < 2 && <div className="w-8 h-px bg-[#22C55E] mx-1" />}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 mb-6">
                        <div className="p-6 lg:p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#DCFCE7] mx-auto mb-4 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-[#22C55E]" />
                            </div>
                            <h1 className="text-2xl font-semibold text-[#262C30] mb-2">
                                Application Submitted!
                            </h1>
                            <p className="text-[14px] text-[#677178] mb-6 max-w-md mx-auto">
                                Thank you for your membership application, {data.firstName || "applicant"}. We&apos;ve received your information and will process it shortly.
                            </p>

                            <div className="bg-[#F9FAFB] rounded-lg p-4 mb-6 inline-block">
                                <div className="text-[11px] text-[#677178] uppercase tracking-wide mb-1">
                                    Confirmation Number
                                </div>
                                <div className="text-lg font-mono font-semibold text-[#262C30]">
                                    {confirmationNumber}
                                </div>
                            </div>

                            <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-lg p-4 mb-6 text-left">
                                <div className="text-[13px] font-semibold text-[#166534] mb-2">
                                    Membership Application Summary
                                </div>
                                <div className="space-y-1 text-[13px] text-[#166534]">
                                    <div>
                                        <span className="text-[#15803D]">Name:</span>{" "}
                                        <span className="font-semibold">
                                            {data.firstName} {data.middleName} {data.lastName}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[#15803D]">Membership Share Savings:</span>{" "}
                                        <span className="font-semibold">${data.savingsAmount || "5.00"}</span>
                                    </div>
                                    {data.wantsChecking && (
                                        <div>
                                            <span className="text-[#15803D]">Checking Account:</span>{" "}
                                            <span className="font-semibold">${data.checkingAmount || "0.00"}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 p-6 lg:p-8">
                            <h3 className="text-[13px] font-semibold text-[#262C30] uppercase tracking-wide mb-4">
                                Pending Items
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span className="text-[13px] text-amber-800">Identity Verification — Please complete via the link sent to your email</span>
                                </div>
                                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span className="text-[13px] text-blue-800">Application Review — Our team will review your application within 1-2 business days</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 p-6 lg:p-8">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/stranger-storefront"
                                    className="flex-1 inline-flex items-center justify-center px-8 py-3 bg-[#262C30] text-white text-[13px] font-bold tracking-wider uppercase rounded-full hover:bg-black transition-colors"
                                >
                                    Return to Storefront
                                </Link>
                                <button className="flex-1 inline-flex items-center justify-center px-8 py-3 bg-white text-[#262C30] text-[13px] font-medium border border-gray-300 rounded-full hover:border-gray-400 transition-colors">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Summary
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-[13px] font-semibold text-[#262C30] mb-3">Questions?</h3>
                        <div className="flex flex-wrap gap-6">
                            <span className="flex items-center gap-2 text-[13px] text-[#143C67]">
                                <Phone className="w-4 h-4" />
                                1-800-555-0123
                            </span>
                            <span className="flex items-center gap-2 text-[13px] text-[#143C67]">
                                <Mail className="w-4 h-4" />
                                support@creditunion.com
                            </span>
                        </div>
                    </div>
                    <Disclaimer />
                </main>
                <ProtoNav />
            </div>
        );
    }

    // ── Wizard Steps ──
    return (
        <div className="min-h-screen bg-[#E8EBED] font-sans text-[#262C30]">
            {/* Navigation */}
            <nav className="bg-white px-6 lg:px-8 h-14 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={goBack}
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

            <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-8 flex gap-8">
                {/* Sidebar Progress */}
                <aside className="hidden lg:block w-56 shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sticky top-8">
                        <div className="text-[11px] font-semibold text-[#677178] uppercase tracking-wider mb-3">
                            Application Progress
                        </div>
                        <div className="space-y-1">
                            {STEPS.map((step, idx) => {
                                const isActive = step.key === currentStep;
                                const isComplete = idx < stepIndex;
                                const Icon = step.icon;
                                return (
                                    <div
                                        key={step.key}
                                        className={cn(
                                            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                                            isActive && "bg-[#143C67]/10 text-[#143C67] font-semibold",
                                            isComplete && "text-[#22C55E]",
                                            !isActive && !isComplete && "text-[#9CA3AF]"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                                                isComplete && "bg-[#22C55E]",
                                                isActive && "bg-[#143C67]",
                                                !isActive && !isComplete && "bg-gray-200"
                                            )}
                                        >
                                            {isComplete ? (
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            ) : (
                                                <Icon
                                                    className={cn(
                                                        "w-3 h-3",
                                                        isActive ? "text-white" : "text-gray-400"
                                                    )}
                                                />
                                            )}
                                        </div>
                                        <span className="truncate">{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* Mobile progress bar */}
                <div className="lg:hidden fixed top-14 left-0 right-0 z-40 bg-white border-b border-gray-200 px-6 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-medium text-[#262C30]">
                            Step {stepIndex + 1} of {STEPS.length}
                        </span>
                        <span className="text-[12px] text-[#677178]">
                            {STEPS[stepIndex]?.label}
                        </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#143C67] rounded-full transition-all duration-300"
                            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 lg:mt-0 mt-16">
                    {/* ── Step: Eligibility ── */}
                    {currentStep === "eligibility" && (
                        <StepCard
                            title="Eligibility"
                            subtitle="To join our credit union, you must meet at least one of the following criteria."
                        >
                            <div className="space-y-4">
                                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                                    How are you eligible to join?
                                </label>
                                {[
                                    { value: "live", label: "I live in the area served by this credit union" },
                                    { value: "work", label: "I work in the area served by this credit union" },
                                    { value: "worship", label: "I worship in the area served by this credit union" },
                                    { value: "school", label: "I attend school in the area served by this credit union" },
                                    { value: "family", label: "A family member is already a member" },
                                    { value: "employer", label: "My employer has a relationship with this credit union" },
                                ].map((option) => (
                                    <label
                                        key={option.value}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                                            data.eligibilityReason === option.value
                                                ? "border-[#143C67] bg-[#143C67]/5"
                                                : "border-gray-200 hover:border-gray-300"
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="eligibility"
                                            value={option.value}
                                            checked={data.eligibilityReason === option.value}
                                            onChange={(e) => updateField("eligibilityReason", e.target.value)}
                                            className="w-4 h-4 text-[#143C67] focus:ring-[#143C67]"
                                        />
                                        <span className="text-[14px] text-[#374151]">{option.label}</span>
                                    </label>
                                ))}

                                {data.eligibilityReason && (
                                    <div className="mt-4">
                                        <label className="block text-[13px] font-medium text-[#374151] mb-2">
                                            Please provide details (e.g., zip code, employer, family member name)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.eligibilityDetail}
                                            onChange={(e) => updateField("eligibilityDetail", e.target.value)}
                                            placeholder="Enter details..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#143C67] focus:border-transparent"
                                        />
                                    </div>
                                )}
                            </div>
                            <StepButtons onBack={goBack} onNext={goNext} />
                        </StepCard>
                    )}

                    {/* ── Step: Identity Verification ── */}
                    {currentStep === "identity" && (
                        <StepCard
                            title="Identity Verification"
                            subtitle="We need to verify your identity to comply with federal regulations."
                        >
                            <div className="space-y-6">
                                {/* US Citizen */}
                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-3">
                                        Are you a U.S. Citizen or Resident Alien?
                                    </label>
                                    <div className="flex gap-3">
                                        {[
                                            { value: true, label: "Yes" },
                                            { value: false, label: "No" },
                                        ].map((opt) => (
                                            <button
                                                key={String(opt.value)}
                                                onClick={() => updateField("isUSCitizen", opt.value)}
                                                className={cn(
                                                    "px-6 py-2.5 rounded-lg border text-[14px] font-medium transition-colors",
                                                    data.isUSCitizen === opt.value
                                                        ? "border-[#143C67] bg-[#143C67] text-white"
                                                        : "border-gray-300 bg-white text-[#374151] hover:border-gray-400"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Backup Withholding */}
                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-3">
                                        Are you subject to backup withholding?
                                    </label>
                                    <div className="flex gap-3">
                                        {[
                                            { value: true, label: "Yes" },
                                            { value: false, label: "No" },
                                        ].map((opt) => (
                                            <button
                                                key={String(opt.value)}
                                                onClick={() =>
                                                    updateField("subjectToBackupWithholding", opt.value)
                                                }
                                                className={cn(
                                                    "px-6 py-2.5 rounded-lg border text-[14px] font-medium transition-colors",
                                                    data.subjectToBackupWithholding === opt.value
                                                        ? "border-[#143C67] bg-[#143C67] text-white"
                                                        : "border-gray-300 bg-white text-[#374151] hover:border-gray-400"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ID Verification */}
                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-3">
                                        How would you like to verify your identity?
                                    </label>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => updateField("idVerificationMethod", "government-id")}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left",
                                                data.idVerificationMethod === "government-id"
                                                    ? "border-[#143C67] bg-[#143C67]/5"
                                                    : "border-gray-200 hover:border-gray-300"
                                            )}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#E8EBED] flex items-center justify-center shrink-0">
                                                <Upload className="w-5 h-5 text-[#143C67]" />
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-medium text-[#262C30]">
                                                    Upload Government-Issued ID
                                                </div>
                                                <div className="text-[12px] text-[#677178]">
                                                    Driver&apos;s license, state ID, or passport
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => updateField("idVerificationMethod", "selfie")}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left",
                                                data.idVerificationMethod === "selfie"
                                                    ? "border-[#143C67] bg-[#143C67]/5"
                                                    : "border-gray-200 hover:border-gray-300"
                                            )}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#E8EBED] flex items-center justify-center shrink-0">
                                                <Camera className="w-5 h-5 text-[#143C67]" />
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-medium text-[#262C30]">
                                                    ID + Selfie Verification
                                                </div>
                                                <div className="text-[12px] text-[#677178]">
                                                    Take a photo of your ID and a selfie for verification
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => updateField("idVerificationMethod", "in-branch")}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left",
                                                data.idVerificationMethod === "in-branch"
                                                    ? "border-[#143C67] bg-[#143C67]/5"
                                                    : "border-gray-200 hover:border-gray-300"
                                            )}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#E8EBED] flex items-center justify-center shrink-0">
                                                <Building2 className="w-5 h-5 text-[#143C67]" />
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-medium text-[#262C30]">
                                                    Verify In-Branch
                                                </div>
                                                <div className="text-[12px] text-[#677178]">
                                                    Complete identity verification at a branch location
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Upload placeholder (shown if government-id or selfie selected) */}
                                {(data.idVerificationMethod === "government-id" ||
                                    data.idVerificationMethod === "selfie") && (
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                                        <Upload className="w-8 h-8 text-[#677178] mx-auto mb-3" />
                                        <p className="text-[14px] font-medium text-[#374151] mb-1">
                                            {data.idVerificationMethod === "selfie"
                                                ? "Upload ID front and selfie"
                                                : "Upload front and back of your ID"}
                                        </p>
                                        <p className="text-[12px] text-[#677178]">
                                            JPG, PNG, or PDF up to 10MB
                                        </p>
                                        <button className="mt-4 px-6 py-2 bg-[#143C67] text-white text-[13px] font-medium rounded-lg hover:bg-[#0f2d4d] transition-colors">
                                            Choose Files
                                        </button>
                                    </div>
                                )}
                            </div>
                            <StepButtons onBack={goBack} onNext={goNext} />
                        </StepCard>
                    )}

                    {/* ── Step: Your Details ── */}
                    {currentStep === "details" && (
                        <StepCard
                            title="Your Details"
                            subtitle="Tell us about yourself. This information is required to open your membership."
                        >
                            <div className="space-y-5">
                                {/* Name fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField
                                        label="First Name"
                                        value={data.firstName}
                                        onChange={(v) => updateField("firstName", v)}
                                        placeholder="First name"
                                        required
                                    />
                                    <InputField
                                        label="Middle Name"
                                        value={data.middleName}
                                        onChange={(v) => updateField("middleName", v)}
                                        placeholder="Middle name (optional)"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField
                                        label="Last Name"
                                        value={data.lastName}
                                        onChange={(v) => updateField("lastName", v)}
                                        placeholder="Last name"
                                        required
                                    />
                                    <div>
                                        <label className="block text-[13px] font-medium text-[#374151] mb-2">
                                            Suffix
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={data.suffix}
                                                onChange={(e) => updateField("suffix", e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[15px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#143C67] focus:border-transparent bg-white"
                                            >
                                                <option value="">None</option>
                                                <option value="Jr.">Jr.</option>
                                                <option value="Sr.">Sr.</option>
                                                <option value="II">II</option>
                                                <option value="III">III</option>
                                                <option value="IV">IV</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField
                                        label="Email Address"
                                        value={data.email}
                                        onChange={(v) => updateField("email", v)}
                                        placeholder="email@example.com"
                                        type="email"
                                        required
                                    />
                                    <InputField
                                        label="Phone Number"
                                        value={data.phone}
                                        onChange={(v) => updateField("phone", formatPhone(v))}
                                        placeholder="(555) 555-5555"
                                        type="tel"
                                        required
                                    />
                                </div>

                                {/* SSN & DOB */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField
                                        label="Social Security Number"
                                        value={data.ssn}
                                        onChange={(v) => updateField("ssn", formatSSN(v))}
                                        placeholder="XXX-XX-XXXX"
                                        required
                                    />
                                    <InputField
                                        label="Date of Birth"
                                        value={data.dateOfBirth}
                                        onChange={(v) => updateField("dateOfBirth", formatDOB(v))}
                                        placeholder="MM/DD/YYYY"
                                        required
                                    />
                                </div>

                                {/* Address */}
                                <InputField
                                    label="Street Address"
                                    value={data.address}
                                    onChange={(v) => updateField("address", v)}
                                    placeholder="123 Main St, Apt 4"
                                    required
                                />
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <InputField
                                        label="City"
                                        value={data.city}
                                        onChange={(v) => updateField("city", v)}
                                        placeholder="City"
                                        required
                                    />
                                    <div>
                                        <label className="block text-[13px] font-medium text-[#374151] mb-2">
                                            State <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={data.state}
                                                onChange={(e) => updateField("state", e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[15px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#143C67] focus:border-transparent bg-white"
                                            >
                                                <option value="">Select</option>
                                                {US_STATES.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <InputField
                                        label="Zip Code"
                                        value={data.zip}
                                        onChange={(v) => updateField("zip", v)}
                                        placeholder="12345"
                                        required
                                    />
                                </div>
                            </div>
                            <StepButtons onBack={goBack} onNext={goNext} />
                        </StepCard>
                    )}

                    {/* ── Step: Employment ── */}
                    {currentStep === "employment" && (
                        <StepCard
                            title="Employment Status"
                            subtitle="Tell us about your current employment."
                        >
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-2">
                                        Employment Status <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={data.employmentStatus}
                                            onChange={(e) => updateField("employmentStatus", e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[15px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#143C67] focus:border-transparent bg-white"
                                        >
                                            <option value="">Select status</option>
                                            <option value="employed">Employed</option>
                                            <option value="self-employed">Self-Employed</option>
                                            <option value="retired">Retired</option>
                                            <option value="student">Student</option>
                                            <option value="unemployed">Unemployed</option>
                                            <option value="military">Military</option>
                                            <option value="homemaker">Homemaker</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {(data.employmentStatus === "employed" ||
                                    data.employmentStatus === "self-employed" ||
                                    data.employmentStatus === "military") && (
                                    <>
                                        <InputField
                                            label="Employer Name"
                                            value={data.employerName}
                                            onChange={(v) => updateField("employerName", v)}
                                            placeholder="Enter employer name"
                                        />
                                        <InputField
                                            label="Job Title"
                                            value={data.jobTitle}
                                            onChange={(v) => updateField("jobTitle", v)}
                                            placeholder="Enter job title"
                                        />
                                    </>
                                )}
                            </div>
                            <StepButtons onBack={goBack} onNext={goNext} />
                        </StepCard>
                    )}

                    {/* ── Step: Add-on Services ── */}
                    {currentStep === "addons" && (
                        <StepCard
                            title="Add-on Services"
                            subtitle="Enhance your membership with additional accounts and services."
                        >
                            <div className="space-y-4">
                                {/* Membership Share Savings - always included */}
                                <div className="p-4 rounded-xl border border-[#22C55E] bg-[#F0FDF4]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center shrink-0">
                                                <DollarSign className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-semibold text-[#166534]">
                                                    Membership Share Savings
                                                </div>
                                                <div className="text-[12px] text-[#15803D]">
                                                    Required — $5.00 minimum deposit
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Check className="w-4 h-4 text-[#22C55E]" />
                                            <span className="text-[12px] font-medium text-[#22C55E]">Included</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Checking Account */}
                                <div
                                    className={cn(
                                        "p-4 rounded-xl border transition-colors cursor-pointer",
                                        data.wantsChecking
                                            ? "border-[#143C67] bg-[#143C67]/5"
                                            : "border-gray-200 hover:border-gray-300"
                                    )}
                                    onClick={() => updateField("wantsChecking", !data.wantsChecking)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                                    data.wantsChecking ? "bg-[#143C67]" : "bg-gray-200"
                                                )}
                                            >
                                                <CreditCard
                                                    className={cn(
                                                        "w-5 h-5",
                                                        data.wantsChecking ? "text-white" : "text-gray-400"
                                                    )}
                                                />
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-semibold text-[#262C30]">
                                                    My Credit Union Checking
                                                </div>
                                                <div className="text-[12px] text-[#677178]">
                                                    Free checking with no monthly fees
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={cn(
                                                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                data.wantsChecking
                                                    ? "bg-[#143C67] border-[#143C67]"
                                                    : "border-gray-300"
                                            )}
                                        >
                                            {data.wantsChecking && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>

                                    {/* Debit card option */}
                                    {data.wantsChecking && (
                                        <div
                                            className="mt-4 pl-13 space-y-3"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <label
                                                className="flex items-center gap-3 cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={data.wantsDebitCard}
                                                    onChange={(e) =>
                                                        updateField("wantsDebitCard", e.target.checked)
                                                    }
                                                    className="w-4 h-4 rounded border-gray-300 text-[#143C67] focus:ring-[#143C67]"
                                                />
                                                <span className="text-[13px] text-[#374151]">
                                                    Add a Visa Debit Card
                                                </span>
                                            </label>

                                            {data.wantsDebitCard && (
                                                <div className="ml-7">
                                                    <label className="block text-[12px] text-[#677178] mb-2">
                                                        Card delivery method
                                                    </label>
                                                    <div className="flex gap-3">
                                                        {[
                                                            { value: "mail", label: "Mail to address" },
                                                            { value: "branch", label: "Pick up at branch" },
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.value}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateField("debitCardDelivery", opt.value);
                                                                }}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-lg border text-[13px] font-medium transition-colors",
                                                                    data.debitCardDelivery === opt.value
                                                                        ? "border-[#143C67] bg-[#143C67] text-white"
                                                                        : "border-gray-300 bg-white text-[#374151] hover:border-gray-400"
                                                                )}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <StepButtons onBack={goBack} onNext={goNext} />
                        </StepCard>
                    )}

                    {/* ── Step: Fee Schedule ── */}
                    {currentStep === "fee-schedule" && (
                        <StepCard
                            title="Member Fee Schedule"
                            subtitle="Please review our fee schedule before proceeding."
                        >
                            <div className="space-y-4">
                                {/* Simulated fee schedule document */}
                                <div className="bg-[#F9FAFB] border border-gray-200 rounded-xl p-5 max-h-80 overflow-y-auto">
                                    <h3 className="text-[14px] font-bold text-[#262C30] mb-4 text-center">
                                        CREDIT UNION MEMBER FEE SCHEDULE
                                    </h3>
                                    <p className="text-[11px] text-[#677178] mb-4 text-center">
                                        Effective January 1, 2025
                                    </p>

                                    <div className="space-y-4 text-[12px] text-[#374151]">
                                        <div>
                                            <h4 className="font-semibold text-[#262C30] mb-2">Share Savings Account</h4>
                                            <table className="w-full">
                                                <tbody className="divide-y divide-gray-200">
                                                    <tr><td className="py-1.5">Minimum balance to open</td><td className="text-right font-medium">$5.00</td></tr>
                                                    <tr><td className="py-1.5">Minimum balance to earn dividends</td><td className="text-right font-medium">$100.00</td></tr>
                                                    <tr><td className="py-1.5">Monthly service fee</td><td className="text-right font-medium">None</td></tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold text-[#262C30] mb-2">Checking Account</h4>
                                            <table className="w-full">
                                                <tbody className="divide-y divide-gray-200">
                                                    <tr><td className="py-1.5">Monthly maintenance fee</td><td className="text-right font-medium">None</td></tr>
                                                    <tr><td className="py-1.5">Overdraft fee (per item)</td><td className="text-right font-medium">$25.00</td></tr>
                                                    <tr><td className="py-1.5">Returned item fee</td><td className="text-right font-medium">$25.00</td></tr>
                                                    <tr><td className="py-1.5">Stop payment fee</td><td className="text-right font-medium">$20.00</td></tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold text-[#262C30] mb-2">General Fees</h4>
                                            <table className="w-full">
                                                <tbody className="divide-y divide-gray-200">
                                                    <tr><td className="py-1.5">Wire transfer (domestic, outgoing)</td><td className="text-right font-medium">$20.00</td></tr>
                                                    <tr><td className="py-1.5">Wire transfer (international, outgoing)</td><td className="text-right font-medium">$35.00</td></tr>
                                                    <tr><td className="py-1.5">Cashier&apos;s check</td><td className="text-right font-medium">$5.00</td></tr>
                                                    <tr><td className="py-1.5">Account research (per hour)</td><td className="text-right font-medium">$25.00</td></tr>
                                                    <tr><td className="py-1.5">Dormant account fee (after 12 months)</td><td className="text-right font-medium">$5.00/month</td></tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold text-[#262C30] mb-2">Debit Card</h4>
                                            <table className="w-full">
                                                <tbody className="divide-y divide-gray-200">
                                                    <tr><td className="py-1.5">Card issuance</td><td className="text-right font-medium">Free</td></tr>
                                                    <tr><td className="py-1.5">Card replacement</td><td className="text-right font-medium">$5.00</td></tr>
                                                    <tr><td className="py-1.5">Rush delivery</td><td className="text-right font-medium">$25.00</td></tr>
                                                    <tr><td className="py-1.5">Foreign transaction fee</td><td className="text-right font-medium">1.00%</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={data.agreedToFeeSchedule}
                                        onChange={(e) => updateField("agreedToFeeSchedule", e.target.checked)}
                                        className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#143C67] focus:ring-[#143C67]"
                                    />
                                    <span className="text-[14px] text-[#374151]">
                                        I have reviewed and agree to the Member Fee Schedule
                                    </span>
                                </label>
                            </div>
                            <StepButtons onBack={goBack} onNext={goNext} />
                        </StepCard>
                    )}

                    {/* ── Step: Fund Your Accounts ── */}
                    {currentStep === "fund" && (
                        <StepCard
                            title="Fund Your Accounts"
                            subtitle="Set up initial deposits for your new accounts."
                        >
                            <div className="space-y-5">
                                {/* Membership Share Savings */}
                                <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="text-[14px] font-semibold text-[#166534]">
                                                Membership Share Savings
                                            </div>
                                            <div className="text-[12px] text-[#15803D]">
                                                $5.00 minimum required
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#374151] font-medium">$</span>
                                        <input
                                            type="text"
                                            value={data.savingsAmount}
                                            onChange={(e) => updateField("savingsAmount", e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 border border-[#86EFAC] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Checking - only if selected */}
                                {data.wantsChecking && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <div className="text-[14px] font-semibold text-[#262C30]">
                                                    My Credit Union Checking
                                                </div>
                                                <div className="text-[12px] text-[#677178]">
                                                    Optional initial deposit
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#374151] font-medium">$</span>
                                            <input
                                                type="text"
                                                value={data.checkingAmount}
                                                onChange={(e) => updateField("checkingAmount", e.target.value)}
                                                placeholder="0.00"
                                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#143C67] focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Holiday Club */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="text-[14px] font-semibold text-[#262C30]">
                                                Holiday Club Savings
                                            </div>
                                            <div className="text-[12px] text-[#677178]">
                                                Save for the holidays year-round
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#374151] font-medium">$</span>
                                        <input
                                            type="text"
                                            value={data.holidayClubAmount}
                                            onChange={(e) => updateField("holidayClubAmount", e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#143C67] focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Vacation Club */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="text-[14px] font-semibold text-[#262C30]">
                                                Vacation Club Savings
                                            </div>
                                            <div className="text-[12px] text-[#677178]">
                                                Set aside funds for your next getaway
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#374151] font-medium">$</span>
                                        <input
                                            type="text"
                                            value={data.vacationClubAmount}
                                            onChange={(e) => updateField("vacationClubAmount", e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#143C67] focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="bg-[#F9FAFB] rounded-lg p-4 flex items-center justify-between">
                                    <span className="text-[14px] text-[#677178]">Total Initial Deposit:</span>
                                    <span className="text-xl font-bold text-[#262C30]">
                                        $
                                        {(
                                            (parseFloat(data.savingsAmount) || 0) +
                                            (parseFloat(data.checkingAmount) || 0) +
                                            (parseFloat(data.holidayClubAmount) || 0) +
                                            (parseFloat(data.vacationClubAmount) || 0)
                                        ).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <StepButtons onBack={goBack} onNext={goNext} />
                        </StepCard>
                    )}

                    {/* ── Step: Link Accounts ── */}
                    {currentStep === "link-accounts" && (
                        <StepCard
                            title="Link Your Accounts"
                            subtitle="Optionally link an external bank account to fund your new membership."
                        >
                            <div className="space-y-4">
                                <div
                                    className={cn(
                                        "p-5 rounded-xl border-2 transition-colors cursor-pointer text-center",
                                        data.linkExternalAccount
                                            ? "border-[#143C67] bg-[#143C67]/5"
                                            : "border-dashed border-gray-300 hover:border-gray-400"
                                    )}
                                    onClick={() => updateField("linkExternalAccount", !data.linkExternalAccount)}
                                >
                                    <LinkIcon
                                        className={cn(
                                            "w-10 h-10 mx-auto mb-3",
                                            data.linkExternalAccount ? "text-[#143C67]" : "text-gray-300"
                                        )}
                                    />
                                    <div className="text-[15px] font-semibold text-[#262C30] mb-1">
                                        {data.linkExternalAccount
                                            ? "External Account Linked"
                                            : "Link an External Bank Account"}
                                    </div>
                                    <p className="text-[12px] text-[#677178] max-w-sm mx-auto">
                                        {data.linkExternalAccount
                                            ? "Your external account has been connected. Click to remove."
                                            : "Connect your existing bank account to transfer funds. We use a secure connection to verify your account."}
                                    </p>

                                    {!data.linkExternalAccount && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateField("linkExternalAccount", true);
                                            }}
                                            className="mt-4 px-6 py-2.5 bg-[#143C67] text-white text-[13px] font-medium rounded-lg hover:bg-[#0f2d4d] transition-colors"
                                        >
                                            Connect Account
                                        </button>
                                    )}

                                    {data.linkExternalAccount && (
                                        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3 inline-flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                                                <Building2 className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[13px] font-medium text-[#262C30]">
                                                    Demo Bank - Checking ****4523
                                                </div>
                                                <div className="text-[11px] text-[#22C55E]">Connected</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <p className="text-[12px] text-[#677178] text-center">
                                    You can skip this step and fund your account later.
                                </p>
                            </div>
                            <StepButtons onBack={goBack} onNext={goNext} nextLabel="Continue" />
                        </StepCard>
                    )}

                    {/* ── Step: Review & Submit ── */}
                    {currentStep === "review" && (
                        <StepCard
                            title="Review & Submit"
                            subtitle="Please review your application details before submitting."
                        >
                            <div className="space-y-5">
                                {/* Eligibility */}
                                <ReviewSection title="Eligibility">
                                    <ReviewRow label="Reason" value={data.eligibilityReason || "—"} />
                                    {data.eligibilityDetail && (
                                        <ReviewRow label="Details" value={data.eligibilityDetail} />
                                    )}
                                </ReviewSection>

                                {/* Personal Details */}
                                <ReviewSection title="Personal Details">
                                    <ReviewRow
                                        label="Name"
                                        value={`${data.firstName} ${data.middleName} ${data.lastName} ${data.suffix}`.trim() || "—"}
                                    />
                                    <ReviewRow label="Email" value={data.email || "—"} />
                                    <ReviewRow label="Phone" value={data.phone || "—"} />
                                    <ReviewRow label="SSN" value={data.ssn ? `***-**-${data.ssn.slice(-4)}` : "—"} />
                                    <ReviewRow label="Date of Birth" value={data.dateOfBirth || "—"} />
                                    <ReviewRow
                                        label="Address"
                                        value={
                                            data.address
                                                ? `${data.address}, ${data.city}, ${data.state} ${data.zip}`
                                                : "—"
                                        }
                                    />
                                </ReviewSection>

                                {/* Employment */}
                                <ReviewSection title="Employment">
                                    <ReviewRow label="Status" value={data.employmentStatus || "—"} />
                                    {data.employerName && <ReviewRow label="Employer" value={data.employerName} />}
                                    {data.jobTitle && <ReviewRow label="Job Title" value={data.jobTitle} />}
                                </ReviewSection>

                                {/* Accounts */}
                                <ReviewSection title="Accounts">
                                    <ReviewRow label="Share Savings" value={`$${data.savingsAmount || "5.00"}`} />
                                    {data.wantsChecking && (
                                        <>
                                            <ReviewRow label="Checking" value={`$${data.checkingAmount || "0.00"}`} />
                                            <ReviewRow label="Debit Card" value={data.wantsDebitCard ? "Yes" : "No"} />
                                        </>
                                    )}
                                    {data.holidayClubAmount && (
                                        <ReviewRow label="Holiday Club" value={`$${data.holidayClubAmount}`} />
                                    )}
                                    {data.vacationClubAmount && (
                                        <ReviewRow label="Vacation Club" value={`$${data.vacationClubAmount}`} />
                                    )}
                                </ReviewSection>

                                {/* External Account */}
                                <ReviewSection title="Linked Accounts">
                                    <ReviewRow
                                        label="External Account"
                                        value={data.linkExternalAccount ? "Demo Bank ****4523" : "None"}
                                    />
                                </ReviewSection>

                                {/* Promo Code */}
                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-2">
                                        Promo Code (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.promoCode}
                                        onChange={(e) => updateField("promoCode", e.target.value)}
                                        placeholder="Enter promo code"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#143C67] focus:border-transparent"
                                    />
                                </div>

                                {/* Terms */}
                                <div className="space-y-3 pt-2">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.agreedToTerms}
                                            onChange={(e) => updateField("agreedToTerms", e.target.checked)}
                                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#143C67] focus:ring-[#143C67]"
                                        />
                                        <span className="text-[14px] text-[#374151]">
                                            I agree to the{" "}
                                            <span className="text-[#143C67] underline cursor-pointer">
                                                Terms and Conditions
                                            </span>{" "}
                                            and{" "}
                                            <span className="text-[#143C67] underline cursor-pointer">
                                                Privacy Policy
                                            </span>
                                            .
                                        </span>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.agreedToESign}
                                            onChange={(e) => updateField("agreedToESign", e.target.checked)}
                                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#143C67] focus:ring-[#143C67]"
                                        />
                                        <span className="text-[14px] text-[#374151]">
                                            I consent to electronic documents and signatures.
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <StepButtons
                                onBack={goBack}
                                onNext={goNext}
                                nextLabel={isSubmitting ? "Submitting..." : "Submit Application"}
                                nextDisabled={!data.agreedToTerms || !data.agreedToESign || isSubmitting}
                            />
                        </StepCard>
                    )}
                </div>
            </div>

            <Disclaimer />
            <ProtoNav />
        </div>
    );
}

// ── Shared Components ──

function Nav() {
    return (
        <nav className="bg-white px-6 lg:px-8 h-14 flex items-center justify-between border-b border-gray-200">
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
            <div className="flex items-center gap-1.5 text-[12px] text-[#677178]">
                <Lock className="w-3.5 h-3.5" />
                <span>Secure Application</span>
            </div>
        </nav>
    );
}

function ProtoNav() {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex gap-2">
            <Link
                href="/stranger-storefront"
                className="px-3 py-1.5 bg-[#262C30] text-white text-[11px] font-medium rounded-full shadow-lg hover:bg-black transition-colors"
            >
                Back to Storefront
            </Link>
        </div>
    );
}

function Disclaimer() {
    return (
        <div className="max-w-[900px] mx-auto px-6 lg:px-8 mt-6 mb-8 text-[11px] text-[#677178] leading-relaxed">
            <p>
                This is a prototype for demonstration purposes only. No actual application will be submitted.
                All information shown is simulated.
            </p>
        </div>
    );
}

function StepCard({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            <div className="p-6 lg:p-8">
                <h1 className="text-xl font-semibold text-[#262C30] mb-1">{title}</h1>
                <p className="text-[14px] text-[#677178] mb-6">{subtitle}</p>
                {children}
            </div>
        </div>
    );
}

function StepButtons({
    onBack,
    onNext,
    nextLabel = "Continue",
    nextDisabled = false,
}: {
    onBack: () => void;
    onNext: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
}) {
    return (
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
                onClick={onNext}
                disabled={nextDisabled}
                className={cn(
                    "flex-1 py-3 text-white text-[13px] font-bold tracking-wider uppercase rounded-full transition-colors",
                    nextDisabled
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-[#262C30] hover:bg-black"
                )}
            >
                {nextLabel}
            </button>
            <button
                onClick={onBack}
                className="flex-1 py-3 border border-gray-300 text-[#262C30] text-[13px] font-medium rounded-full hover:border-gray-400 transition-colors"
            >
                Back
            </button>
        </div>
    );
}

function InputField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[15px] text-[#262C30] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#143C67] focus:border-transparent"
            />
        </div>
    );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-[#F9FAFB] rounded-lg p-4">
            <h3 className="text-[13px] font-semibold text-[#262C30] uppercase tracking-wide mb-3">
                {title}
            </h3>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-[14px]">
            <span className="text-[#677178]">{label}:</span>
            <span className="font-medium text-[#262C30] text-right">{value}</span>
        </div>
    );
}
