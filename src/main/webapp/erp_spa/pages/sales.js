function parseSaleDate(dateStr) {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
        const parts = dateStr.split(' ')[0].split('/');
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
    }
    return new Date(dateStr);
}

// Arma un texto corto con el/los método(s) de pago de una venta.
// Si no tiene pagos registrados todavía, se asume que es una venta a crédito.
function getPaymentMethodLabel(sale) {
    if (!sale.pagos || sale.pagos.length === 0) return 'Crédito';
    const metodos = [...new Set(sale.pagos.map(p => p.metodo?.nombre || 'Efectivo'))];
    return metodos.join(' + ');
}

async function renderVentas(c) {
    const sales = await api.getSales();

    if (!state.salesFilter) {
        state.salesFilter = { search: '', period: 'Todo' };
    }

    const filteredSales = sales.filter(s => {
        const cliName = (s.cliente?.nombre_RazonSocial || 'cliente mostrador').toLowerCase();
        const matchSearch = s.serie_correlativa.toLowerCase().includes(state.salesFilter.search) ||
                            cliName.includes(state.salesFilter.search) ||
                            (s.tipo_comprobante && s.tipo_comprobante.toLowerCase().includes(state.salesFilter.search));

        let matchPeriod = true;
        const now = new Date();
        const saleDate = parseSaleDate(s.fecha_emision);

        if (state.salesFilter.period === 'Este Mes') {
            matchPeriod = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        } else if (state.salesFilter.period === 'Mes Anterior') {
            let targetMonth = now.getMonth() - 1;
            let targetYear = now.getFullYear();
            if (targetMonth < 0) {
                targetMonth = 11;
                targetYear--;
            }
            matchPeriod = saleDate.getMonth() === targetMonth && saleDate.getFullYear() === targetYear;
        } else if (state.salesFilter.period === 'Este Año') {
            matchPeriod = saleDate.getFullYear() === now.getFullYear();
        }

        return matchSearch && matchPeriod;
    });

    const rows = filteredSales.sort((a, b) => b.idVenta - a.idVenta).map(s => {
        const clienteNombre = s.cliente?.nombre_RazonSocial || 'Cliente Mostrador';
        const estadoVenta = s.estado?.nombreEstado || 'Emitido';
        const metodoPago = getPaymentMethodLabel(s);
        return `
            <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0 group">
                <td class="p-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-blue-600/20 text-[#3B82F6] flex items-center justify-center font-bold">
                            <i class="bi bi-receipt"></i>
                        </div>
                        <div>
                            <span class="font-bold text-[#F8FAFC]">${s.serie_correlativa}</span>
                            <span class="block text-xs text-[#CBD5E1]">${s.tipo_comprobante || 'Boleta'}</span>
                        </div>
                    </div>
                </td>
                <td class="p-4 whitespace-nowrap text-[#CBD5E1] font-medium">
                    <i class="bi bi-calendar3 mr-2 text-slate-500"></i>${s.fecha_emision}
                </td>
                <td class="p-4">
                    <span class="font-semibold text-[#F8FAFC]">${clienteNombre}</span>
                </td>
                <td class="p-4 whitespace-nowrap text-[#CBD5E1]">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1F2937] border border-[#334155] text-xs font-medium text-[#CBD5E1]">
                        <i class="bi ${metodoPago.toLowerCase().includes('efectivo') ? 'bi-cash' : 'bi-credit-card'}"></i>
                        ${metodoPago}
                    </span>
                </td>
                <td class="p-4 whitespace-nowrap font-black text-[#F8FAFC]">
                    ${formatMoney(s.total)}
                </td>
                <td class="p-4 whitespace-nowrap">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                        ${estadoVenta === 'Anulado' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
                        <span class="w-1.5 h-1.5 rounded-full ${estadoVenta === 'Anulado' ? 'bg-red-500' : 'bg-emerald-500'}"></span>
                        ${estadoVenta}
                    </span>
                </td>
                <td class="p-4 whitespace-nowrap text-right">
                    <button class="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors tooltip-btn" title="Ver e Imprimir Comprobante" onclick="window.openSaleDetails(${s.idVenta})">
                        <i class="bi bi-printer text-lg"></i>
                    </button>
                    <button class="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-600/20 rounded-lg transition-colors tooltip-btn ml-1" title="Ver Detalles" onclick="window.openSaleDetails(${s.idVenta})">
                        <i class="bi bi-eye text-lg"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    c.innerHTML = `
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4" data-aos="fade-down">
            <div>
                <h2 class="text-2xl font-bold text-[#F8FAFC] tracking-tight">Historial de Ventas</h2>
                <p class="text-sm text-[#CBD5E1] mt-1">Registro de todos los comprobantes emitidos</p>
            </div>
            <button onclick="api.getSales().then(d => exportToCSV(d, 'ventas.csv'))" class="bg-[#1E293B] border border-[#334155] text-[#CBD5E1] hover:bg-[#334155] px-4 py-2 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm">
                <i class="bi bi-file-earmark-spreadsheet text-emerald-500"></i> Exportar CSV
            </button>
        </div>

        <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden" data-aos="fade-up">
            <div class="p-4 border-b border-[#334155] flex flex-col sm:flex-row gap-4 justify-between bg-[#111827]">
                <div class="relative max-w-md w-full">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="bi bi-search text-slate-400"></i>
                    </div>
                    <input type="text" id="s-search" class="block w-full pl-10 pr-3 py-2 border border-[#334155] bg-[#1F2937] text-[#F8FAFC] rounded-xl leading-5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-shadow" placeholder="Buscar comprobante, cliente...">
                </div>
                
                <div class="flex gap-2">
                    <select id="s-filter" class="block w-full pl-3 pr-10 py-2 text-base border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:outline-none focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm rounded-xl">
                        <option value="Todo">Todo</option>
                        <option value="Este Mes">Este Mes</option>
                        <option value="Mes Anterior">Mes Anterior</option>
                        <option value="Este Año">Este Año</option>
                    </select>
                </div>
            </div>

            <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-[#111827] border-b border-[#334155]">
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Comprobante</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Fecha</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Cliente</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Método Pago</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Total</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Estado</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#334155]">
                        ${rows || `
                            <tr>
                                <td colspan="7" class="p-12 text-center">
                                    <div class="w-16 h-16 bg-[#111827] rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                                        <i class="bi bi-inbox text-2xl"></i>
                                    </div>
                                    <h3 class="text-lg font-semibold text-[#F8FAFC]">No hay ventas registradas</h3>
                                    <p class="text-[#CBD5E1] mt-1">Las ventas que realices en el POS aparecerán aquí o coincide con los filtros.</p>
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
            
            <div class="p-4 border-t border-[#334155] bg-[#111827] flex items-center justify-between">
                <span class="text-sm text-[#CBD5E1]">Mostrando <span class="font-semibold text-[#F8FAFC]">${filteredSales.length}</span> resultados</span>
                <div class="flex gap-1">
                    <button class="px-3 py-1 rounded-lg border border-[#334155] bg-[#1E293B] text-slate-600 cursor-not-allowed" disabled>Anterior</button>
                    <button class="px-3 py-1 rounded-lg border border-[#334155] bg-[#1E293B] text-[#CBD5E1] hover:bg-[#334155]">Siguiente</button>
                </div>
            </div>
        </div>
    `;
    
    const searchInput = document.getElementById('s-search');
    if (searchInput) {
        searchInput.value = state.salesFilter.search;
        searchInput.addEventListener('input', e => {
            state.salesFilter.search = e.target.value.toLowerCase().trim();
            renderVentas(c);
        });
    }

    const filterSelect = document.getElementById('s-filter');
    if (filterSelect) {
        filterSelect.value = state.salesFilter.period;
        filterSelect.addEventListener('change', e => {
            state.salesFilter.period = e.target.value;
            renderVentas(c);
        });
    }

    setTimeout(() => {
        if(window.tippy) {
            tippy('.tooltip-btn', {
                animation: 'scale',
                theme: 'light-border',
                placement: 'top'
            });
        }
    }, 100);
}

async function openSaleDetails(saleId) {
    const sales = await api.getSales();
    const sale = sales.find(s => s.idVenta === saleId);
    if (!sale) {
        return Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Venta no encontrada',
            confirmButtonColor: '#3b82f6',
            customClass: { popup: 'rounded-2xl' }
        });
    }

    const clientName = sale.cliente?.nombre_RazonSocial || "Cliente Mostrador";
    const clientDoc = sale.cliente ? `${sale.cliente.tipoDocumento || ''}: ${sale.cliente.numeroDocumento || ''}` : "";
    const metodoPago = getPaymentMethodLabel(sale);

    showModal(`
        <div class="p-8 bg-slate-50 text-slate-800" id="print-area">
            <div class="flex justify-between items-start mb-8 border-b border-slate-200 pb-6">
                <div>
                    <h2 class="text-2xl font-black tracking-tighter text-blue-600 mb-1">DELGADO <span class="text-slate-400 font-medium text-lg">Soluciones Industriales EIRL</span></h2>
                    <p class="text-slate-500 text-sm">Av. Principal 123, Zona Industrial</p>
                    <p class="text-slate-500 text-sm">RUC: 20555555555</p>
                </div>
                <div class="text-right border-l-4 border-blue-600 pl-4">
                    <h3 class="text-lg font-bold uppercase tracking-wider">${sale.tipo_comprobante || 'Boleta'} ELECTRÓNICA</h3>
                    <p class="text-xl font-bold font-mono text-slate-700 my-1">N° ${sale.serie_correlativa}</p>
                    <p class="text-sm font-semibold text-blue-600">Emisión: ${sale.fecha_emision}</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-6 mb-8 text-sm">
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Datos del Cliente</p>
                    <p class="font-bold text-slate-800">${clientName}</p>
                    <p class="text-slate-600">${clientDoc}</p>
                </div>
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Condiciones de Pago</p>
                    <p class="font-bold text-slate-800">${metodoPago}</p>
                    ${sale.pagos && sale.pagos.length > 0 ? `<p class="text-slate-600 mt-1 text-xs">Detalle: ${sale.pagos.map(p => `${p.metodo?.nombre || 'Efectivo'} (${window.formatMoney(p.monto_total)})`).join(", ")}</p>` : ""}
                </div>
            </div>
            
            <table class="w-full text-left mb-8">
                <thead>
                    <tr class="border-b-2 border-slate-200">
                        <th class="py-2 text-slate-400 font-bold text-xs uppercase tracking-wider font-semibold">Cant.</th>
                        <th class="py-2 text-slate-400 font-bold text-xs uppercase tracking-wider font-semibold">Descripción</th>
                        <th class="py-2 text-slate-400 font-bold text-xs uppercase tracking-wider text-right font-semibold">P. Unit</th>
                        <th class="py-2 text-slate-400 font-bold text-xs uppercase tracking-wider text-right font-semibold">Dcto</th>
                        <th class="py-2 text-slate-400 font-bold text-xs uppercase tracking-wider text-right font-semibold">Total</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${(sale.detalle || []).map(item => {
                        const precioUnit = item.precio_unitario || 0;
                        const descuento = item.descuento_prod || 0;
                        const itemTotal = item.sub_total != null ? item.sub_total : (precioUnit * item.cantidad) - descuento;
                        return `
                        <tr class="text-sm">
                            <td class="py-3 font-semibold text-slate-600">${item.cantidad}</td>
                            <td class="py-3 font-bold text-slate-800">${item.producto?.nombre_descripcion || ''}</td>
                            <td class="py-3 text-right text-slate-600">${window.formatMoney(precioUnit)}</td>
                            <td class="py-3 text-right text-red-500">${descuento > 0 ? "-" + window.formatMoney(descuento) : ""}</td>
                            <td class="py-3 text-right font-bold text-slate-800">${window.formatMoney(itemTotal)}</td>
                        </tr>`;
                    }).join("")}
                </tbody>
            </table>
            
            <div class="flex justify-end pt-4 border-t-2 border-slate-200">
                <div class="text-right">
                    <h2 class="text-3xl font-black text-blue-600">TOTAL: ${window.formatMoney(sale.total)}</h2>
                </div>
            </div>
        </div>
        
        <div class="p-4 bg-white border-t border-slate-200 flex justify-between items-center rounded-b-2xl">
            <button class="px-4 py-2 rounded-xl text-slate-500 font-medium hover:bg-slate-100 transition-colors" onclick="closeModal()"><i class="bi bi-x-lg mr-2"></i>Cerrar</button>
            <div class="flex gap-2">
                <button class="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-colors shadow-md shadow-green-500/20" onclick="Swal.fire({ icon: 'success', title: 'WhatsApp', text: 'Documento enviado por WhatsApp.', confirmButtonColor: '#3b82f6', customClass: { popup: 'rounded-2xl' } })"><i class="bi bi-whatsapp mr-2"></i>WhatsApp</button>
                <button class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-md shadow-blue-600/20" onclick="window.print()"><i class="bi bi-printer mr-2"></i>Imprimir</button>
            </div>
        </div>
    `, "max-w-3xl !p-0 overflow-hidden");
}

window.renderVentas = renderVentas;
window.openSaleDetails = openSaleDetails;