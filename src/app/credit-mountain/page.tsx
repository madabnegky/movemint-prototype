"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, TrendingUp, MessageSquare, Target, Wrench, FileText, HelpCircle, Settings, Send } from "lucide-react";

// Mock conversation history
const SAMPLE_CONVERSATIONS = [
    "Why was my loan declined?",
    "Improve my credit score?",
    "Car loan approval check",
    "Credit utilization",
    "Help me dispute an error",
    "Credit dispute assistant",
];

// Credit score gauge component
function CreditScoreGauge({ score }: { score: number }) {
    // Calculate the angle for the needle (300 = 0deg, 850 = 180deg)
    const minScore = 300;
    const maxScore = 850;
    const range = maxScore - minScore;
    const percentage = (score - minScore) / range;
    const angle = percentage * 180 - 90; // -90 to 90 degrees

    const getScoreLabel = (score: number) => {
        if (score >= 800) return { label: "Excellent", color: "text-green-600", bg: "bg-green-100" };
        if (score >= 740) return { label: "Very Good", color: "text-green-600", bg: "bg-green-100" };
        if (score >= 670) return { label: "Good", color: "text-yellow-600", bg: "bg-yellow-100" };
        if (score >= 580) return { label: "Fair", color: "text-orange-600", bg: "bg-orange-100" };
        return { label: "Poor", color: "text-red-600", bg: "bg-red-100" };
    };

    const scoreInfo = getScoreLabel(score);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Your credit score</h3>
            <div className="flex items-center gap-6">
                {/* Gauge */}
                <div className="relative w-32 h-16">
                    <svg viewBox="0 0 200 100" className="w-full h-full">
                        {/* Background arc */}
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="16"
                            strokeLinecap="round"
                        />
                        {/* Red segment */}
                        <path
                            d="M 20 100 A 80 80 0 0 1 56 40"
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth="16"
                            strokeLinecap="round"
                        />
                        {/* Orange segment */}
                        <path
                            d="M 56 40 A 80 80 0 0 1 100 20"
                            fill="none"
                            stroke="#F97316"
                            strokeWidth="16"
                            strokeLinecap="round"
                        />
                        {/* Yellow segment */}
                        <path
                            d="M 100 20 A 80 80 0 0 1 144 40"
                            fill="none"
                            stroke="#EAB308"
                            strokeWidth="16"
                            strokeLinecap="round"
                        />
                        {/* Green segment */}
                        <path
                            d="M 144 40 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#22C55E"
                            strokeWidth="16"
                            strokeLinecap="round"
                        />
                        {/* Needle */}
                        <g transform={`rotate(${angle}, 100, 100)`}>
                            <line x1="100" y1="100" x2="100" y2="35" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
                            <circle cx="100" cy="100" r="8" fill="#1F2937" />
                        </g>
                    </svg>
                    <div className="absolute -bottom-2 left-0 right-0 flex justify-between text-xs text-gray-400 px-1">
                        <span>300</span>
                        <span>850</span>
                    </div>
                </div>
                {/* Score display */}
                <div>
                    <div className="text-4xl font-bold text-gray-900">{score}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">Your credit score is</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${scoreInfo.bg} ${scoreInfo.color}`}>
                            {scoreInfo.label}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Last updated: March 23, 2025</div>
                </div>
            </div>
        </div>
    );
}

// Insights panel
function InsightsPanel() {
    const insights = [
        { icon: "↘", text: "Your utilization is trending up — risk of score drop." },
        { icon: "↘", text: "Compared to similar members, your savings is low." },
        { icon: "↘", text: "Pay off $1,200 on your Visa by November — this improves your score by ~32 pts." },
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-4">
                <span className="text-blue-500">✨</span> Insights
            </h3>
            <div className="space-y-3">
                {insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-gray-400 mt-0.5">{insight.icon}</span>
                        <span>{insight.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Quick action cards
function QuickActionCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
    return (
        <button className="bg-gray-50 hover:bg-gray-100 rounded-xl p-6 text-left transition-colors border border-gray-200">
            <Icon className="w-6 h-6 text-gray-600 mb-3" />
            <p className="text-sm text-gray-700 font-medium leading-relaxed">{title}</p>
        </button>
    );
}

export default function CreditMountainPage() {
    const [message, setMessage] = useState("");

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Left Sidebar - Conversations */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">Conversations</h2>
                </div>
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                    {SAMPLE_CONVERSATIONS.map((conv, idx) => (
                        <button
                            key={idx}
                            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {conv}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-200 space-y-2">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <HelpCircle className="w-4 h-4" />
                        Help?
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Navigation */}
                <header className="bg-white border-b border-gray-200 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            {/* Logo */}
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">CU</span>
                                </div>
                                <span className="font-bold text-gray-900">MY FAVORITE</span>
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Credit Union</span>
                            </div>
                            {/* Nav links */}
                            <nav className="flex items-center gap-6 text-sm">
                                <Link href="#" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
                                    <Home className="w-4 h-4" />
                                    Dashboard
                                </Link>
                                <Link href="#" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
                                    <TrendingUp className="w-4 h-4" />
                                    Credit Monitoring
                                </Link>
                                <Link href="#" className="flex items-center gap-1.5 text-blue-600 font-medium border-b-2 border-blue-600 pb-2 -mb-[13px]">
                                    <MessageSquare className="w-4 h-4" />
                                    Credit Coach
                                </Link>
                                <Link href="#" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
                                    <Wrench className="w-4 h-4" />
                                    Tools
                                </Link>
                                <Link href="#" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
                                    <Target className="w-4 h-4" />
                                    Goals
                                </Link>
                                <Link href="#" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
                                    <FileText className="w-4 h-4" />
                                    Articles
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
                                <option>English</option>
                            </select>
                            <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">John</div>
                                <div className="text-xs text-gray-500">john.doe@gmail.com</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Chat Area */}
                <main className="flex-1 flex">
                    {/* Chat Content */}
                    <div className="flex-1 flex flex-col p-8">
                        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                            <h1 className="text-3xl font-semibold text-gray-900 mb-8">How can I help you?</h1>

                            {/* Quick Action Cards */}
                            <div className="grid grid-cols-3 gap-4 w-full mb-8">
                                <QuickActionCard
                                    icon={MessageSquare}
                                    title="I want to learn how Myfavorite CU can help me"
                                    description=""
                                />
                                <QuickActionCard
                                    icon={TrendingUp}
                                    title="AmI ready to apply"
                                    description=""
                                />
                                <QuickActionCard
                                    icon={Target}
                                    title="I want to learn more about personal finances"
                                    description=""
                                />
                            </div>

                            {/* Disclaimer */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3 w-full mb-6">
                                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">BETA</span>
                                <p className="text-xs text-amber-800">
                                    AI Credit Coach is not financial or legal advice, and does not guarantee qualification for any loan product. Messages may be stored or processed — avoid sharing sensitive information.{" "}
                                    <button className="underline font-medium">Read full disclaimer</button>
                                </p>
                            </div>

                            {/* Chat Input */}
                            <div className="w-full relative">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Ask me anything..."
                                    className="w-full px-4 py-4 pr-12 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-800 hover:bg-gray-900 text-white rounded-full flex items-center justify-center transition-colors">
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Credit Score */}
                    <aside className="w-80 bg-gray-50 border-l border-gray-200 p-6 space-y-6">
                        <CreditScoreGauge score={810} />
                        <InsightsPanel />
                    </aside>
                </main>
            </div>

            {/* Floating Back to Prototype button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Link
                    href="/storefront"
                    className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-full shadow-lg hover:bg-gray-900 transition-colors"
                >
                    Back to Storefront
                </Link>
            </div>
        </div>
    );
}
