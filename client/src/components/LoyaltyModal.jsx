import { X, Gift, Sparkles } from 'lucide-react';

const LoyaltyModal = ({ client, onClose }) => {
    if (!client) return null;

    const prizes = [
        { name: 'Bebida Gratis', points: 20 },
        { name: 'Descuento 10%', points: 50 },
        { name: 'Producto Sorpresa', points: 100 },
    ];

    const affordablePrizes = prizes.filter(p => client.points_balance >= p.points);
    const nextPrize = prizes.find(p => client.points_balance < p.points);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fade-in">
            <div className="glass-card p-0 max-w-md w-full relative overflow-hidden shadow-2xl scale-100">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 p-10 bg-pink-500/20 rounded-full blur-xl -ml-5 -mb-5"></div>

                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-inner">
                        <Sparkles className="text-yellow-300" size={32} fill="currentColor" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-1">{client.name || 'Cliente'}</h3>
                    <p className="text-indigo-200 text-sm mb-4">Estado de Fidelización</p>

                    <div className="inline-flex items-end gap-1">
                        <span className="text-5xl font-extrabold text-white tracking-tight">{client.points_balance}</span>
                        <span className="text-indigo-200 font-medium mb-1.5">pts</span>
                    </div>
                </div>

                <div className="p-8 bg-[#1e293b]">
                    {affordablePrizes.length > 0 ? (
                        <div className="mb-6">
                            <h4 className="text-sm uppercase tracking-wider text-emerald-400 font-bold mb-3 flex items-center gap-2">
                                <Gift size={16} /> ¡Puede canjear ahora!
                            </h4>
                            <ul className="space-y-2">
                                {affordablePrizes.map((prize, idx) => (
                                    <li key={idx} className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 text-sm">
                                        <span>{prize.name}</span>
                                        <span className="font-bold bg-emerald-500/20 px-2 py-0.5 rounded text-xs">{prize.points} pts</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg text-blue-200 text-xs text-center border border-blue-500/20">
                                💡 Recuérdele al cliente que puede canjear estos premios en la sección de "Canje".
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-slate-400 text-sm">Aún no tiene premios disponibles.</p>
                        </div>
                    )}

                    {nextPrize && (
                        <div className="pt-4 border-t border-white/10 text-center">
                            <p className="text-slate-400 text-sm">
                                Faltan <span className="text-white font-bold">{nextPrize.points - client.points_balance} pts</span> para <span className="text-pink-400">{nextPrize.name}</span>
                            </p>
                            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-pink-500"
                                    style={{ width: `${(client.points_balance / nextPrize.points) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full mt-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
                    >
                        Continuar con la Venta
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoyaltyModal;
