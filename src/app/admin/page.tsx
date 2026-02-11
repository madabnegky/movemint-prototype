export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 flex flex-col justify-center">
                        <div className="text-3xl font-bold text-slate-900">{10 * i}</div>
                        <div className="text-sm text-slate-500">Active Offers</div>
                    </div>
                ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 h-96 flex items-center justify-center text-slate-400">
                Chart Placeholder
            </div>
        </div>
    )
}
