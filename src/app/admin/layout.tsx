"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, LogOut, Palette, Play, ToggleLeft, Megaphone, Package, Eye, Home, ChevronDown, ChevronRight, Layers, Globe, Bell, Calendar, ToggleRight, Calculator, PanelLeft, PanelLeftClose, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useSyncExternalStore } from "react";

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
    { name: "Pricing Model", href: "/admin/pricing-model", icon: Calculator },
    {
        name: "Preview",
        href: "/admin/preview",
        icon: Eye,
        children: [
            { name: "Storefront", href: "/storefront", icon: ShoppingBag },
            { name: "Stranger Storefront", href: "/stranger-storefront", icon: Globe },
            { name: "Home Banking", href: "/home-banking", icon: Home },
            { name: "Demo Scenarios", href: "/admin/scenarios", icon: Layers },
            { name: "Offer Editor", href: "/admin/product-config", icon: Play },
            { name: "Offer Windows", href: "/admin/offer-windows", icon: Calendar },
            { name: "Always-On Offers", href: "/admin/always-on-offers", icon: ToggleRight },
        ]
    },
    {
        name: "Settings",
        href: "/admin/settings",
        icon: Palette,
        children: [
            { name: "Appearance", href: "/admin/storefront-settings", icon: Palette },
            { name: "Stranger Storefront", href: "/admin/stranger-storefront", icon: Globe },
            { name: "Feature Flags", href: "/admin/feature-flags", icon: ToggleLeft },
        ]
    },
];

function NavItemComponent({ item, pathname, depth = 0, onNavigate }: { item: NavItem; pathname: string; depth?: number; onNavigate?: () => void }) {
    const [isExpanded, setIsExpanded] = useState(true);

    const hasChildren = item.children && item.children.length > 0;

    // Check if this item or any child is active
    const isActive = pathname === item.href ||
        (item.href !== "/admin" && !hasChildren && pathname.startsWith(item.href));
    const hasActiveChild = hasChildren && item.children!.some(child =>
        pathname === child.href || pathname.startsWith(child.href)
    );

    if (hasChildren) {
        return (
            <div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        hasActiveChild
                            ? "text-white"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                </button>
                {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-3">
                        {item.children!.map((child) => (
                            <NavItemComponent key={child.href} item={child} pathname={pathname} depth={depth + 1} onNavigate={onNavigate} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                    ? "bg-blue-600 text-white shadow-md relative overflow-hidden"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
        >
            {isActive && (
                <div className="absolute inset-0 bg-blue-500 opacity-20 pointer-events-none" />
            )}
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.name}
        </Link>
    );
}

function getPageTitle(pathname: string): string {
    // Check top-level items first
    for (const item of NAV_ITEMS) {
        if (pathname === item.href) return item.name;
        if (item.children) {
            for (const child of item.children) {
                if (pathname === child.href || pathname.startsWith(child.href)) {
                    return child.name;
                }
            }
        }
        if (item.href !== "/admin" && pathname.startsWith(item.href)) {
            return item.name;
        }
    }
    return 'Admin Console';
}

const STORAGE_KEY = "admin-sidebar-collapsed";

// Subscribe to localStorage as an external store so React reads the persisted
// value during render (not after-render in a useEffect). This avoids the
// "setState in effect" cascade and is the recommended React 18+ pattern for
// browser-storage-backed state.
function subscribeToStorage(callback: () => void) {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
}
const getStoredCollapsed = () => localStorage.getItem(STORAGE_KEY) === "1";
const getServerCollapsed = () => false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // collapsed — desktop sidebar hidden, content uses full width. Persists in localStorage.
    // mobileOpen — phone drawer; always starts closed, closes after navigation.
    const persistedCollapsed = useSyncExternalStore(subscribeToStorage, getStoredCollapsed, getServerCollapsed);
    const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null);
    const collapsed = collapsedOverride ?? persistedCollapsed;
    const setCollapsed = (next: boolean | ((prev: boolean) => boolean)) => {
        const value = typeof next === "function" ? next(collapsed) : next;
        setCollapsedOverride(value);
        localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    };
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile drawer on Escape
    useEffect(() => {
        if (!mobileOpen) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setMobileOpen(false);
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [mobileOpen]);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Mobile overlay backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-slate-900 text-white flex flex-col",
                    // Mobile: fixed-position drawer
                    "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out md:transition-[width,margin]",
                    mobileOpen ? "translate-x-0" : "-translate-x-full",
                    // Desktop: in-flow sidebar that can collapse
                    "md:relative md:translate-x-0 md:flex-shrink-0",
                    collapsed ? "md:w-0 md:overflow-hidden md:border-r-0" : "md:w-64",
                )}
            >
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center font-bold text-white">
                            A
                        </div>
                        <span className="text-lg font-bold tracking-tight">Admin Console</span>
                    </div>
                    {/* Mobile close button (sidebar internal) */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden text-slate-400 hover:text-white p-1 -mr-1"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => (
                        <NavItemComponent
                            key={item.href}
                            item={item}
                            pathname={pathname}
                            onNavigate={() => setMobileOpen(false)}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Link
                        href="/"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Exit Prototype
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto min-w-0">
                <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center px-4 md:px-8 gap-3 justify-between">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        {/* Sidebar toggle: opens drawer on mobile, collapses/expands on desktop */}
                        <button
                            onClick={() => {
                                if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
                                    setCollapsed((c) => !c);
                                } else {
                                    setMobileOpen(true);
                                }
                            }}
                            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded-md transition-colors"
                            aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
                            title={collapsed ? "Show sidebar" : "Hide sidebar"}
                        >
                            {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                        </button>
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider truncate">
                            {getPageTitle(pathname)}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300"></div>
                    </div>
                </header>
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
