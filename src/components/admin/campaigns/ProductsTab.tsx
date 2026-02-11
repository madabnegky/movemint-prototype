"use client";

import { useState } from "react";
import {
    Campaign,
    CampaignSection,
    CampaignProduct,
    ProductType,
} from "@/context/StoreContext";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import {
    Plus,
    Star,
    GripVertical,
    MoreHorizontal,
    Pencil,
    Trash2,
    X,
    ChevronDown,
    ChevronRight,
    Package,
    Info,
    CheckCircle2,
    Users,
} from "lucide-react";
import ProductRulesEditor from "./ProductRulesEditor";

interface ProductsTabProps {
    campaign: Campaign;
    onUpdate: (updates: Partial<Campaign>) => void;
}

// Product type labels
const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
    "auto-loan": "Auto Loan",
    "auto-refi": "Auto Refinance",
    "home-loan": "Home Loan",
    "heloc": "HELOC",
    "credit-card": "Credit Card",
    "credit-limit-increase": "Credit Limit Increase",
    "term-life": "Term Life Insurance",
    "gap": "GAP Coverage",
    "mrc": "MRC",
    "debt-protection": "Debt Protection",
    // Deposit products
    "savings": "Savings Account",
    "checking": "Checking Account",
    "money-market": "Money Market Account",
    "certificate": "Share Certificate (CD)",
};

// Add Product Modal
function AddProductModal({
    isOpen,
    onClose,
    onAdd,
    sectionId,
    sectionName,
    isFeatured,
    existingProductIds,
}: {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (product: CampaignProduct) => void;
    sectionId: string;
    sectionName: string;
    isFeatured: boolean;
    existingProductIds: string[];
}) {
    const { products } = useStore();
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [featuredHeadline, setFeaturedHeadline] = useState("");
    const [featuredDescription, setFeaturedDescription] = useState("");
    const [featuredPreapprovalHeadline, setFeaturedPreapprovalHeadline] = useState("");
    const [featuredPreapprovalDescription, setFeaturedPreapprovalDescription] = useState("");

    if (!isOpen) return null;

    // Filter out products already added and only show active products
    const availableProducts = products.filter(
        (p) => p.isActive && !existingProductIds.includes(p.id)
    );

    const selectedProduct = products.find((p) => p.id === selectedProductId);

    const handleAdd = () => {
        if (!selectedProduct) return;

        const newProduct: CampaignProduct = {
            id: `cp-${Date.now()}`,
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            productType: selectedProduct.type,
            sectionId,
            isFeaturedOffer: isFeatured,
            featuredHeadline: isFeatured ? featuredHeadline : undefined,
            featuredDescription: isFeatured ? featuredDescription : undefined,
            featuredPreapprovalHeadline: isFeatured ? featuredPreapprovalHeadline : undefined,
            featuredPreapprovalDescription: isFeatured ? featuredPreapprovalDescription : undefined,
            isDefaultCampaignProduct: false,
            productRules: [],
            preapprovalRules: [],
            introRateRules: [],
            consumerPrequalRules: [],
        };

        onAdd(newProduct);
        onClose();

        // Reset form
        setSelectedProductId("");
        setFeaturedHeadline("");
        setFeaturedDescription("");
        setFeaturedPreapprovalHeadline("");
        setFeaturedPreapprovalDescription("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            {isFeatured ? "Add Featured Product" : "Add Product"}
                        </h2>
                        <p className="text-sm text-slate-500">Adding to: {sectionName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {/* Product Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Select Product <span className="text-rose-500">*</span>
                        </label>
                        {availableProducts.length === 0 ? (
                            <p className="text-sm text-slate-500 py-2">
                                All products have been added to this campaign.
                            </p>
                        ) : (
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                            >
                                <option value="">Select a product...</option>
                                {availableProducts.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} ({PRODUCT_TYPE_LABELS[product.type]})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Featured Offer Fields */}
                    {isFeatured && selectedProductId && (
                        <>
                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="text-sm font-medium text-slate-900 mb-3">
                                    Featured Preapproval Text
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Preapproval Headline
                                        </label>
                                        <input
                                            type="text"
                                            value={featuredPreapprovalHeadline}
                                            onChange={(e) => setFeaturedPreapprovalHeadline(e.target.value)}
                                            placeholder="e.g., You're preapproved!"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Preapproval Description
                                        </label>
                                        <textarea
                                            value={featuredPreapprovalDescription}
                                            onChange={(e) => setFeaturedPreapprovalDescription(e.target.value)}
                                            placeholder="Short description for preapproved customers"
                                            rows={2}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="text-sm font-medium text-slate-900 mb-3">
                                    Featured Application Text
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Application Headline
                                        </label>
                                        <input
                                            type="text"
                                            value={featuredHeadline}
                                            onChange={(e) => setFeaturedHeadline(e.target.value)}
                                            placeholder="e.g., Apply for a New Auto Loan"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Application Description
                                        </label>
                                        <textarea
                                            value={featuredDescription}
                                            onChange={(e) => setFeaturedDescription(e.target.value)}
                                            placeholder="Short description for the offer"
                                            rows={2}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!selectedProductId}
                        className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Add Product
                    </button>
                </div>
            </div>
        </div>
    );
}

// Add Section Modal
function AddSectionModal({
    isOpen,
    onClose,
    onAdd,
}: {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string) => void;
}) {
    const [name, setName] = useState("");

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!name.trim()) return;
        onAdd(name.trim());
        setName("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Add Section</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Section Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Auto Loans & Offers"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!name.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Add Section
                    </button>
                </div>
            </div>
        </div>
    );
}

// Product Card Component
function ProductCard({
    product,
    isTargeted,
    onEdit,
    onRemove,
}: {
    product: CampaignProduct;
    isTargeted: boolean;
    onEdit: () => void;
    onRemove: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const hasRules = product.productRules.length > 0;
    const hasPreapprovalRules = product.preapprovalRules.length > 0;

    return (
        <div className="group flex items-center gap-3 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
            <div className="text-slate-300 cursor-grab">
                <GripVertical className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 text-sm truncate">
                        {product.productName}
                    </span>
                    {product.isFeaturedOffer && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">
                        {PRODUCT_TYPE_LABELS[product.productType]}
                    </span>
                    {isTargeted && (
                        <>
                            {product.isDefaultCampaignProduct && (
                                <span className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                                    Default
                                </span>
                            )}
                            {hasRules && (
                                <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                                    {product.productRules.length} rule{product.productRules.length !== 1 && "s"}
                                </span>
                            )}
                            {hasPreapprovalRules && (
                                <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                                    {product.preapprovalRules.length} preapproval
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="relative">
                {showDeleteConfirm ? (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                onRemove();
                                setShowDeleteConfirm(false);
                            }}
                            className="px-2 py-1 text-xs font-medium text-white bg-rose-600 rounded hover:bg-rose-700 transition-colors"
                        >
                            Remove
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                                    <button
                                        onClick={() => {
                                            onEdit();
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Remove
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Section Component
function SectionCard({
    section,
    isFeatured,
    isTargeted,
    onAddProduct,
    onEditProduct,
    onRemoveProduct,
    onRemoveSection,
}: {
    section: CampaignSection;
    isFeatured: boolean;
    isTargeted: boolean;
    onAddProduct: () => void;
    onEditProduct: (product: CampaignProduct) => void;
    onRemoveProduct: (productId: string) => void;
    onRemoveSection?: () => void;
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 text-left"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <div className="flex items-center gap-2">
                            {isFeatured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                            <h3 className="font-semibold text-slate-900">{section.name}</h3>
                            <span className="text-xs text-slate-500">
                                ({section.products.length} product{section.products.length !== 1 && "s"})
                            </span>
                        </div>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onAddProduct}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            Add Product
                        </button>
                        {!isFeatured && onRemoveSection && (
                            showDeleteConfirm ? (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            onRemoveSection();
                                            setShowDeleteConfirm(false);
                                        }}
                                        className="px-2 py-1 text-xs font-medium text-white bg-rose-600 rounded hover:bg-rose-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4">
                    {section.products.length === 0 ? (
                        <div className="text-center py-6 text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p>No products yet</p>
                            <button
                                onClick={onAddProduct}
                                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Add a product
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {section.products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    isTargeted={isTargeted}
                                    onEdit={() => onEditProduct(product)}
                                    onRemove={() => onRemoveProduct(product.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ProductsTab({ campaign, onUpdate }: ProductsTabProps) {
    const { products } = useStore();
    const [showAddProductModal, setShowAddProductModal] = useState<{
        sectionId: string;
        sectionName: string;
        isFeatured: boolean;
    } | null>(null);
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<CampaignProduct | null>(null);

    const isTargeted = campaign.type === "targeted";

    // Get all existing product IDs in campaign
    const existingProductIds = [
        ...campaign.featuredOffersSection.products.map((p) => p.productId),
        ...campaign.sections.flatMap((s) => s.products.map((p) => p.productId)),
    ];

    // Handle adding a product
    const handleAddProduct = (product: CampaignProduct) => {
        if (showAddProductModal?.isFeatured) {
            onUpdate({
                featuredOffersSection: {
                    ...campaign.featuredOffersSection,
                    products: [...campaign.featuredOffersSection.products, product],
                },
            });
        } else {
            const sectionId = showAddProductModal?.sectionId;
            onUpdate({
                sections: campaign.sections.map((s) =>
                    s.id === sectionId
                        ? { ...s, products: [...s.products, product] }
                        : s
                ),
            });
        }
    };

    // Handle updating a product
    const handleUpdateProduct = (updatedProduct: CampaignProduct) => {
        // Check if it's in featured section
        const isInFeatured = campaign.featuredOffersSection.products.some(
            (p) => p.id === updatedProduct.id
        );

        if (isInFeatured) {
            onUpdate({
                featuredOffersSection: {
                    ...campaign.featuredOffersSection,
                    products: campaign.featuredOffersSection.products.map((p) =>
                        p.id === updatedProduct.id ? updatedProduct : p
                    ),
                },
            });
        } else {
            onUpdate({
                sections: campaign.sections.map((s) => ({
                    ...s,
                    products: s.products.map((p) =>
                        p.id === updatedProduct.id ? updatedProduct : p
                    ),
                })),
            });
        }
        setEditingProduct(null);
    };

    // Handle removing a product
    const handleRemoveProduct = (sectionId: string, productId: string, isFeatured: boolean) => {
        if (isFeatured) {
            onUpdate({
                featuredOffersSection: {
                    ...campaign.featuredOffersSection,
                    products: campaign.featuredOffersSection.products.filter(
                        (p) => p.id !== productId
                    ),
                },
            });
        } else {
            onUpdate({
                sections: campaign.sections.map((s) =>
                    s.id === sectionId
                        ? { ...s, products: s.products.filter((p) => p.id !== productId) }
                        : s
                ),
            });
        }
    };

    // Handle adding a section
    const handleAddSection = (name: string) => {
        const newSection: CampaignSection = {
            id: `section-${Date.now()}`,
            name,
            order: campaign.sections.length + 1,
            products: [],
        };
        onUpdate({
            sections: [...campaign.sections, newSection],
        });
    };

    // Handle removing a section
    const handleRemoveSection = (sectionId: string) => {
        onUpdate({
            sections: campaign.sections.filter((s) => s.id !== sectionId),
        });
    };

    const isPerpetual = campaign.type === "perpetual";

    // Build list of available products for replacement selection (perpetual campaigns)
    const availableProductsForReplacement = products
        .filter(p => p.isActive)
        .map(p => ({ id: p.id, name: p.name }));

    // If editing a product, show the rules editor
    if (editingProduct) {
        return (
            <ProductRulesEditor
                product={editingProduct}
                isTargeted={isTargeted}
                isPerpetual={isPerpetual}
                onSave={handleUpdateProduct}
                onCancel={() => setEditingProduct(null)}
                availableProducts={availableProductsForReplacement}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            {isTargeted && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-purple-800">
                            <p className="font-medium">Targeted Campaign</p>
                            <p className="mt-1 text-purple-700">
                                Products can have rules that determine which customers see them and who gets preapproved.
                                Edit a product to configure its rules.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {isPerpetual && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-indigo-800">
                            <p className="font-medium">Perpetual Campaign</p>
                            <p className="mt-1 text-indigo-700">
                                Products can have rules that determine which members see them and who gets preapproved.
                                Offers also rotate automatically based on lifecycle settings.
                                Edit a product to configure its rules, duration, expiration, and rotation behavior.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign Product Summary */}
            {campaign.metrics && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-slate-500" />
                        <h3 className="text-sm font-medium text-slate-900">Campaign Product Summary</h3>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-center">
                        <div>
                            <div className="text-xl font-bold text-slate-900">
                                {campaign.metrics.customerFileTotal.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">Customer File</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">
                                {campaign.metrics.enhancedCustomerFileTotal.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">Enhanced File</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">
                                {campaign.metrics.productMatches.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">Product Matches</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-emerald-600">
                                {campaign.metrics.preapprovals.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">Preapprovals</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-blue-600">
                                {campaign.metrics.applications.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">Applications</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Featured Offers Section */}
            <SectionCard
                section={campaign.featuredOffersSection}
                isFeatured={true}
                isTargeted={isTargeted}
                onAddProduct={() =>
                    setShowAddProductModal({
                        sectionId: campaign.featuredOffersSection.id,
                        sectionName: "Featured Offers",
                        isFeatured: true,
                    })
                }
                onEditProduct={setEditingProduct}
                onRemoveProduct={(productId) =>
                    handleRemoveProduct(campaign.featuredOffersSection.id, productId, true)
                }
            />

            {/* Other Sections */}
            {campaign.sections.map((section) => (
                <SectionCard
                    key={section.id}
                    section={section}
                    isFeatured={false}
                    isTargeted={isTargeted}
                    onAddProduct={() =>
                        setShowAddProductModal({
                            sectionId: section.id,
                            sectionName: section.name,
                            isFeatured: false,
                        })
                    }
                    onEditProduct={setEditingProduct}
                    onRemoveProduct={(productId) =>
                        handleRemoveProduct(section.id, productId, false)
                    }
                    onRemoveSection={() => handleRemoveSection(section.id)}
                />
            ))}

            {/* Add Section Button */}
            <button
                onClick={() => setShowAddSectionModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:text-slate-700 transition-colors"
            >
                <Plus className="w-4 h-4" />
                Add Section
            </button>

            {/* Modals */}
            {showAddProductModal && (
                <AddProductModal
                    isOpen={true}
                    onClose={() => setShowAddProductModal(null)}
                    onAdd={handleAddProduct}
                    sectionId={showAddProductModal.sectionId}
                    sectionName={showAddProductModal.sectionName}
                    isFeatured={showAddProductModal.isFeatured}
                    existingProductIds={existingProductIds}
                />
            )}

            <AddSectionModal
                isOpen={showAddSectionModal}
                onClose={() => setShowAddSectionModal(false)}
                onAdd={handleAddSection}
            />
        </div>
    );
}
