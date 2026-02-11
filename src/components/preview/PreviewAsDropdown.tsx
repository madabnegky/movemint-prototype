"use client";

import { useState, useRef, useEffect } from "react";
import { useStore, MemberProfile } from "@/context/StoreContext";
import { ChevronDown, User, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewAsDropdownProps {
    className?: string;
}

export function PreviewAsDropdown({ className }: PreviewAsDropdownProps) {
    const { memberProfiles, selectedProfileId, setSelectedProfileId } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedProfile = memberProfiles.find(p => p.id === selectedProfileId);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (profile: MemberProfile | null) => {
        setSelectedProfileId(profile?.id || null);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className={cn("relative", className)}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm font-medium",
                    selectedProfile
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
            >
                <User className="w-4 h-4" />
                <span>{selectedProfile ? `Preview as: ${selectedProfile.name}` : "Preview As..."}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-900">Preview As Member Profile</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Simulate how offers appear to different member types
                        </p>
                    </div>

                    {/* Demo Mode Option */}
                    <div className="p-2 border-b border-slate-100">
                        <button
                            onClick={() => handleSelect(null)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                                !selectedProfile
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "hover:bg-slate-50 text-slate-700"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                !selectedProfile ? "bg-indigo-100" : "bg-slate-100"
                            )}>
                                <Info className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Demo Mode</p>
                                <p className="text-xs text-slate-500 truncate">Show all demo offers (no rules)</p>
                            </div>
                            {!selectedProfile && (
                                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                            )}
                        </button>
                    </div>

                    {/* Profile Options */}
                    <div className="p-2 max-h-72 overflow-y-auto">
                        <p className="px-3 py-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Member Profiles
                        </p>
                        {memberProfiles.map((profile) => (
                            <button
                                key={profile.id}
                                onClick={() => handleSelect(profile)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                                    selectedProfileId === profile.id
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "hover:bg-slate-50 text-slate-700"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                    selectedProfileId === profile.id ? "bg-indigo-100" : "bg-slate-100"
                                )}>
                                    {profile.attributes.creditScore}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{profile.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{profile.description}</p>
                                </div>
                                {selectedProfileId === profile.id && (
                                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Selected Profile Details */}
                    {selectedProfile && (
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                            <p className="text-xs font-medium text-slate-500 mb-2">Profile Attributes</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Credit Score:</span>
                                    <span className="font-medium text-slate-700">{selectedProfile.attributes.creditScore}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Tenure:</span>
                                    <span className="font-medium text-slate-700">{selectedProfile.attributes.memberTenureYears} yrs</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Has Auto Loan:</span>
                                    <span className="font-medium text-slate-700">{selectedProfile.attributes.hasAutoLoan ? "Yes" : "No"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Has Mortgage:</span>
                                    <span className="font-medium text-slate-700">{selectedProfile.attributes.hasMortgage ? "Yes" : "No"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Balance:</span>
                                    <span className="font-medium text-slate-700">${selectedProfile.attributes.accountBalance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Direct Deposit:</span>
                                    <span className="font-medium text-slate-700">{selectedProfile.attributes.directDeposit ? "Yes" : "No"}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
