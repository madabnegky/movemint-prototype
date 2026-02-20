"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, LogOut, Palette, Play, ToggleLeft, Megaphone, Package, Eye, Home, ChevronDown, ChevronRight, Layers, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

function NavItemComponent({ item, pathname, depth = 0 }: { item: NavItem; pathname: string; depth?: number }) {
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
                            <NavItemComponent key={child.href} item={child} pathname={pathname} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center font-bold text-white">
                            A
                        </div>
                        <span className="text-lg font-bold tracking-tight">Admin Console</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {NAV_ITEMS.map((item) => (
                        <NavItemComponent key={item.href} item={item} pathname={pathname} />
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                        <LogOut className="w-5 h-5" />
                        Exit Prototype
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center px-8 justify-between">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        {getPageTitle(pathname)}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300"></div>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
