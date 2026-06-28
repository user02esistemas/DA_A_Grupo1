async function renderInstallments(c) {
    const insts   = await api.getInstallments();
    const sales   = await api.getSalesCredt();
    const clients = await api.getEntities();


    const ventasCredito = sales;
    const totalPorCobrar   = ventasCredito.reduce((sumaAcumuluda, ventaActual) => sumaAcumuluda + (ventaActual.total_pendiente || 0), 0);
    const totalCanceladas  = ventasCredito.filter(ventaActual => ventaActual.estado && ventaActual.estado.nombreEstado === 'Cancelada').length;

    function badgeClasses(status) {
    const s = (status || '').toLowerCase();
    if (s === 'cancelada' || s === 'pagada') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (s === 'parcial')                     return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
    return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
}

function dotClass(status) {
    const s = (status || '').toLowerCase();
    if (s === 'cancelada' || s === 'pagada') return 'bg-emerald-500';
    if (s === 'parcial')                     return 'bg-sky-500';
    return 'bg-amber-500';
}

    // ── Filas de la tabla principal ──────────────────────────────────────────
    const rows = ventasCredito.map(ventaActual =>{
        const estadoVenta = ventaActual.estado ? ventaActual.estado.nombreEstado : 'Pendiente';
        const porcentajeProgreso = ventaActual.total > 0 
            ? Math.round(((ventaActual.total - ventaActual.total_pendiente) / ventaActual.total) * 100) 
            : 0;

        return `
            <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0 cursor-pointer"
                onclick="openCuotasModal(${ventaActual.idVenta})">
                <td class="p-4 font-semibold text-[#F8FAFC]">
                    ${ventaActual.cliente ? ventaActual.cliente.nombre_RazonSocial : 'Cliente Mostrador'}
                </td>
                <td class="p-4 font-mono text-[#CBD5E1]">${ventaActual.serie_correlativa || 'S/N'}</td>
                <td class="p-4 text-[#F8FAFC] font-medium">${formatMoney(ventaActual.total)}</td>
                <td class="p-4 font-bold ${ventaActual.total_pendiente > 0 ? 'text-red-400' : 'text-emerald-400'}">${formatMoney(ventaActual.total_pendiente)}</td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-[#111827] rounded-full overflow-hidden" style="min-width:80px">
                            <div class="h-full bg-emerald-500 rounded-full" style="width:${porcentajeProgreso}%"></div>
                        </div>
                        <span class="text-xs text-[#CBD5E1] font-mono">${porcentajeProgreso}%</span>
                    </div>
                </td>
                <td class="p-4 whitespace-nowrap">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeClasses(estadoVenta)}">
                        <span class="w-1.5 h-1.5 rounded-full ${dotClass(estadoVenta)}"></span>
                        ${estadoVenta}
                    </span>
                </td>
                <td class="p-4 text-[#CBD5E1] text-right">
                    <i class="bi bi-chevron-right text-sm"></i>
                </td>
            </tr>
        `;
    }).join('');

    // ── HTML principal ───────────────────────────────────────────────────────
    c.innerHTML = `
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4" data-aos="fade-down">
            <div>
                <h2 class="text-2xl font-bold text-[#F8FAFC] tracking-tight">Gestión de Cuotas y Pagos</h2>
                <p class="text-sm text-[#CBD5E1] mt-1">Control de cuentas por cobrar. Haz clic en una fila para ver el cronograma y registrar abonos.</p>
            </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" data-aos="fade-up">
            <div class="bg-[#1E293B] rounded-2xl border border-[#334155] p-5">
                <p class="text-xs text-[#CBD5E1] uppercase tracking-wider mb-1">Ventas a crédito</p>
                <p class="text-3xl font-black text-[#F8FAFC]">${ventasCredito.length}</p>
            </div>
            <div class="bg-[#1E293B] rounded-2xl border border-[#334155] p-5">
                <p class="text-xs text-[#CBD5E1] uppercase tracking-wider mb-1">Total por cobrar</p>
                <p class="text-3xl font-black text-red-400">${formatMoney(totalPorCobrar)}</p>
            </div>
            <div class="bg-[#1E293B] rounded-2xl border border-[#334155] p-5">
                <p class="text-xs text-[#CBD5E1] uppercase tracking-wider mb-1">Ventas canceladas</p>
                <p class="text-3xl font-black text-emerald-400">${totalCanceladas}</p>
            </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 mb-4" data-aos="fade-up">
            <input type="text" id="inst-search"
                class="bg-[#1E293B] border border-[#334155] rounded-xl text-[#F8FAFC] placeholder-[#CBD5E1]/50 px-4 py-2 text-sm focus:outline-none focus:border-blue-500 flex-1"
                placeholder="Buscar cliente o comprobante…">
            <select id="inst-filter"
                class="bg-[#1E293B] border border-[#334155] rounded-xl text-[#CBD5E1] px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value="Todos">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Parcial">Parcial</option>
                <option value="Cancelada">Cancelada</option>
            </select>
        </div>

        <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden" data-aos="fade-up">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-[#111827] border-b border-[#334155]">
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Cliente</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Comprobante</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Total deuda</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Saldo pendiente</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Progreso</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Estado</th>
                            <th class="p-4"></th>
                        </tr>
                    </thead>
                    <tbody id="inst-tbody" class="divide-y divide-[#334155]">
                        ${rows || `<tr><td colspan="7" class="p-12 text-center text-[#CBD5E1]">No hay ventas a crédito registradas.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // ── Filtros en tiempo real ───────────────────────────────────────────────
    function filtrar() {
        const search = document.getElementById('inst-search').value.toLowerCase();
        const estado = document.getElementById('inst-filter').value;

        const filtered = ventasCredito.filter(ventaActual => {
            const nombreClient = ventaActual.cliente ? ventaActual.cliente.nombre_RazonSocial.toLowerCase() : '';
            const correlativo = (ventaActual.serie_correlativa || '').toLowerCase();
            const estadoActual = ventaActual.estado ? ventaActual.estado.nombreEstado : 'Pendiente';
            
            const matchSearch = nombreClient.includes(search) || correlativo.includes(search);
            // CORREGIDO: Usando la variable local correcta 'estadoActual'
            const matchEstado = estado === 'Todos' || estadoActual === estado; 
            return matchSearch && matchEstado;
        });

        // CORREGIDO: Limpieza completa de variables antiguas 'v' en el map del filtro
        document.getElementById('inst-tbody').innerHTML = filtered.length > 0
            ? filtered.map(ventaActual => {
                const estadoVenta = ventaActual.estado ? ventaActual.estado.nombreEstado : 'Pendiente';
                const pct = ventaActual.total > 0 
                    ? Math.round(((ventaActual.total - ventaActual.total_pendiente) / ventaActual.total) * 100) 
                    : 0;
                return `
                    <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0 cursor-pointer"
                        onclick="openCuotasModal(${ventaActual.idVenta})">
                        <td class="p-4 font-semibold text-[#F8FAFC]">${ventaActual.cliente ? ventaActual.cliente.nombre_RazonSocial : 'Cliente Mostrador'}</td>
                        <td class="p-4 font-mono text-[#CBD5E1]">${ventaActual.serie_correlativa || 'S/N'}</td>
                        <td class="p-4 text-[#F8FAFC] font-medium">${formatMoney(ventaActual.total)}</td>
                        <td class="p-4 font-bold ${ventaActual.total_pendiente > 0 ? 'text-red-400' : 'text-emerald-400'}">${formatMoney(ventaActual.total_pendiente)}</td>
                        <td class="p-4">
                            <div class="flex items-center gap-2">
                                <div class="flex-1 h-1.5 bg-[#111827] rounded-full overflow-hidden" style="min-width:80px">
                                    <div class="h-full bg-emerald-500 rounded-full" style="width:${pct}%"></div>
                                </div>
                                <span class="text-xs text-[#CBD5E1] font-mono">${pct}%</span>
                            </div>
                        </td>
                        <td class="p-4 whitespace-nowrap">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeClasses(estadoVenta)}">
                                <span class="w-1.5 h-1.5 rounded-full ${dotClass(estadoVenta)}"></span>
                                ${estadoVenta}
                            </span>
                        </td>
                        <td class="p-4 text-[#CBD5E1] text-right">
                            <i class="bi bi-chevron-right text-sm"></i>
                        </td>
                    </tr>`;
            }).join('')
            : `<tr><td colspan="7" class="p-12 text-center text-[#CBD5E1]"><i class="bi bi-search text-3xl opacity-50 block mb-2"></i>No hay resultados.</td></tr>`;
    }

    document.getElementById('inst-search').addEventListener('input', filtrar);
    document.getElementById('inst-filter').addEventListener('change', filtrar);

    // ── Modal de cuotas ──────────────────────────────────────────────────────
    window.openCuotasModal = async (idVenta) => {
        const v = ventasCredito.find(x => x.idVenta === idVenta);
        if (!v) return;
        const montoPagado    = v.total - v.total_pendiente;
        const montoPendiente = v.total_pendiente;
        try {
            const response = await fetch(`VentaController?action=listaCronograma&idVenta=${idVenta}`);
            const cuotas = await response.json();

            const metodos = await api.getPaymentMethods();
            const metodosOptions = metodos.map(m => 
                `<option value="${m.idMetodoPago}">${m.nombre}</option>`
            ).join('');

            const cuotasRows = cuotas.map((cu, idx) => {
                const estadoCuota = cu.estado ? cu.estado.nombreEstado : 'Pendiente';
                return `
                <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0">
                    <td class="p-3 font-semibold text-[#F8FAFC]">Cuota ${cu.numeroCuota || (idx + 1)}</td>
                    <td class="p-3 text-[#CBD5E1] font-mono">${cu.fechaVencimiento || '-'}</td>
                    <td class="p-3 text-[#F8FAFC] font-medium">${formatMoney(cu.monto)}</td>
                    <td class="p-3 text-emerald-400 font-bold">+${formatMoney(cu.montoPagado || 0)}</td>
                    <td class="p-3 font-bold ${cu.montoPendiente > 0 ? 'text-red-400' : 'text-emerald-400'}">${formatMoney(cu.montoPendiente || 0)}</td>
                    <td class="p-3 whitespace-nowrap">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeClasses(estadoCuota)}">
                            <span class="w-1.5 h-1.5 rounded-full ${dotClass(estadoCuota)}"></span>
                            ${estadoCuota}
                        </span>
                    </td>
                </tr>`;
            }).join('');

            const porcentajeProgreso = v.total > 0 
                ? Math.round(((v.total - v.total_pendiente) / v.total) * 100) 
                : 0;

            showModal(`
                <div class="p-6 text-slate-800">
                    <div class="flex justify-between items-start mb-5">
                        <div>
                            <h3 class="text-xl font-bold text-slate-900">${v.cliente ? v.cliente.nombre_RazonSocial : 'Cliente Mostrador'}</h3>
                            <p class="text-sm text-slate-500 mt-0.5">Comprobante: <span class="font-mono font-semibold text-slate-700">${v.serie_correlativa || 'S/N'}</span></p>
                        </div>
                        <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
                    </div>

                    <div class="grid grid-cols-3 gap-3 mb-5">
                        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                            <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Total deuda</p>
                            <p class="text-lg font-black text-slate-800">${formatMoney(v.total)}</p>
                        </div>
                        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                            <p class="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">Pagado</p>
                            <p class="text-lg font-black text-emerald-700">${formatMoney(montoPagado)}</p>
                        </div>
                        <div class="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                            <p class="text-[10px] uppercase font-bold text-red-500 tracking-wider mb-1">Saldo pendiente</p>
                            <p class="text-lg font-black text-red-600">${formatMoney(montoPendiente)}</p>
                        </div>
                    </div>

                    <div class="mb-5">
                        <div class="flex justify-between text-xs text-slate-500 mb-1.5">
                            <span>Progreso de pago</span>
                            <span class="font-semibold">${porcentajeProgreso}%</span>
                        </div>
                        <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full bg-emerald-500 rounded-full transition-all" style="width:${porcentajeProgreso}%"></div>
                        </div>
                    </div>

                    <div class="overflow-x-auto rounded-xl border border-slate-200 mb-5">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="bg-slate-50 border-b border-slate-200">
                                    <th class="p-3 font-bold text-slate-500 uppercase tracking-wider">Cuota</th>
                                    <th class="p-3 font-bold text-slate-500 uppercase tracking-wider">Vencimiento</th>
                                    <th class="p-3 font-bold text-slate-500 uppercase tracking-wider">Monto</th>
                                    <th class="p-3 font-bold text-slate-500 uppercase tracking-wider">Pagado</th>
                                    <th class="p-3 font-bold text-slate-500 uppercase tracking-wider">Saldo</th>
                                    <th class="p-3 font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">${cuotasRows}</tbody>
                        </table>
                    </div>

                    ${v.total_pendiente > 0 ? `
                        <div class="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                            <h4 class="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                <i class="bi bi-wallet2 text-blue-500"></i> Registrar abono
                            </h4>
                            <div class="flex gap-3 mb-3">
                                <div class="flex-1">
                                    <label class="block text-xs font-semibold text-blue-800 mb-1">Monto a abonar (S/)</label>
                                    <input type="number" id="abono-amount"
                                        class="w-full rounded-xl border border-blue-200 bg-white py-2.5 px-3 text-xl font-black text-blue-600 text-center"
                                        value="${v.total_pendiente.toFixed(2)}" step="0.01" max="${v.total_pendiente}" min="0.01">
                                </div>
                                <div class="flex-1">
                                    <label class="block text-xs font-semibold text-blue-800 mb-1">Método de pago</label>
                                    <select id="abono-metodo"
                                        class="w-full rounded-xl border border-blue-200 bg-white py-2.5 px-3 text-sm h-[46px]">
                                        ${metodosOptions}
                                    </select>
                                </div>
                            </div>
                            <button
                                class="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                onclick="confirmAbono(${v.idVenta})">
                                <i class="bi bi-check-circle"></i> Procesar abono
                            </button>
                        </div>` : ''}
                    
                </div>
            `, 'max-w-2xl');
        } catch (err) {
            console.error("Error al abrir el modal:", err);
        }
    };
window.confirmAbono = async (idVenta) => {
    const monto = parseFloat(document.getElementById('abono-amount').value);
    const metodoId = parseInt(document.getElementById('abono-metodo').value);
    if (!monto || monto <= 0) {
        alert('Ingresa un monto válido.');
        return;
    }

    try {
        const response = await fetch(`VentaController?action=procesarAbono`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                monto_total: monto,
                venta: { idVenta: idVenta },
                metodo:  { idMetodoPago: metodoId } 
            })
        });

        const result = await response.json();

        if (result.success) {
            closeModal();
            await Swal.fire({
                icon: 'success',
                title: 'Abono procesado',
                text: result.message,
                confirmButtonColor: '#3b82f6'
            });
            navigate('installments'); 
        } else {
            Swal.fire('Error', result.error, 'error');
        }

    } catch (err) {
        console.error('Error al procesar abono:', err);
        alert('Error de conexión al servidor.');
    }
};

}