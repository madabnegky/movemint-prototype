"use client"

import * as React from "react"
import { Upload, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// --- Validation Constants & Types ---
const VALIDATION_RULES = {
    productName: { min: 15, max: 28 },
    productDesc: {
        tilePreview: 50, // "pay special attention to first 30-50 chars"
    },
    featuredHeadline: { min: 15, max: 28 },
    featuredDesc: { max: 100 },
    decisionHeader: { max: 42 },
    decisionBodyHeader: { min: 15, max: 38 },
    decisionBodyText: { min: 130, max: 750 },
}

// --- UI Components ---

function Label({ children, className, required }: { children: React.ReactNode; className?: string; required?: boolean }) {
    return (
        <label className={cn("block text-sm font-medium text-slate-700 mb-1.5", className)}>
            {children}
            {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
    )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                className
            )}
            {...props}
        />
    )
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            className={cn(
                "flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                className
            )}
            {...props}
        />
    )
}

function CharacterCount({ current, min, max, recommended }: { current: number; min?: number; max?: number; recommended?: boolean }) {
    const isError = (min && current < min && current > 0) || (max && current > max);
    const isWarning = recommended && ((min && current < min) || (max && current > max));

    return (
        <div className={cn("text-xs mt-1.5 flex items-center justify-end font-medium",
            isError ? "text-rose-500" : isWarning ? "text-amber-500" : "text-slate-400"
        )}>
            <span>
                {current} {max ? `/ ${max}` : 'chars'}
            </span>
            {isError && <XCircle className="w-3 h-3 ml-1.5" />}
            {isWarning && !isError && <AlertTriangle className="w-3 h-3 ml-1.5" />}
        </div>
    )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
    return (
        <div className="mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
        </div>
    )
}

// --- Main Form Component ---

export function ProductConfigForm() {
    const [formData, setFormData] = React.useState({
        productName: "",
        productDesc: "",
        featuredHeadline: "",
        featuredDesc: "",
        decisionHeader: "",
        decisionBodyHeader: "",
        decisionBodyText: "",
    })

    // Image State
    const [images, setImages] = React.useState<{ file: File; preview: string; width: number; height: number }[]>([])
    const [dragActive, setDragActive] = React.useState(false)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Image Handling
    const handleImage = (files: FileList | null) => {
        if (!files || files.length === 0) return

        const file = files[0]
        const objectUrl = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            setImages([{ file, preview: objectUrl, width: img.width, height: img.height }]) // Only one image per specs
        }
        img.src = objectUrl
    }

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
                <h1 className="text-2xl font-bold text-slate-900">Product Configuration</h1>
                <p className="text-slate-500 mt-1">Configure your product's appearance on the store front.</p>
            </div>

            <div className="p-8 space-y-10">

                {/* Product Images Section */}
                <section>
                    <SectionHeader
                        title="Product Image"
                        description="Upload a high-quality image of the product. Best results with images between 800x500 and 1200x750 pixels."
                    />

                    <div
                        className={cn(
                            "relative group border-2 border-dashed rounded-xl p-8 transition-all text-center cursor-pointer",
                            dragActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50",
                            images.length > 0 ? "border-solid border-slate-200" : ""
                        )}
                        onDragEnter={() => setDragActive(true)}
                        onDragLeave={() => setDragActive(false)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault()
                            setDragActive(false)
                            handleImage(e.dataTransfer.files)
                        }}
                    >
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/*"
                            onChange={(e) => handleImage(e.target.files)}
                        />

                        {images.length > 0 ? (
                            <div className="relative aspect-[1200/750] w-full max-w-lg mx-auto overflow-hidden rounded-lg shadow-sm">
                                <img src={images[0].preview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs py-2 backdrop-blur-sm">
                                    Dimensions: {images[0].width}x{images[0].height}px
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 py-8">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Upload strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Click to upload or drag and drop</p>
                                    <p className="text-xs text-slate-500 mt-1">SVG, PNG, JPG or GIF (max. 1200x750px recommended)</p>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Design Hints */}
                    <div className="mt-4 bg-blue-50/50 rounded-lg p-4 border border-blue-100 flex gap-3 text-sm text-blue-800">
                        <Info className="w-5 h-5 flex-shrink-0 text-blue-600" />
                        <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
                            <li>Use a neutral background.</li>
                            <li>Center the primary focus (faces, main product).</li>
                            <li>Real people interacting with the product perform best.</li>
                        </ul>
                    </div>
                </section>

                {/* Storefront Tiles Section */}
                <section>
                    <SectionHeader
                        title="Storefront Tiles"
                    />

                    <div className="grid gap-6">
                        <div>
                            <Label required>Product Display Name</Label>
                            <Input
                                name="productName"
                                value={formData.productName}
                                onChange={handleInputChange}
                                placeholder="e.g. Premium Savings Account"
                            />
                            <div className="flex justify-between items-start">
                                <p className="text-xs text-slate-500 mt-1.5">This name will appear on all product cards.</p>
                                <CharacterCount
                                    current={formData.productName.length}
                                    min={VALIDATION_RULES.productName.min}
                                    max={VALIDATION_RULES.productName.max}
                                    recommended
                                />
                            </div>

                        </div>

                        <div>
                            <Label>Product Description</Label>
                            <div className="relative">
                                <Textarea
                                    name="productDesc"
                                    value={formData.productDesc}
                                    onChange={handleInputChange}
                                    placeholder="Describe the product..."
                                    rows={4}
                                />
                                {/* Visual marker for 50 chars - purely conceptual overlay or just a helper text */}
                            </div>
                            <div className="mt-1.5 flex justify-between items-start">
                                <p className="text-xs text-slate-500">
                                    The first <span className="font-semibold text-slate-700">30-50 characters</span> are most critical for the Offer Tile view.
                                </p>
                                <CharacterCount current={formData.productDesc.length} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Featured Offers Section */}
                <section>
                    <SectionHeader
                        title="Featured Offers"
                        description="Configuration for when this product is highlighted as a featured offer."
                    />
                    <div className="grid gap-6">
                        <div>
                            <Label>Featured Offer Headline</Label>
                            <Input
                                name="featuredHeadline"
                                value={formData.featuredHeadline}
                                onChange={handleInputChange}
                                placeholder="e.g. Limited Time Offer"
                            />
                            <CharacterCount
                                current={formData.featuredHeadline.length}
                                min={VALIDATION_RULES.featuredHeadline.min}
                                max={VALIDATION_RULES.featuredHeadline.max}
                                recommended
                            />
                        </div>
                        <div>
                            <Label>Featured Offer Description</Label>
                            <Textarea
                                name="featuredDesc"
                                value={formData.featuredDesc}
                                onChange={handleInputChange}
                                placeholder="Short description for the featured slot..."
                                rows={3}
                            />
                            <CharacterCount
                                current={formData.featuredDesc.length}
                                max={VALIDATION_RULES.featuredDesc.max}
                            />
                        </div>
                    </div>
                </section>

                {/* Decision Messaging Section */}
                <section>
                    <SectionHeader
                        title="Decision Messaging"
                        description="Content displayed during the decision/checkout phase."
                    />
                    <div className="grid gap-6">
                        <div>
                            <Label>Header</Label>
                            <Input
                                name="decisionHeader"
                                value={formData.decisionHeader}
                                onChange={handleInputChange}
                                placeholder="e.g. Ready to get started?"
                            />
                            <CharacterCount
                                current={formData.decisionHeader.length}
                                max={VALIDATION_RULES.decisionHeader.max}
                            />
                        </div>

                        <div>
                            <Label>Body Header</Label>
                            <Input
                                name="decisionBodyHeader"
                                value={formData.decisionBodyHeader}
                                onChange={handleInputChange}
                                placeholder="e.g. Here's what happens next"
                            />
                            <CharacterCount
                                current={formData.decisionBodyHeader.length}
                                min={VALIDATION_RULES.decisionBodyHeader.min}
                                max={VALIDATION_RULES.decisionBodyHeader.max}
                                recommended
                            />
                        </div>

                        <div>
                            <Label>Body Text</Label>
                            <Textarea
                                name="decisionBodyText"
                                value={formData.decisionBodyText}
                                onChange={handleInputChange}
                                placeholder="Explain various next steps..."
                                rows={6}
                            />
                            <CharacterCount
                                current={formData.decisionBodyText.length}
                                min={VALIDATION_RULES.decisionBodyText.min}
                                max={VALIDATION_RULES.decisionBodyText.max}
                                recommended
                            />
                        </div>
                    </div>
                </section>

            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors">
                    Cancel
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-colors shadow-sm">
                    Save Changes
                </button>
            </div>
        </div>
    )
}
