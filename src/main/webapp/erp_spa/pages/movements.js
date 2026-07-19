async function renderMovimientos(c) {
    const movs = await api.getRecentMovements();
    const rows = movs.sort((a, b) => b.idMovimiento - a.idMovimiento).map(m => {
        const tipo = (m.tipoMovimiento || 'SIN TIPO').toUpperCase();
        const isEntrada = tipo === 'ENTRADA';
        const isSalida = tipo === 'SALIDA';
        const badgeColor = isEntrada ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : isSalida ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
        const dotColor = isEntrada ? 'bg-emerald-500' : isSalida ? 'bg-red-500' : 'bg-amber-500';
        const sign = isEntrada ? '+' : isSalida ? '-' : '';
        const qtyColor = isEntrada ? 'text-emerald-400' : isSalida ? 'text-red-400' : 'text-amber-400';
        const fecha = m.fecha ? new Date(m.fecha).toLocaleString('es-PE') : '-';
        
        return `
            <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0">
                <td class="p-4 whitespace-nowrap text-[#CBD5E1] font-mono text-xs">${fecha}</td>
                <td class="p-4 whitespace-nowrap">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeColor}">
                        <span class="w-1.5 h-1.5 rounded-full ${dotColor}"></span>
                        ${tipo}
                    </span>
                </td>
                <td class="p-4 whitespace-nowrap text-[#F8FAFC] font-semibold">${m.nombreProducto || 'Producto eliminado'}</td>
                <td class="p-4 whitespace-nowrap font-black text-lg ${qtyColor}">${sign}${m.cantidad}</td>
                <td class="p-4 text-[#CBD5E1]">${m.referencia || '-'}</td>
            </tr>
        `;
    }).join('');

    c.innerHTML = `
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4" data-aos="fade-down">
            <div>
                <h2 class="text-2xl font-bold text-[#F8FAFC] tracking-tight">Kardex de Movimientos Global</h2>
                <p class="text-sm text-[#CBD5E1] mt-1">Bitácora central de entradas, salidas y ajustes de stock en tiempo real.</p>
            </div>
        </div>

        <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden" data-aos="fade-up">
            <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-[#111827] border-b border-[#334155]">
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Fecha y Hora</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Movimiento</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Producto</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Cant.</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Motivo / Documento Referencia</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#334155]">
                        ${rows || '<tr><td colspan="5" class="p-12 text-center text-[#CBD5E1]"><i class="bi bi-arrow-left-right text-3xl opacity-50 block mb-2"></i>No hay movimientos registrados.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

window.renderMovimientos = renderMovimientos;