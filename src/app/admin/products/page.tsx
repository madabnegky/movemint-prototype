"use client";

import { useState } from "react";
import { useStore, Product, ProductType, ProductAttribute } from "@/context/StoreContext";
import { Plus, Pencil, Trash2, X, Package, Search, Filter } from "lucide-react";
import Image from "next/image";

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
    'auto-loan': 'Auto Loan',
    'auto-refi': 'Auto Refinance',
    'home-loan': 'Home Loan',
    'heloc': 'HELOC',
    'credit-card': 'Credit Card',
    'credit-limit-increase': 'Credit Limit Increase',
    'term-life': 'Term Life Insurance',
    'gap': 'GAP Coverage',
    'mrc': 'MRC',
    'debt-protection': 'Debt Protection',
    'personal-loan': 'Personal Loan',
    // Deposit products
    'savings': 'Savings Account',
    'checking': 'Checking Account',
    'money-market': 'Money Market Account',
    'certificate': 'Share Certificate (CD)',
    // Membership
    'membership': 'Membership'
};

const PRODUCT_TYPES: ProductType[] = [
    'auto-loan',
    'auto-refi',
    'home-loan',
    'heloc',
    'credit-card',
    'credit-limit-increase',
    'term-life',
    'gap',
    'mrc',
    'debt-protection',
    // Deposit products
    'savings',
    'checking',
    'money-market',
    'certificate',
    // Membership
    'membership'
];

interface ProductFormData {
    name: string;
    type: ProductType;
    description: string;
    imageUrl: string;
    attributes: ProductAttribute[];
    isActive: boolean;
}

const EMPTY_FORM: ProductFormData = {
    name: '',
    type: 'auto-loan',
    description: '',
    imageUrl: '',
    attributes: [],
    isActive: true
};

function ProductModal({
    isOpen,
    onClose,
    onSave,
    product,
    title
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ProductFormData) => void;
    product?: Product;
    title: string;
}) {
    const [formData, setFormData] = useState<ProductFormData>(
        product ? {
            name: product.name,
            type: product.type,
            description: product.description || '',
            imageUrl: product.imageUrl || '',
            attributes: product.attributes,
            isActive: product.isActive
        } : EMPTY_FORM
    );

    const [newAttrLabel, setNewAttrLabel] = useState('');
    const [newAttrValue, setNewAttrValue] = useState('');
    const [newAttrSubtext, setNewAttrSubtext] = useState('');

    if (!isOpen) return null;

    const handleAddAttribute = () => {
        if (newAttrLabel && newAttrValue) {
            setFormData(prev => ({
                ...prev,
                attributes: [
                    ...prev.attributes,
                    {
                        label: newAttrLabel,
                        value: newAttrValue,
                        subtext: newAttrSubtext || undefined
                    }
                ]
            }));
            setNewAttrLabel('');
            setNewAttrValue('');
            setNewAttrSubtext('');
        }
    };

    const handleRemoveAttribute = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attributes: prev.attributes.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Product Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., New Auto Loan"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Product Type *
                        </label>
                        <select
                            required
                            value={formData.type}
                            onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as ProductType }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {PRODUCT_TYPES.map(type => (
                                <option key={type} value={type}>
                                    {PRODUCT_TYPE_LABELS[type]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Brief description of the product"
                        />
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Image URL
                        </label>
                        <input
                            type="url"
                            value={formData.imageUrl}
                            onChange={e => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://..."
                        />
                        {formData.imageUrl && (
                            <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden bg-slate-100">
                                <Image
                                    src={formData.imageUrl}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        )}
                    </div>

                    {/* Attributes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Attributes (Rate, Limit, etc.)
                        </label>

                        {formData.attributes.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {formData.attributes.map((attr, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                        <span className="text-sm text-slate-600">{attr.label}</span>
                                        <span className="text-sm font-medium text-slate-900">{attr.value}</span>
                                        {attr.subtext && (
                                            <span className="text-xs text-slate-500">{attr.subtext}</span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAttribute(index)}
                                            className="ml-auto text-slate-400 hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newAttrLabel}
                                onChange={e => setNewAttrLabel(e.target.value)}
                                placeholder="Label (e.g., As low as)"
                                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                                type="text"
                                value={newAttrValue}
                                onChange={e => setNewAttrValue(e.target.value)}
                                placeholder="Value (e.g., 3.99%)"
                                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                                type="text"
                                value={newAttrSubtext}
                                onChange={e => setNewAttrSubtext(e.target.value)}
                                placeholder="Subtext (e.g., APR*)"
                                className="w-28 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddAttribute}
                                disabled={!newAttrLabel || !newAttrValue}
                                className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                formData.isActive ? 'bg-green-500' : 'bg-slate-200'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    formData.isActive ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                        <span className="text-sm text-slate-700">
                            {formData.isActive ? 'Active - can be added to campaigns' : 'Inactive - hidden from campaigns'}
                        </span>
                    </div>
                </form>

                <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        {product ? 'Save Changes' : 'Create Product'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    const { products, addProduct, updateProduct, deleteProduct } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<ProductType | 'all'>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>();
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || p.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const handleCreate = () => {
        setEditingProduct(undefined);
        setShowModal(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleSave = (data: ProductFormData) => {
        const now = new Date().toISOString().split('T')[0];

        if (editingProduct) {
            updateProduct({
                ...editingProduct,
                ...data,
                updatedAt: now
            });
        } else {
            addProduct({
                id: `product-${Date.now()}`,
                ...data,
                createdAt: now,
                updatedAt: now
            });
        }

        setShowModal(false);
        setEditingProduct(undefined);
    };

    const handleDelete = (id: string) => {
        deleteProduct(id);
        setDeleteConfirm(null);
    };

    const activeCount = products.filter(p => p.isActive).length;

    return (
        <div className="max-w-6xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Product Configuration</h1>
                    <p className="text-slate-600">
                        Define your product catalog. Products are added to campaigns and become offers based on rules.
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{products.length}</p>
                            <p className="text-sm text-slate-500">Total Products</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
                            <p className="text-sm text-slate-500">Active Products</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <Package className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{products.length - activeCount}</p>
                            <p className="text-sm text-slate-500">Inactive Products</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="relative">
                    <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value as ProductType | 'all')}
                        className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    >
                        <option value="all">All Types</option>
                        {PRODUCT_TYPES.map(type => (
                            <option key={type} value={type}>
                                {PRODUCT_TYPE_LABELS[type]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Product List */}
            {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                        {products.length === 0 ? 'No products yet' : 'No matching products'}
                    </h3>
                    <p className="text-slate-500 mb-4">
                        {products.length === 0
                            ? 'Create your first product to get started'
                            : 'Try adjusting your search or filter'}
                    </p>
                    {products.length === 0 && (
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            Add Product
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                    Product
                                </th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                    Type
                                </th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                    Attributes
                                </th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                    Status
                                </th>
                                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {product.imageUrl ? (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                                    <Image
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <Package className="w-6 h-6 text-slate-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-slate-900">{product.name}</p>
                                                {product.description && (
                                                    <p className="text-sm text-slate-500 truncate max-w-xs">
                                                        {product.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                            {PRODUCT_TYPE_LABELS[product.type]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.attributes.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {product.attributes.map((attr, i) => (
                                                    <span key={i} className="text-xs text-slate-600">
                                                        {attr.label} {attr.value}{attr.subtext ? ` ${attr.subtext}` : ''}
                                                        {i < product.attributes.length - 1 ? ',' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400">No attributes</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            product.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {product.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {deleteConfirm === product.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteConfirm(product.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            <ProductModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingProduct(undefined);
                }}
                onSave={handleSave}
                product={editingProduct}
                title={editingProduct ? 'Edit Product' : 'Create Product'}
            />
        </div>
    );
}
