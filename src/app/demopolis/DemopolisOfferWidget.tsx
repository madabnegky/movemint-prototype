"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/context/StoreContext";
import type { Offer } from "@/context/StoreContext";
import { useStorefront, CREDIT_MOUNTAIN_SECTION } from "@/hooks/useStorefront";
import { CreditMountainCard } from "@/components/storefront/CreditMountainCard";
import type { GeneratedOffer } from "@/lib/ruleEvaluator";
import Link from "next/link";

type WidgetView = 'carousel' | 'details' | 'review' | 'vehicle' | 'contact' | 'terms' | 'confirmation';

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

export function DemopolisOfferWidget() {
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
    const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
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
        sections.forEach(section => {
            if (section.isCreditMountain) {
                pages.push({ type: 'credit-mountain', sectionName: section.name, offers: section.offers });
            } else if (section.offers.length > 0) {
                pages.push({ type: 'section', sectionName: section.name, offers: section.offers });
            }
        });
        return pages;
    }, [featuredOffers, sections]);

    const sectionNames = useMemo(() => {
        const sectionsList: string[] = [];
        carouselPages.forEach((page) => {
            if ((page.type === 'section' || page.type === 'credit-mountain') && page.sectionName) {
                sectionsList.push(page.sectionName);
            }
        });
        return sectionsList;
    }, [carouselPages]);

    const sectionPageIndexMap = useMemo(() => {
        const map: Record<string, number> = {};
        carouselPages.forEach((page, index) => {
            if ((page.type === 'section' || page.type === 'credit-mountain') && page.sectionName) {
                map[page.sectionName] = index;
            }
        });
        return map;
    }, [carouselPages]);

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

    const handleFinish = () => {
        if (selectedOffer) {
            updateOffer({
                ...selectedOffer,
                isRedeemed: true,
                redeemedTitle: `You've redeemed this ${selectedOffer.title.toLowerCase()} offer!`
            });
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

    const jumpToSection = (sectionName: string) => {
        const index = sectionPageIndexMap[sectionName];
        if (index !== undefined) {
            setCurrentPageIndex(index);
        }
        setSectionDropdownOpen(false);
    };

    const getVariantBadgeContent = (variant?: string) => {
        switch (variant) {
            case 'preapproved': return "You're Preapproved";
            case 'prequalified': return "You're Prequalified";
            case 'apply': return "Apply Now";
            case 'special': return "Special Offer";
            default: return "Special Offer";
        }
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

        return (
            <>
                <div className="widget-header">
                    <h2><i className="fas fa-store"></i> Storefront</h2>
                    {sectionNames.length > 1 && (
                        <div style={{ position: "relative" }}>
                            <a href="#" className="link" onClick={(e) => { e.preventDefault(); setSectionDropdownOpen(!sectionDropdownOpen); }}>
                                Jump to section <i className={`fas fa-chevron-${sectionDropdownOpen ? 'up' : 'down'}`} style={{ fontSize: '0.8rem', marginLeft: '4px' }}></i>
                            </a>
                            {sectionDropdownOpen && (
                                <div className="solid-card" style={{ position: "absolute", right: 0, top: "100%", marginTop: "0.5rem", zIndex: 20, width: "200px", background: "white" }}>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        {sectionNames.map((section) => (
                                            <button
                                                key={section}
                                                onClick={() => jumpToSection(section)}
                                                style={{ textAlign: "left", padding: "0.75rem 1rem", border: "none", background: "none", cursor: "pointer", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.9rem" }}
                                            >
                                                {section}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="offer-cards-container">
                    {currentPage.type === 'featured' && currentPage.offer && (
                        <div className="offer-card premium-offer" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ position: "relative", height: "160px" }}>
                                <img
                                    src={currentPage.offer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"}
                                    alt={currentPage.offer.title}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                <div className="offer-badge" style={{ backgroundColor: currentPage.offer.variant === 'preapproved' || currentPage.offer.variant === 'prequalified' ? 'var(--movemint-teal)' : 'var(--movemint-purple)', position: "absolute", top: "12px", right: "12px", borderRadius: "var(--radius-sm)" }}>
                                    {getVariantBadgeContent(currentPage.offer.variant)}
                                </div>
                            </div>

                            <div style={{ padding: "1.75rem" }}>
                                <div className="offer-header-flex">
                                    <div className="offer-icon">
                                        <i className="fas fa-car" style={{ color: "var(--movemint-teal)" }}></i>
                                    </div>
                                </div>

                                <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", marginBottom: "0.25rem", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
                                    {currentPage.offer.featuredHeadline || currentPage.offer.title}
                                </h4>
                                <p style={{ fontSize: "0.875rem", color: "#4B5563", marginBottom: "0.75rem" }}>
                                    {currentPage.offer.featuredDescription || currentPage.offer.description}
                                </p>

                                {currentPage.offer.attributes && currentPage.offer.attributes.length > 0 && (
                                    <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem" }}>
                                        {currentPage.offer.attributes.slice(0, 2).map((attr, idx) => (
                                            <div key={idx}>
                                                <div style={{ fontSize: "10px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem", marginTop: "0.5rem" }}>{attr.label}</div>
                                                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827" }}>
                                                    {attr.value}
                                                    {attr.subtext && (
                                                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", marginLeft: "0.25rem" }}>
                                                            {attr.subtext}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => handleReviewOffer(currentPage.offer!)}
                                    style={{ display: "block", width: "100%", padding: "0.75rem", backgroundColor: "#112240", color: "white", textAlign: "center", fontSize: "15px", fontWeight: 600, borderRadius: "0.25rem", border: "none", cursor: "pointer", letterSpacing: "0.025em" }}
                                >
                                    Review Offer
                                </button>
                                <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                                    <button onClick={() => handleReviewOffer(currentPage.offer!)} style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontSize: "0.75rem" }}>
                                        Details & disclosures
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentPage.type === 'section' && currentPage.offers && (
                        <div className="solid-card" style={{ padding: "1.5rem" }}>
                            <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>{currentPage.sectionName}</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                {currentPage.offers.map((offer) => (
                                    <button
                                        key={offer.id}
                                        onClick={() => handleReviewOffer(offer as Offer)}
                                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "#F8FAFC", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left" }}
                                    >
                                        <div>
                                            <span className="badge" style={{ background: "var(--movemint-teal)", color: "white", fontSize: "0.6rem", marginBottom: "0.5rem", display: "inline-block" }}>
                                                {getVariantBadgeContent(offer.variant)}
                                            </span>
                                            <h4 style={{ fontSize: "0.95rem", margin: 0 }}>{offer.title}</h4>
                                            {offer.attributes?.[0] && (
                                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                                                    {offer.attributes[0].label && `${offer.attributes[0].label} `}
                                                    <strong style={{ color: "var(--text-primary)" }}>{offer.attributes[0].value}</strong>
                                                </div>
                                            )}
                                        </div>
                                        <i className="fas fa-chevron-right" style={{ color: "var(--text-muted)" }}></i>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentPage.type === 'credit-mountain' && (
                        <div className="solid-card" style={{ padding: "1.5rem" }}>
                            <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>{CREDIT_MOUNTAIN_SECTION}</h3>
                            <CreditMountainCard variant="widget" />

                            {currentPage.offers && currentPage.offers.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                                    {isCreditMountainGraduate && (
                                        <p style={{ fontSize: "0.75rem", color: "var(--movemint-teal)", fontWeight: 600, marginBottom: "0.25rem" }}>
                                            Your improved credit has unlocked new opportunities!
                                        </p>
                                    )}
                                    {currentPage.offers.map((offer) => (
                                        <button
                                            key={offer.id}
                                            onClick={() => handleReviewOffer(offer as Offer)}
                                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "rgba(91, 154, 139, 0.05)", border: "1px solid rgba(91, 154, 139, 0.2)", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left" }}
                                        >
                                            <div>
                                                <span className="badge" style={{ background: "var(--movemint-teal)", color: "white", fontSize: "0.6rem", marginBottom: "0.5rem", display: "inline-block" }}>
                                                    NEW OPPORTUNITY
                                                </span>
                                                <h4 style={{ fontSize: "0.95rem", margin: 0 }}>{offer.title}</h4>
                                                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0.25rem 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{offer.description}</p>
                                                {offer.attributes?.[0] && (
                                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                                                        {offer.attributes[0].label && `${offer.attributes[0].label} `}
                                                        <strong style={{ color: "var(--text-primary)" }}>{offer.attributes[0].value}</strong>
                                                    </div>
                                                )}
                                            </div>
                                            <i className="fas fa-chevron-right" style={{ color: "var(--movemint-teal)" }}></i>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem", marginBottom: "1rem" }}>
                        <button onClick={goToPrevPage} className="icon-btn" aria-label="Previous page">
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {currentPageIndex + 1} OF {totalPages}
                        </span>
                        <button onClick={goToNextPage} className="icon-btn" aria-label="Next page">
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    {/* Want to see more + Go to Storefront */}
                    <div style={{ textAlign: "center", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)", marginTop: "auto" }}>
                        <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Looking for something else?</p>
                        <Link href="/storefront" className="btn btn-secondary" style={{ fontSize: "0.6rem", padding: "0.4rem 1rem", borderRadius: "2rem", textTransform: "uppercase", letterSpacing: "0.1em", display: "inline-block" }}>
                            Shop Full Storefront
                        </Link>
                    </div>
                </div>
            </>
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
        return (
            <>
                <div className="widget-header">
                    <h2><i className="fas fa-store"></i> Offer Redemption</h2>
                </div>
                <div className="solid-card" style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
                    <div style={{ width: "64px", height: "64px", background: "#ECFDF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto" }}>
                        <i className="fas fa-check" style={{ fontSize: "2rem", color: "var(--movemint-teal)" }}></i>
                    </div>

                    <h3 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>That Was Easy!</h3>
                    <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>
                        We're processing your request and will be in touch shortly.<br />
                        Questions? Please contact us.
                    </p>

                    <button onClick={handleFinish} className="btn btn-storefront" style={{ padding: "0.75rem 2rem" }}>
                        OKAY
                    </button>
                </div>
            </>
        );
    }

    return null;
}
