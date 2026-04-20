"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import type { Offer } from "@/context/StoreContext";
import { useStorefront, CREDIT_MOUNTAIN_SECTION } from "@/hooks/useStorefront";
import { CreditMountainCard } from "@/components/storefront/CreditMountainCard";
import type { GeneratedOffer } from "@/lib/ruleEvaluator";
import Link from "next/link";

type WidgetView = 'carousel' | 'details' | 'review' | 'vehicle' | 'contact' | 'terms' | 'confirmation' | 'interest-captured';

interface ApplicationData {
    loanAmount: string;
    term: string;
    monthlyPayment: number;
    withCoBorrower: boolean;
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

interface CarouselPage {
    type: 'featured' | 'section' | 'credit-mountain';
    sectionName?: string;
    offer?: Offer | GeneratedOffer;
    offers?: (Offer | GeneratedOffer)[];
}

interface DemopolisOfferWidgetProps {
    onOfferAccepted?: () => void;
}

export function DemopolisOfferWidget({ onOfferAccepted }: DemopolisOfferWidgetProps) {
    const { updateOffer, featureFlags } = useStore();
    const {
        featuredOffers,
        sections,
        isCreditMountainGraduate,
        showCreditMountainSection
    } = useStorefront();
    const [currentView, setCurrentView] = useState<WidgetView>('carousel');
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [activeTab, setActiveTab] = useState<'amount' | 'payment'>('amount');
    const [applicationData, setApplicationData] = useState<ApplicationData>({
        loanAmount: '',
        term: '60 months (3.23%*)',
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

    const carouselPages: CarouselPage[] = useMemo(() => {
        const pages: CarouselPage[] = [];
        featuredOffers.forEach(offer => {
            pages.push({ type: 'featured', offer });
        });
        const SECTION_PAGE_SIZE = 3;
        sections.forEach(section => {
            if (section.isCreditMountain) {
                pages.push({ type: 'credit-mountain', sectionName: section.name, offers: section.offers });
            } else if (section.offers.length > 0) {
                for (let i = 0; i < section.offers.length; i += SECTION_PAGE_SIZE) {
                    pages.push({
                        type: 'section',
                        sectionName: section.name,
                        offers: section.offers.slice(i, i + SECTION_PAGE_SIZE),
                    });
                }
            }
        });
        return pages;
    }, [featuredOffers, sections]);

    const totalPages = carouselPages.length;

    const calculateMonthlyPayment = (amount: number, termMonths: number = 60, apr: number = 3.23) => {
        if (!amount || amount <= 0) return 0;
        const monthlyRate = apr / 100 / 12;
        const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
            (Math.pow(1 + monthlyRate, termMonths) - 1);
        return payment;
    };

    const handleReviewOffer = (offer: Offer) => {
        setSelectedOffer(offer);
        setCurrentView('details');
        setApplicationData({
            loanAmount: '',
            term: '60 months (3.23%*)',
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

    const handleFinish = (markRedeemed: boolean = true) => {
        if (selectedOffer && markRedeemed) {
            updateOffer({
                ...selectedOffer,
                isRedeemed: true,
                redeemedTitle: `You've redeemed this ${selectedOffer.title.toLowerCase()} offer!`
            });
            onOfferAccepted?.();
        }
        setCurrentView('carousel');
        setSelectedOffer(null);
    };

    const handleCancel = () => {
        setCurrentView('carousel');
        setSelectedOffer(null);
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

    const goToPrevPage = () => {
        setCurrentPageIndex(prev => (prev > 0 ? prev - 1 : totalPages - 1));
    };

    const goToNextPage = () => {
        setCurrentPageIndex(prev => (prev < totalPages - 1 ? prev + 1 : 0));
    };


    if (totalPages === 0) {
        return (
            <>
                <div className="widget-header">
                    <h2><i className="fas fa-store"></i> Storefront</h2>
                </div>
                <div className="solid-card" style={{ padding: "1.5rem" }}>
                    <p style={{ color: "var(--text-secondary)" }}>No offers available</p>
                </div>
            </>
        );
    }

    if (currentView === 'carousel') {
        const currentPage = carouselPages[currentPageIndex];

        const tagStyles: Record<string, { bg: string; text: string; label: string }> = {
            preapproved: { bg: "#269B78", text: "#FBFBFB", label: "You're preapproved!" },
            prequalified: { bg: "#269B78", text: "#FBFBFB", label: "You're prequalified!" },
            'auto-refi': { bg: "#269B78", text: "#FBFBFB", label: "You're preapproved!" },
            'credit-limit': { bg: "#269B78", text: "#FBFBFB", label: "You're preapproved!" },
            ita: { bg: "#8A55FB", text: "#FBFBFB", label: "APPLY NOW" },
            wildcard: { bg: "#262C30", text: "#FBFBFB", label: "SPECIAL OFFER" },
            protection: { bg: "#262C30", text: "#FBFBFB", label: "SPECIAL OFFER" },
            'new-member': { bg: "#262C30", text: "#FBFBFB", label: "SPECIAL OFFER" },
        };

        const getTag = (variant?: string) => tagStyles[variant ?? ""] ?? tagStyles.wildcard;

        return (
            <div style={{
                width: "393px",
                maxWidth: "100%",
                margin: "0 auto",
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif)",
            }}>
                {/* YOUR OFFERS title */}
                <div style={{
                    textAlign: "center",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#262C30",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                }}>
                    Your Offers
                </div>

                {/* Tinted panel containing the carousel content + pagination + footer */}
                <div style={{
                    background: "#E7EAEC",
                    borderRadius: "12px",
                    padding: "20px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}>
                    {/* Page content */}
                    <div style={{ minHeight: "320px" }}>
                        {currentPage.type === 'featured' && currentPage.offer && (
                            <div style={{
                                background: "#FBFBFB",
                                borderRadius: "16px",
                                overflow: "hidden",
                                boxShadow: "0 4px 8px 0 rgba(0,0,0,0.06)",
                            }}>
                                <div style={{ width: "100%", height: "152px", overflow: "hidden" }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={currentPage.offer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"}
                                        alt={currentPage.offer.title}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                                <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <h3 style={{
                                        fontSize: "22px",
                                        lineHeight: "26px",
                                        letterSpacing: "-0.5px",
                                        color: "#262C30",
                                        fontWeight: 700,
                                        margin: 0,
                                    }}>
                                        {currentPage.offer.featuredHeadline || "You're preapproved!"}
                                    </h3>
                                    {(currentPage.offer.featuredDescription || currentPage.offer.description) && (
                                        <p style={{
                                            fontSize: "14px",
                                            lineHeight: "20px",
                                            color: "#576975",
                                            margin: 0,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}>
                                            {currentPage.offer.featuredDescription || currentPage.offer.description}
                                        </p>
                                    )}
                                    {currentPage.offer.attributes && currentPage.offer.attributes.length > 0 && (
                                        <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                                            {currentPage.offer.attributes.slice(0, 2).map((attr, idx) => (
                                                <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "100px" }}>
                                                    <span style={{ fontSize: "14px", lineHeight: "20px", color: "#576975" }}>{attr.label}</span>
                                                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                                                        <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.5px", color: "#262C30" }}>{attr.value}</span>
                                                        {attr.subtext && (
                                                            <span style={{ fontSize: "11px", color: "#262C30" }}>{attr.subtext}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (currentPage.offer!.variant === 'wildcard') {
                                                setSelectedOffer(currentPage.offer as Offer);
                                                setCurrentView('interest-captured');
                                            } else {
                                                handleReviewOffer(currentPage.offer as Offer);
                                            }
                                        }}
                                        style={{
                                            marginTop: "8px",
                                            width: "100%",
                                            height: "48px",
                                            background: "#3B82F6",
                                            color: "#FFFFFF",
                                            border: "none",
                                            borderRadius: "100px",
                                            fontSize: "15px",
                                            fontWeight: 700,
                                            letterSpacing: "0.05em",
                                            textTransform: "uppercase",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {currentPage.offer!.ctaText || "Review Offer"}
                                    </button>
                                    {currentPage.offer!.variant !== 'wildcard' && (
                                        <div style={{ textAlign: "center" }}>
                                            <button
                                                onClick={() => handleReviewOffer(currentPage.offer as Offer)}
                                                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "13px", color: "#262C30", textDecoration: "underline", fontWeight: 600 }}
                                            >
                                                Details & disclosures
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentPage.type === 'section' && currentPage.offers && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {currentPage.offers.map((offer) => {
                                    const tag = getTag(offer.variant);
                                    return (
                                        <button
                                            key={offer.id}
                                            onClick={() => handleReviewOffer(offer as Offer)}
                                            style={{
                                                background: "#FBFBFB",
                                                borderRadius: "16px",
                                                overflow: "hidden",
                                                boxShadow: "0 4px 8px 0 rgba(0,0,0,0.06)",
                                                border: "none",
                                                padding: 0,
                                                cursor: "pointer",
                                                textAlign: "left",
                                                width: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                            }}
                                        >
                                            <div style={{ display: "inline-block", alignSelf: "flex-start", background: tag.bg, color: tag.text, padding: "4px 16px", borderRadius: "20px 0 20px 0", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                                                {tag.label}
                                            </div>
                                            <div style={{ padding: "8px 16px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <div style={{ fontSize: "18px", lineHeight: "22px", letterSpacing: "-0.3px", color: "#262C30", fontWeight: 600 }}>
                                                    {offer.title}
                                                </div>
                                                {offer.attributes && offer.attributes.length > 0 ? (
                                                    <div style={{ display: "flex", gap: "16px", marginTop: "2px" }}>
                                                        {offer.attributes.slice(0, 2).map((attr, idx) => (
                                                            <div key={idx} style={{ display: "flex", flexDirection: "column" }}>
                                                                <span style={{ fontSize: "12px", color: "#576975", lineHeight: "16px" }}>{attr.label}</span>
                                                                <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                                                                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#262C30", letterSpacing: "-0.3px" }}>{attr.value}</span>
                                                                    {attr.subtext && (
                                                                        <span style={{ fontSize: "10px", color: "#262C30" }}>{attr.subtext}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : offer.description ? (
                                                    <p style={{ fontSize: "13px", lineHeight: "18px", color: "#576975", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                        {offer.description}
                                                    </p>
                                                ) : null}
                                                <div style={{ textAlign: "center", marginTop: "4px" }}>
                                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#262C30", textDecoration: "underline" }}>
                                                        Learn More
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {currentPage.type === 'credit-mountain' && (
                            <div style={{ background: "#FBFBFB", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 8px 0 rgba(0,0,0,0.06)" }}>
                                <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "16px", color: "#262C30" }}>{CREDIT_MOUNTAIN_SECTION}</h3>
                                <CreditMountainCard variant="widget" />
                                {currentPage.offers && currentPage.offers.length > 0 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                                        {isCreditMountainGraduate && (
                                            <p style={{ fontSize: "12px", color: "#269B78", fontWeight: 600, margin: 0 }}>
                                                Your improved credit has unlocked new opportunities!
                                            </p>
                                        )}
                                        {currentPage.offers.slice(0, 3).map((offer) => (
                                            <button
                                                key={offer.id}
                                                onClick={() => handleReviewOffer(offer as Offer)}
                                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "rgba(38, 155, 120, 0.06)", border: "1px solid rgba(38, 155, 120, 0.2)", borderRadius: "8px", cursor: "pointer", textAlign: "left" }}
                                            >
                                                <div>
                                                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#269B78", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>NEW OPPORTUNITY</div>
                                                    <div style={{ fontSize: "14px", color: "#262C30", fontWeight: 600 }}>{offer.title}</div>
                                                </div>
                                                <ChevronRight size={16} color="#269B78" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pagination — chevrons + dots */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                        <button
                            onClick={goToPrevPage}
                            aria-label="Previous page"
                            style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", color: "#262C30", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {carouselPages.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPageIndex(i)}
                                    aria-label={`Go to page ${i + 1}`}
                                    style={{
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "999px",
                                        background: i === currentPageIndex ? "#262C30" : "transparent",
                                        border: i === currentPageIndex ? "none" : "1.5px solid #262C30",
                                        padding: 0,
                                        cursor: "pointer",
                                    }}
                                />
                            ))}
                        </div>
                        <button
                            onClick={goToNextPage}
                            aria-label="Next page"
                            style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", color: "#262C30", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Want to see more + Go to All Offers */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                        <p style={{ fontSize: "14px", color: "#262C30", margin: 0 }}>Want to see more?</p>
                        <Link
                            href="/storefront"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "10px 32px",
                                background: "transparent",
                                color: "#262C30",
                                border: "1.5px solid #262C30",
                                borderRadius: "100px",
                                fontSize: "13px",
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                textDecoration: "none",
                            }}
                        >
                            Go to All Offers
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (currentView === 'details' && selectedOffer) {
        return (
            <>
                <div className="widget-header">
                    <h2><i className="fas fa-store"></i> Offer Redemption</h2>
                </div>
                <div className="solid-card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>{selectedOffer.title}</h3>
                    <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                        Great news! You're pre-approved for this new Auto offer. To take advantage of this offer, just answer a few questions and we'll take care of the rest.
                    </p>

                    <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", marginBottom: "1rem" }}>
                        <img
                            src={selectedOffer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"}
                            alt={selectedOffer.title}
                            style={{ width: "100%", height: "160px", objectFit: "cover" }}
                        />
                    </div>

                    <span className="badge" style={{ background: "var(--movemint-teal)", color: "white", marginBottom: "1.5rem", display: "inline-block" }}>
                        YOU'RE PREAPPROVED
                    </span>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Up to </span>
                        <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                            {selectedOffer.attributes?.[0]?.value || '$18,000'}
                        </span>
                    </div>

                    <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
                        <button onClick={() => setActiveTab('amount')} style={{ padding: "0.5rem 1rem", background: "none", border: "none", borderBottom: activeTab === 'amount' ? "2px solid var(--brand-primary)" : "2px solid transparent", fontWeight: 600, color: activeTab === 'amount' ? "var(--brand-primary)" : "var(--text-secondary)", cursor: "pointer" }}>
                            Loan Amount
                        </button>
                        <button onClick={() => setActiveTab('payment')} style={{ padding: "0.5rem 1rem", background: "none", border: "none", borderBottom: activeTab === 'payment' ? "2px solid var(--brand-primary)" : "2px solid transparent", fontWeight: 600, color: activeTab === 'payment' ? "var(--brand-primary)" : "var(--text-secondary)", cursor: "pointer" }}>
                            Monthly Payment
                        </button>
                    </div>

                    <div className="input-group">
                        <label>Requested Loan Amount:</label>
                        <input
                            type="text"
                            value={applicationData.loanAmount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            placeholder="Enter loan amount"
                        />
                    </div>

                    <div className="input-group">
                        <label>Term & APR:</label>
                        <div style={{ position: "relative" }}>
                            <select
                                value={applicationData.term}
                                onChange={(e) => updateField('term', e.target.value)}
                                style={{ width: "100%", padding: "0.875rem 1rem", border: "1px solid var(--border-heavy)", borderRadius: "var(--radius-sm)", appearance: "none", background: "#fff", fontFamily: "var(--font-main)", fontSize: "1rem" }}
                            >
                                <option>36 months (2.99%*)</option>
                                <option>48 months (3.09%*)</option>
                                <option>60 months (3.23%*)</option>
                                <option>72 months (3.49%*)</option>
                            </select>
                            <i className="fas fa-chevron-down" style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}></i>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderTop: "1px solid var(--border-subtle)", margin: "1rem 0" }}>
                        <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>Estimated Monthly Payment:</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                            {applicationData.monthlyPayment > 0 ? `$${applicationData.monthlyPayment.toFixed(2)}` : '—'}
                        </span>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                        <button onClick={handleCancel} className="btn btn-secondary" style={{ flex: 1 }}>CANCEL</button>
                        <button onClick={() => setCurrentView('review')} className="btn btn-primary" style={{ flex: 1 }}>CONTINUE</button>
                    </div>

                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2rem" }}>
                        <p>*An annual percentage rate (APR) is the annual rate charged for borrowing or earned through an investment, and is expressed as a percentage that represents the actual yearly cost of funds over the term of a loan.</p>
                    </div>
                </div>
            </>
        );
    }

    if (currentView === 'review' && selectedOffer) {
        return (
            <>
                <div className="widget-header">
                    <h2><i className="fas fa-store"></i> Offer Redemption</h2>
                </div>
                <div className="solid-card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Review & Submit Your Application</h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                        Please review your requested terms. If everything looks good, click "Continue."
                    </p>

                    <div className="fee-notice" style={{ background: "#F8FAFC", borderLeftColor: "var(--brand-primary)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Requested loan amount:</span>
                            <span style={{ fontWeight: 600 }}>{applicationData.loanAmount || '$##,###.##'}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Term & APR*†:</span>
                            <span style={{ fontWeight: 600 }}>{applicationData.term}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Estimated monthly payment:</span>
                            <span style={{ fontWeight: 600 }}>{applicationData.monthlyPayment > 0 ? `$${applicationData.monthlyPayment.toFixed(2)}` : '$###.##'}</span>
                        </div>
                    </div>

                    <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", marginBottom: "1.5rem" }}>
                        <input
                            type="checkbox"
                            checked={applicationData.agreedToDisclosures}
                            onChange={(e) => updateField('agreedToDisclosures', e.target.checked)}
                            style={{ marginTop: "0.25rem" }}
                        />
                        <span style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                            I have read & agree to the <a href="#" onClick={e => e.preventDefault()}>Details & Disclosures</a>
                        </span>
                    </label>

                    <div style={{ display: "flex", gap: "1rem" }}>
                        <button onClick={handleCancel} className="btn btn-secondary" style={{ flex: 1 }}>CANCEL</button>
                        <button onClick={() => setCurrentView('vehicle')} className="btn btn-primary" style={{ flex: 1 }}>CONTINUE</button>
                    </div>
                </div>
            </>
        );
    }

    if (currentView === 'vehicle' && selectedOffer) {
        return (
            <>
                <div className="widget-header">
                    <h2><i className="fas fa-store"></i> Offer Redemption</h2>
                </div>
                <div className="solid-card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Verify Vehicle Information</h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                        Vehicle details are optional, but anything you're able to provide now may help expedite processing.
                    </p>

                    <div className="input-group">
                        <label>VIN (optional)</label>
                        <input type="text" value={applicationData.vin} onChange={e => updateField('vin', e.target.value)} placeholder="Enter VIN" />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="input-group">
                            <label>Year (optional)</label>
                            <input type="text" value={applicationData.year} onChange={e => updateField('year', e.target.value)} placeholder="YYYY" />
                        </div>
                        <div className="input-group">
                            <label>Make (optional)</label>
                            <input type="text" value={applicationData.make} onChange={e => updateField('make', e.target.value)} placeholder="e.g. Toyota" />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="input-group">
                            <label>Model (optional)</label>
                            <input type="text" value={applicationData.model} onChange={e => updateField('model', e.target.value)} placeholder="e.g. Camry" />
                        </div>
                        <div className="input-group">
                            <label>Trim (optional)</label>
                            <input type="text" value={applicationData.trim} onChange={e => updateField('trim', e.target.value)} placeholder="e.g. LE" />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                        <button onClick={handleCancel} className="btn btn-secondary" style={{ flex: 1 }}>CANCEL</button>
                        <button onClick={() => setCurrentView('contact')} className="btn btn-primary" style={{ flex: 1 }}>CONTINUE</button>
                    </div>
                </div>
            </>
        );
    }

    if (currentView === 'contact' && selectedOffer) {
        return (
            <>
                <div className="widget-header">
                    <h2><i className="fas fa-store"></i> Offer Redemption</h2>
                </div>
                <div className="solid-card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>Contact Information</h3>

                    <div className="input-group">
                        <label>First Name</label>
                        <input type="text" value={applicationData.firstName} onChange={e => updateField('firstName', e.target.value)} placeholder="First name" />
                    </div>
                    <div className="input-group">
                        <label>Last Name</label>
                        <input type="text" value={applicationData.lastName} onChange={e => updateField('lastName', e.target.value)} placeholder="Last name" />
                    </div>
                    <div className="input-group">
                        <label>Phone Number</label>
                        <input type="tel" value={applicationData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="Phone" />
                    </div>
                    <div className="input-group">
                        <label>Email Address</label>
                        <input type="email" value={applicationData.email} onChange={e => updateField('email', e.target.value)} placeholder="Email" />
                    </div>

                    <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                        <button onClick={handleCancel} className="btn btn-secondary" style={{ flex: 1 }}>CANCEL</button>
                        <button onClick={() => setCurrentView('terms')} className="btn btn-primary" style={{ flex: 1 }}>CONTINUE</button>
                    </div>
                </div>
            </>
        );
    }

    if (currentView === 'terms' && selectedOffer) {
        return (
            <>
                <div className="widget-header">
                    <h2><i className="fas fa-store"></i> Offer Redemption</h2>
                </div>
                <div className="solid-card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>Terms and Conditions</h3>

                    <div style={{ background: "#F8FAFC", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "1rem", height: "150px", overflowY: "auto", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                        <p>You authorize [the Credit Union] to obtain credit reports in connection with this application for credit and for any update, increase, renewal, extension, or collection of the credit received...</p>
                        <p>If your loan is approved, the loan terms and interest rate will depend on your creditworthiness. If your loan is not approved, we may counteroffer with different terms or deny your loan application...</p>
                        <p>By applying, you acknowledge the interest rate shown throughout this application will differ from the Annual Percentage Rate (APR) that will be disclosed if your application is approved...</p>
                    </div>

                    <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", marginBottom: "1rem" }}>
                        <input
                            type="checkbox"
                            checked={applicationData.agreedToTerms}
                            onChange={(e) => updateField('agreedToTerms', e.target.checked)}
                            style={{ marginTop: "0.25rem" }}
                        />
                        <span style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>I agree to Terms and Conditions.</span>
                    </label>

                    <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", marginBottom: "1.5rem" }}>
                        <input
                            type="checkbox"
                            checked={applicationData.agreedToESign}
                            onChange={(e) => updateField('agreedToESign', e.target.checked)}
                            style={{ marginTop: "0.25rem" }}
                        />
                        <span style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>I accessed the Electronic Documents and Signatures PDF and agree to the terms.</span>
                    </label>

                    <div style={{ display: "flex", gap: "1rem" }}>
                        <button onClick={handleCancel} className="btn btn-secondary" style={{ flex: 1 }}>CANCEL</button>
                        <button
                            onClick={() => setCurrentView('confirmation')}
                            disabled={!applicationData.agreedToTerms || !applicationData.agreedToESign}
                            className="btn btn-primary"
                            style={{ flex: 1, opacity: (!applicationData.agreedToTerms || !applicationData.agreedToESign) ? 0.5 : 1 }}
                        >
                            FINISH
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (currentView === 'confirmation' && selectedOffer) {
        const confirmationNumber = `CU-${selectedOffer.id.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

        const getNextSteps = () => {
            switch (selectedOffer.productType) {
                case 'auto-loan':
                case 'auto-refi':
                    return [
                        { icon: "fa-calendar-check", text: "A loan specialist will contact you within 1 business day" },
                        { icon: "fa-file-alt", text: "Gather your vehicle title and registration documents" },
                        { icon: "fa-phone", text: "Complete final verification over the phone or in-branch" },
                    ];
                case 'heloc':
                case 'home-loan':
                    return [
                        { icon: "fa-calendar-check", text: "A home loan specialist will reach out within 2 business days" },
                        { icon: "fa-file-alt", text: "Prepare recent tax returns and property documents" },
                        { icon: "fa-phone", text: "Schedule a property appraisal (if required)" },
                    ];
                case 'credit-card':
                case 'credit-limit-increase':
                    return [
                        { icon: "fa-envelope", text: "Your new card will arrive within 7-10 business days" },
                        { icon: "fa-phone", text: "Activate your card when it arrives" },
                        { icon: "fa-mobile-alt", text: "Download our mobile app to manage your account" },
                    ];
                default:
                    return [
                        { icon: "fa-calendar-check", text: "We'll be in touch within 1-2 business days" },
                        { icon: "fa-envelope", text: "Check your email for next steps" },
                        { icon: "fa-phone", text: "Call us if you have any questions" },
                    ];
            }
        };

        const nextSteps = getNextSteps();

        return (
            <>
                <div className="widget-header">
                    <h2><i className="fas fa-store"></i> Offer Redemption</h2>
                </div>
                <div className="solid-card" style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
                    <div style={{ width: "64px", height: "64px", background: "#ECFDF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem auto" }}>
                        <i className="fas fa-check" style={{ fontSize: "2rem", color: "var(--movemint-teal)" }}></i>
                    </div>

                    <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Application Submitted!</h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                        Thank you for your {selectedOffer.title.toLowerCase()} application. We've received your information and will be in touch soon.
                    </p>

                    {/* Confirmation Number */}
                    <div style={{ background: "#F9FAFB", borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem", marginBottom: "1.25rem", display: "inline-block" }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Confirmation Number</div>
                        <div style={{ fontSize: "1.1rem", fontFamily: "monospace", fontWeight: 600, color: "var(--text-primary)" }}>{confirmationNumber}</div>
                    </div>

                    {/* Offer Summary */}
                    <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem", marginBottom: "1.25rem", textAlign: "left" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#166534", marginBottom: "0.25rem" }}>{selectedOffer.title}</div>
                        {selectedOffer.attributes && selectedOffer.attributes.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                                {selectedOffer.attributes.map((attr, idx) => (
                                    <div key={idx} style={{ fontSize: "0.8rem", color: "#166534" }}>
                                        <span style={{ color: "#15803D" }}>{attr.label}:</span>{" "}
                                        <span style={{ fontWeight: 600 }}>{attr.value}</span>
                                        {attr.subtext && <span style={{ fontSize: "0.7rem" }}> {attr.subtext}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Next Steps */}
                    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem", marginBottom: "1.25rem", textAlign: "left" }}>
                        <div style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-primary)", marginBottom: "0.75rem" }}>What Happens Next</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {nextSteps.map((step, idx) => (
                                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--bg-app)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <i className={`fas ${step.icon}`} style={{ fontSize: "0.8rem", color: "var(--brand-primary)" }}></i>
                                    </div>
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", paddingTop: "0.3rem" }}>{step.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button onClick={() => handleFinish(true)} className="btn btn-primary" style={{ flex: 1, borderRadius: "999px", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                            Mark Redeemed & Return
                        </button>
                        <button onClick={() => handleFinish(false)} className="btn btn-secondary" style={{ flex: 1, borderRadius: "999px", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                            Return
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (currentView === 'interest-captured' && selectedOffer) {
        return (
            <div style={{
                width: "393px",
                maxWidth: "100%",
                margin: "0 auto",
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                textAlign: "center",
                fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif)",
            }}>
                <div style={{
                    width: "64px",
                    height: "64px",
                    background: "#ECFDF5",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <i className="fas fa-check" style={{ fontSize: "1.75rem", color: "#269B78" }}></i>
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#262C30", margin: 0 }}>
                    Thanks, Betsy!
                </h3>
                <p style={{ fontSize: "14px", lineHeight: "20px", color: "#576975", margin: 0, maxWidth: "300px" }}>
                    We&apos;ve noted your interest in <strong>{selectedOffer.title}</strong>. A member of our team will reach out to you shortly with more details.
                </p>
                <button
                    onClick={() => { setCurrentView('carousel'); setSelectedOffer(null); }}
                    style={{
                        marginTop: "8px",
                        width: "100%",
                        maxWidth: "280px",
                        height: "44px",
                        background: "transparent",
                        color: "#262C30",
                        border: "1.5px solid #262C30",
                        borderRadius: "100px",
                        fontSize: "13px",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                    }}
                >
                    Back to Offers
                </button>
            </div>
        );
    }

    return null;
}
