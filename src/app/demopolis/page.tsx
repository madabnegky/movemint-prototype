"use client";

import React, { useState } from "react";
import { DemopolisOfferWidget } from "./DemopolisOfferWidget";
import "./demopolis.css";

export default function DemopolisPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [skipPayStatus, setSkipPayStatus] = useState<"idle" | "processing">("idle");
  const [payfiniaStatus, setPayfiniaStatus] = useState<"idle" | "processing">("idle");
  const [offerStatus, setOfferStatus] = useState<"idle" | "processing" | "success">("idle");
  // Persistent flags that survive modal close/reset
  const [skipPayCompleted, setSkipPayCompleted] = useState(false);
  const [payfiniaSent, setPayfiniaSent] = useState(false);

  const openModal = (id: string) => {
    setActiveModal(id);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setActiveModal(null);
    document.body.style.overflow = "";
    setSkipPayStatus("idle");
    setPayfiniaStatus("idle");
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains("modal")) {
      closeModal();
    }
  };

  const confirmSkipPay = () => {
    setSkipPayStatus("processing");
    setTimeout(() => {
      setSkipPayCompleted(true);
      closeModal();
      alert("Success! Your April payment has been skipped using Skip-A-Pay.");
    }, 1500);
  };

  const sendInstantPayment = () => {
    setPayfiniaStatus("processing");
    setTimeout(() => {
      setPayfiniaSent(true);
      closeModal();
      alert("Instant Transfer Complete! Emma's Nuuvia account received the funds via FedNow (Payfinia gateway).");
    }, 1500);
  };

  const handleOfferAccepted = () => {
    setOfferStatus("processing");
    setTimeout(() => {
      setOfferStatus("success");
    }, 1500);
  };

  return (
    <div className="app-layout">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Modal for Skip-A-Pay */}
      <div
        id="skip-pay-modal"
        className={`modal ${activeModal === "skip-pay-modal" ? "active" : ""}`}
        onClick={handleBackdropClick}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Skip-A-Pay</h2>
            <button className="close-btn" onClick={closeModal}><i className="fas fa-times"></i></button>
          </div>
          <div className="modal-body">
            <p>You are eligible to skip your next Auto Loan payment of <strong>$450.00</strong> scheduled for April 1st. Using Skip-A-Pay frees up cash when you need it most, without harming your credit.</p>
            <div className="fee-notice"><i className="fas fa-info-circle"></i> A $35 processing fee will be applied. Your loan term will be extended by one month, and interest will continue to accrue.</div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={confirmSkipPay} disabled={skipPayStatus === "processing"}>
              {skipPayStatus === "processing" ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : "Confirm & Skip Payment"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Payfinia Instant Transfer */}
      <div
        id="payfinia-modal"
        className={`modal payfinia-theme ${activeModal === "payfinia-modal" ? "active" : ""}`}
        onClick={handleBackdropClick}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2><i className="fas fa-bolt" style={{ color: "var(--payfinia-primary)" }}></i> Send Money via IPX</h2>
            <button className="close-btn" onClick={closeModal}><i className="fas fa-times"></i></button>
          </div>
          <div className="modal-body">
            <p>Powered by Payfinia & the FedNow network, funds are delivered instantly to the recipient's account.</p>
            <div className="input-group">
              <label>Recipient Note / Email / Phone</label>
              <input type="text" placeholder="e.g. emma@example.com" />
            </div>
            <div className="input-group">
              <label>Amount</label>
              <input type="number" placeholder="$0.00" defaultValue="50.00" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary btn-block" onClick={sendInstantPayment} disabled={payfiniaStatus === "processing"}>
              {payfiniaStatus === "processing" ? <><i className="fas fa-spinner fa-spin"></i> Sending via IPX...</> : "Send Instantly"}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Shell (Tyfone nFinia customized for CU) */}
      <aside className="sidebar">
        <div className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logoSPFCU.jpeg" alt="Summit Peak Federal Credit Union" style={{ width: "100%", maxWidth: "180px", height: "auto" }} />
        </div>
        <nav className="nav-menu">
          <a href="#" className="nav-item active"><i className="fas fa-home"></i> Home</a>
          <a href="#" className="nav-item"><i className="fas fa-wallet"></i> Accounts</a>
          <a href="/storefront" className="nav-item"><i className="fas fa-store"></i> Storefront <span className="badge primary" style={{ padding: "2px 6px", fontSize: "0.6rem" }}>New</span></a>
          <a href="#" className="nav-item"><i className="fas fa-exchange-alt"></i> Transfers</a>
          <a href="#" className="nav-item"><i className="fas fa-chart-pie"></i> Insights</a>
          <a href="#" className="nav-item"><i className="fas fa-file-invoice-dollar"></i> Bill Pay</a>
          <a href="#" className="nav-item"><i className="fas fa-cog"></i> Settings</a>
        </nav>

        <div style={{ flexGrow: 1 }}></div>

        <div className="user-profile">
          <img src="https://ui-avatars.com/api/?name=Betsy+Golden&background=F1F5F9&color=002d72&bold=true" alt="Betsy" className="avatar" />
          <div className="user-info">
            <span className="name">Betsy Golden</span>
            <span className="status">Premium Member</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search transactions, products, or help..." />
          </div>
          <div className="topbar-actions">
            <button className="icon-btn"><i className="fas fa-comment-dots"></i></button>
            <button className="icon-btn"><i className="fas fa-bell"></i><span className="notification-dot"></span></button>
          </div>
        </header>

        <div className="dashboard-grid">

          {/* Left Column */}
          <div className="dashboard-col-left">
            <section className="welcome-section">
              <h1>Good morning, Betsy</h1>
              <p className="subtitle">Here's a look at your financial ecosystem today.</p>

              <div className="quick-actions">
                <button className="btn-action" onClick={() => openModal("payfinia-modal")}>
                  <i className="fas fa-paper-plane"></i>
                  <span>Send Money</span>
                  <small>Payfinia IPX</small>
                </button>
                <button className="btn-action" onClick={() => alert('Remote Deposit Capture launched. Please photograph the front and back of your check.')}>
                  <i className="fas fa-mobile-alt"></i>
                  <span>Deposit Check</span>
                  <small>Remote Capture</small>
                </button>
                <button className="btn-action" onClick={() => alert('Quick Pay Initiated')}>
                  <i className="fas fa-bolt"></i>
                  <span>Pay Loan</span>
                  <small>Quick Pay</small>
                </button>
                <button className="btn-action" onClick={() => alert('eStatements portal opened. Your most recent statement is available for March 2026.')}>
                  <i className="fas fa-file-signature"></i>
                  <span>Documents</span>
                  <small>eStatements</small>
                </button>
              </div>
            </section>

            {/* Core Banking (Tyfone configured) */}
            <section className="widget">
              <div className="widget-header">
                <h2>My Accounts</h2>
                <a href="#" className="link">View All</a>
              </div>
              <div className="account-list">
                <div className="account-card solid-card">
                  <div className="acct-info">
                    <h3>Prime Checking</h3>
                    <span className="acct-num">...4092</span>
                  </div>
                  <div className="acct-balance">
                    <div className="amount">{offerStatus === "success" ? "$47,450.80" : "$12,450.80"}</div>
                    <div className="available">Available Balance</div>
                  </div>
                </div>

                {/* Loan Account with Skip-A-Pay */}
                <div className="account-card solid-card loan-card" style={{ cursor: "default" }}>
                  <div style={{ padding: "1.5rem" }}>
                    <div className="loan-header">
                      <div className="acct-info">
                        <h3>2024 Tesla Model 3 Auto Loan</h3>
                        <span className="acct-num">...9912</span>
                        <span className="rate">5.4% APR</span>
                      </div>
                      <div className="acct-balance">
                        <div className="amount">$34,210.00</div>
                        <div className="available">Current Balance</div>
                      </div>
                    </div>

                    <div className="loan-divider"></div>

                    <div className="loan-actions">
                      {skipPayCompleted ? (
                        <div className="next-payment">Next Payment<br /><strong>$450.00</strong> on May 1 <span className="badge success" style={{ marginLeft: "0.5rem" }}>Skipped Apr 1</span></div>
                      ) : (
                        <div className="next-payment">Next Payment<br /><strong>$450.00</strong> <span className="due-date">due Apr 1</span></div>
                      )}
                      <div className="btn-group">
                        <button className="btn btn-outline btn-sm" onClick={() => alert('Quick Pay Initiated')}><i className="fas fa-bolt" style={{ color: "var(--brand-primary)" }}></i> Quick Pay</button>
                        {!skipPayCompleted && (
                          <button className="btn btn-primary btn-sm skip-pay-btn" onClick={() => openModal('skip-pay-modal')}>Skip-A-Pay</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Nuuvia Youth Banking Embedded Widget */}
            <section className="widget">
              <div className="widget-header">
                <h2>Nuuvia SmartStart <span className="provider"><i className="fas fa-leaf"></i> Youth Banking</span></h2>
                <a href="#" className="link">Manage Family</a>
              </div>
              <div className="solid-card youth-widget">
                <div className="youth-top">
                  <img src="https://ui-avatars.com/api/?name=Emma+C&background=10B981&color=fff&bold=true" alt="Emma" className="avatar-sm" />
                  <div>
                    <h3>Emma's Account</h3>
                    <p>Age 14 • Learner Tier</p>
                  </div>
                  <div className="youth-balance">
                    <p>Available Limit</p>
                    <div className="amount" style={{ color: "var(--nuuvia-primary)" }}>{payfiniaSent ? "$500.00" : "$450.00"}</div>
                  </div>
                </div>

                <div className="youth-content">
                  <div className="quest-card">
                    <div className="quest-title">
                      <span>Saving for: Mountain Bike</span>
                      <span>{payfiniaSent ? "95%" : "75%"}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill nuuvia-fill" style={{ width: payfiniaSent ? "95%" : "75%" }}></div>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}><i className="fas fa-check-circle" style={{ color: "var(--nuuvia-primary)" }}></i> Finished Chores: +$20</p>
                  </div>
                  <div className="youth-actions">
                    <button className="btn btn-outline btn-block" onClick={() => openModal('payfinia-modal')}><i className="fas fa-bolt" style={{ color: "var(--payfinia-primary)" }}></i> Send Allowance Instantly</button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="dashboard-col-right">

            {/* Movemint Storefront (Cunexus) */}
            <section className="widget storefront-widget">
              <DemopolisOfferWidget onOfferAccepted={handleOfferAccepted} />
            </section>

            {/* Payfinia Instant Payments Feed */}
            <section className="widget">
              <div className="widget-header">
                <h2>Recent Activity <span className="provider">Payfinia Gateway</span></h2>
              </div>
              <div className="activity-feed solid-card">
                <div className="activity-item">
                  <div className="act-icon" style={{ background: "#ECFDF5" }}><i className="fas fa-arrow-down" style={{ color: "var(--movemint-teal)" }}></i></div>
                  <div className="act-details">
                    <p>Instant Transfer In</p>
                    <span className="time">Today, 8:42 AM • FedNow</span>
                  </div>
                  <div className="act-amount pos">+$120.00</div>
                </div>
                <div className="activity-item">
                  <div className="act-icon" style={{ background: "#FEF2F2" }}><i className="fas fa-arrow-up" style={{ color: "#EF4444" }}></i></div>
                  <div className="act-details">
                    <p>Emma's Allowance</p>
                    <span className="time">Yesterday, 5:00 PM • IPX Mobile</span>
                  </div>
                  <div className="act-amount neg">-$50.00</div>
                </div>
                <div className="activity-item">
                  <div className="act-icon"><i className="fas fa-shopping-cart"></i></div>
                  <div className="act-details">
                    <p>Whole Foods Market</p>
                    <span className="time">Yesterday, 1:15 PM • Debit</span>
                  </div>
                  <div className="act-amount neg">-$84.30</div>
                </div>
                <div style={{ padding: "1rem" }}>
                  <button className="btn btn-secondary btn-block">View Full History</button>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
