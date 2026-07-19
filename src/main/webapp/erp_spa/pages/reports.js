async function renderReports(c) {
    const sales = await api.getSales();
    const purchases = await api.getPurchases();
    const products = await api.getProducts();
    const entities = await api.getEntities();
    const installments = await api.getInstallments ? await api.getInstallments() : [];
    
    state.selectedReportId = state.selectedReportId || null;
    state.reportSearchQuery = state.reportSearchQuery || '';
    state.reportsFilter = state.reportsFilter || {
        dateStart: '',
        dateEnd: '',
        client: '',
        seller: '',
        docType: 'Todos',
        supplier: '',
        category: 'Todos',
        product: '',
        stockBajo: false
    };

    const REPORTS_METADATA = [
        { id: 'ventas', title: 'Ventas', desc: 'Análisis completo de ingresos y comprobantes', icon: 'bi-graph-up-arrow', color: 'text-blue-500 bg-blue-500/10', count: `${sales.filter(s=>s.status!=='Anulado').length} ventas` },
        { id: 'compras', title: 'Compras', desc: 'Control de adquisiciones y proveedores', icon: 'bi-cart-check-fill', color: 'text-emerald-500 bg-emerald-500/10', count: `${purchases.length} compras` },
        { id: 'clientes', title: 'Clientes', desc: 'Historial comercial y proformas', icon: 'bi-people-fill', color: 'text-indigo-500 bg-indigo-500/10', count: `${entities.filter(e=>e.type==='CLIENTE').length} clientes` },
        { id: 'stock', title: 'Stock', desc: 'Control y valorización de inventario', icon: 'bi-box-seam-fill', color: 'text-amber-500 bg-amber-500/10', count: `${products.length} productos` }
    ];

    window.selectReport = (id) => {
        state.selectedReportId = id;
        state.reportsFilter = {
            dateStart: '',
            dateEnd: '',
            client: '',
            seller: '',
            docType: 'Todos',
            supplier: '',
            category: 'Todos',
            product: '',
            stockBajo: false
        };
        renderReports(c);
    };

    window.backToReports = () => {
        state.selectedReportId = null;
        renderReports(c);
    };

    window.updateReportFilter = (key, val) => {
        state.reportsFilter[key] = val;
        renderReports(c);
    };

    window.exportReport = (format) => {
        if (format === 'pdf' || format === 'print') {
            window.print();
            return;
        }
        const table = document.querySelector('.table-responsive table');
        if (!table) {
            Swal.fire({ icon: 'warning', title: 'Sin Datos', text: 'No hay una tabla de datos activa para exportar.' });
            return;
        }
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
        const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
            return Array.from(tr.querySelectorAll('td')).map(td => {
                return `"${td.textContent.trim().replace(/"/g, '""').replace(/\n/g, ' ')}"`;
            });
        });
        if (rows.length === 0 || (rows.length === 1 && rows[0].length <= 1)) {
            Swal.fire({ icon: 'warning', title: 'Tabla Vacía', text: 'No hay filas en la tabla para exportar.' });
            return;
        }
        const csvContent = "\uFEFF" + [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${state.selectedReportId || 'reporte'}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // RENDER LANDING PAGE
    if (state.selectedReportId === null) {
        const filteredReports = REPORTS_METADATA.filter(r => 
            r.title.toLowerCase().includes(state.reportSearchQuery.toLowerCase()) || 
            r.desc.toLowerCase().includes(state.reportSearchQuery.toLowerCase())
        );

        const cardsHtml = filteredReports.map(r => `
            <div onclick="window.selectReport('${r.id}')" 
                 class="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group">
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${r.color} shadow-inner transition-transform group-hover:scale-110">
                            <i class="bi ${r.icon}"></i>
                        </div>
                        <span class="text-[10px] font-bold text-[#CBD5E1] bg-[#111827] px-2.5 py-1 rounded-full uppercase tracking-wide border border-[#334155]">
                            ${r.count}
                        </span>
                    </div>
                    <h4 class="font-bold text-[#F8FAFC] text-base group-hover:text-[#3B82F6] transition-colors leading-tight mb-2">${r.title}</h4>
                    <p class="text-xs text-[#CBD5E1] leading-relaxed">${r.desc}</p>
                </div>
                <div class="mt-6 flex justify-end">
                    <span class="w-8 h-8 rounded-full bg-[#111827] border border-[#334155] group-hover:bg-[#3B82F6] group-hover:text-white group-hover:border-[#3B82F6] flex items-center justify-center text-[#CBD5E1] transition-all">
                        <i class="bi bi-arrow-right"></i>
                    </span>
                </div>
            </div>
        `).join('');

        c.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4" data-aos="fade-down">
                <div>
                    <h2 class="text-2xl font-bold text-[#F8FAFC] tracking-tight">Centro de Reportes</h2>
                    <p class="text-sm text-[#CBD5E1] mt-1">Análisis operativo de ventas, compras, clientes e inventario</p>
                </div>
                <div class="relative w-full sm:max-w-xs shrink-0">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="bi bi-search text-slate-400"></i>
                    </div>
                    <input type="text" id="report-search-input" value="${state.reportSearchQuery}"
                           class="w-full pl-10 pr-4 py-2 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm" 
                           placeholder="Buscar reporte...">
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6" data-aos="fade-up">
                ${cardsHtml || '<div class="col-span-full text-center text-slate-500 p-12">No se encontraron reportes con ese criterio.</div>'}
            </div>
        `;

        const sInput = document.getElementById('report-search-input');
        if (sInput) {
            sInput.focus();
            sInput.setSelectionRange(sInput.value.length, sInput.value.length);
            sInput.addEventListener('input', e => {
                state.reportSearchQuery = e.target.value;
                window.renderReports(c);
            });
        }
        return;
    }

    // DETAILS SUB-REPORT
    let subHtml = '';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonthStr = todayStr.slice(0, 7);

    // 1. VENTAS
    if (state.selectedReportId === 'ventas') {
        const totalVendido = sales.filter(s => s.status !== 'Anulado').reduce((sum, s) => sum + s.total, 0);
        const cantVentas = sales.filter(s => s.status !== 'Anulado').length;
        const ventasHoy = sales.filter(s => s.date.startsWith(todayStr) && s.status !== 'Anulado').reduce((sum, s) => sum + s.total, 0);
        const ventasMes = sales.filter(s => s.date.startsWith(currentMonthStr) && s.status !== 'Anulado').reduce((sum, s) => sum + s.total, 0);

        const filteredSales = sales.filter(s => {
            if (state.reportsFilter.dateStart && s.date.split(' ')[0] < state.reportsFilter.dateStart) return false;
            if (state.reportsFilter.dateEnd && s.date.split(' ')[0] > state.reportsFilter.dateEnd) return false;
            if (state.reportsFilter.client && s.clientId !== parseInt(state.reportsFilter.client)) return false;
            if (state.reportsFilter.seller && (s.seller || 'admin') !== state.reportsFilter.seller) return false;
            if (state.reportsFilter.docType !== 'Todos' && s.docType !== state.reportsFilter.docType) return false;
            return true;
        });

        const totalRango = filteredSales.filter(s => s.status !== 'Anulado').reduce((sum, s) => sum + s.total, 0);

        const clientOptions = entities.filter(e => e.type === 'CLIENTE').map(e => `<option value="${e.id}" ${parseInt(state.reportsFilter.client) === e.id ? 'selected' : ''}>${e.name}</option>`).join('');
        const sellersList = [...new Set(sales.map(s => s.seller || 'admin'))];
        const sellerOptions = sellersList.map(sel => `<option value="${sel}" ${state.reportsFilter.seller === sel ? 'selected' : ''}>${sel}</option>`).join('');

        subHtml = `
            <div class="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
                <div class="bg-[#111827] rounded-xl p-4 border border-[#334155]">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Vendido</span>
                    <h3 class="text-lg font-black text-emerald-400">${formatMoney(totalVendido)}</h3>
                </div>
                <div class="bg-[#111827] rounded-xl p-4 border border-[#334155]">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cantidad Ventas</span>
                    <h3 class="text-lg font-black text-blue-400">${cantVentas}</h3>
                </div>
                <div class="bg-[#111827] rounded-xl p-4 border border-[#334155]">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ventas Hoy</span>
                    <h3 class="text-lg font-black text-[#F8FAFC]">${formatMoney(ventasHoy)}</h3>
                </div>
                <div class="bg-[#111827] rounded-xl p-4 border border-[#334155]">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ventas del Mes</span>
                    <h3 class="text-lg font-black text-[#F8FAFC]">${formatMoney(ventasMes)}</h3>
                </div>
                <div class="bg-[#111827] rounded-xl p-4 border border-[#334155] border-blue-500/30 bg-blue-500/5">
                    <span class="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Total Rango</span>
                    <h3 class="text-lg font-black text-[#3B82F6]">${formatMoney(totalRango)}</h3>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6 p-4 rounded-xl bg-[#111827] border border-[#334155]">
                <div class="form-group mb-0">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha Inicio</label>
                    <input type="date" class="form-control text-xs py-1.5 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] w-full" value="${state.reportsFilter.dateStart}" onchange="window.updateReportFilter('dateStart', this.value)">
                </div>
                <div class="form-group mb-0">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha Fin</label>
                    <input type="date" class="form-control text-xs py-1.5 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] w-full" value="${state.reportsFilter.dateEnd}" onchange="window.updateReportFilter('dateEnd', this.value)">
                </div>
                <div class="form-group mb-0">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cliente</label>
                    <select class="form-control text-xs py-1.5 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] w-full" onchange="window.updateReportFilter('client', this.value)">
                        <option value="">Todos los Clientes</option>
                        ${clientOptions}
                    </select>
                </div>
                <div class="form-group mb-0">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vendedor</label>
                    <select class="form-control text-xs py-1.5 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] w-full" onchange="window.updateReportFilter('seller', this.value)">
                        <option value="">Todos los Vendedores</option>
                        ${sellerOptions}
                    </select>
                </div>
                <div class="form-group mb-0">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Comprobante</label>
                    <select class="form-control text-xs py-1.5 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] w-full" onchange="window.updateReportFilter('docType', this.value)">
                        <option value="Todos" ${state.reportsFilter.docType === 'Todos' ? 'selected':''}>Todos</option>
                        <option value="Boleta" ${state.reportsFilter.docType === 'Boleta' ? 'selected':''}>Boleta</option>
                        <option value="Factura" ${state.reportsFilter.docType === 'Factura' ? 'selected':''}>Factura</option>
                    </select>
                </div>
            </div>

            <div class="table-responsive overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="bg-[#111827] border-b border-[#334155]">
                            <th class="p-3 font-semibold text-[#CBD5E1]">Fecha</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Comprobante</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Correlativo</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Cliente</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Total</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Estado</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#334155]">
                        ${filteredSales.map(s => {
                            const cName = entities.find(e => e.id === s.clientId)?.name || 'Cliente Mostrador';
                            return `
                                <tr class="hover:bg-[#111827]/40 transition-colors">
                                    <td class="p-3 text-[#F8FAFC]">${s.date}</td>
                                    <td class="p-3 text-[#CBD5E1]">${s.docType}</td>
                                    <td class="p-3 font-mono text-[#CBD5E1]">${s.correlative}</td>
                                    <td class="p-3 text-[#CBD5E1]">${cName}</td>
                                    <td class="p-3 font-bold text-[#F8FAFC]">${formatMoney(s.total)}</td>
                                    <td class="p-3">
                                        <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'Anulado' ? 'bg-red-500/20 text-red-400 border border-red-500/30':'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">${s.status}</span>
                                    </td>
                                </tr>
                            `;
                        }).join('') || '<tr><td colspan="6" class="p-4 text-center text-slate-500">No se encontraron ventas para este filtro.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    // 2. COMPRAS
    else if (state.selectedReportId === 'compras') {
        const totalComprado = purchases.reduce((sum, p) => sum + p.total, 0);
        const cantCompras = purchases.length;

        const filteredPurchases = purchases.filter(p => {
            if (state.reportsFilter.dateStart && p.date < state.reportsFilter.dateStart) return false;
            if (state.reportsFilter.dateEnd && p.date > state.reportsFilter.dateEnd) return false;
            if (state.reportsFilter.supplier && p.providerId !== parseInt(state.reportsFilter.supplier)) return false;
            if (state.reportsFilter.seller && (p.responsible || 'admin') !== state.reportsFilter.seller) return false;
            return true;
        });

        const totalRango = filteredPurchases.reduce((sum, p) => sum + p.total, 0);

        const supplierOptions = entities.filter(e => e.type === 'PROVEEDOR').map(e => `<option value="${e.id}" ${parseInt(state.reportsFilter.supplier) === e.id ? 'selected' : ''}>${e.name}</option>`).join('');
        const buyersList = [...new Set(purchases.map(p => p.responsible || 'admin'))];
        const buyerOptions = buyersList.map(buy => `<option value="${buy}" ${state.reportsFilter.seller === buy ? 'selected' : ''}>${buy}</option>`).join('');

        subHtml = `
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div class="bg-[#111827] rounded-xl p-4 border border-[#334155]">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Comprado</span>
                    <h3 class="text-lg font-black text-emerald-400">${formatMoney(totalComprado)}</h3>
                </div>
                <div class="bg-[#111827] rounded-xl p-4 border border-[#334155]">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cantidad Compras</span>
                    <h3 class="text-lg font-black text-blue-400">${cantCompras}</h3>
                </div>
                <div class="bg-[#111827] rounded-xl p-4 border border-[#334155] border-blue-500/30 bg-blue-500/5 col-span-2">
                    <span class="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Total Rango Filtrado</span>
                    <h3 class="text-lg font-black text-[#3B82F6]">${formatMoney(totalRango)}</h3>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 p-4 rounded-xl bg-[#111827] border border-[#334155]">
                <div class="form-group mb-0">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha Inicio</label>
                    <input type="date" class="form-control text-xs py-1.5 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] w-full" value="${state.reportsFilter.dateStart}" onchange="window.updateReportFilter('dateStart', this.value)">
                </div>
                <div class="form-group mb-0">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha Fin</label>
                    <input type="date" class="form-control text-xs py-1.5 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] w-full" value="${state.reportsFilter.dateEnd}" onchange="window.updateReportFilter('dateEnd', this.value)">
                </div>
                <div class="form-group mb-0">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Proveedor</label>
                    <select class="form-control text-xs py-1.5 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] w-full" onchange="window.updateReportFilter('supplier', this.value)">
                        <option value="">Todos los Proveedores</option>
                        ${supplierOptions}
                    </select>
                </div>
                <div class="form-group mb-0">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Responsable</label>
                    <select class="form-control text-xs py-1.5 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] w-full" onchange="window.updateReportFilter('seller', this.value)">
                        <option value="">Todos los Usuarios</option>
                        ${buyerOptions}
                    </select>
                </div>
            </div>

            <div class="table-responsive overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="bg-[#111827] border-b border-[#334155]">
                            <th class="p-3 font-semibold text-[#CBD5E1]">Fecha</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">N° Factura</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Proveedor</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Total</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Responsable</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#334155]">
                        ${filteredPurchases.map(p => {
                            const pName = entities.find(e => e.id === p.providerId)?.name || 'Proveedor Desconocido';
                            return `
                                <tr class="hover:bg-[#111827]/40 transition-colors">
                                    <td class="p-3 text-[#F8FAFC]">${p.date}</td>
                                    <td class="p-3 font-mono text-[#CBD5E1]">${p.nroFactura}</td>
                                    <td class="p-3 text-[#CBD5E1]">${pName}</td>
                                    <td class="p-3 font-bold text-[#F8FAFC]">${formatMoney(p.total)}</td>
                                    <td class="p-3 text-[#CBD5E1]">${p.responsible || 'admin'}</td>
                                </tr>
                            `;
                        }).join('') || '<tr><td colspan="5" class="p-4 text-center text-slate-500">No se encontraron compras para este filtro.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    // 3. CLIENTES
    else if (state.selectedReportId === 'clientes') {
        const clientList = entities.filter(e => e.type === 'CLIENTE');
        const query = state.reportSearchQuery.toLowerCase().trim();
        const filteredClients = clientList.filter(c => {
            return c.document.toLowerCase().includes(query) || 
                   c.name.toLowerCase().includes(query) ||
                   (c.phone && c.phone.toLowerCase().includes(query)) ||
                   (c.email && c.email.toLowerCase().includes(query));
        });

        subHtml = `
            <div class="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <span class="text-xs text-[#CBD5E1]">Fichas y consultas de compras de clientes registrados.</span>
                <div class="relative w-full sm:max-w-xs shrink-0">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="bi bi-search text-slate-400"></i>
                    </div>
                    <input type="text" id="client-table-search" value="${state.reportSearchQuery}"
                           class="w-full pl-10 pr-4 py-2 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-xs" 
                           placeholder="Buscar por DNI/RUC/Nombre...">
                </div>
            </div>

            <div class="table-responsive overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="bg-[#111827] border-b border-[#334155]">
                            <th class="p-3 font-semibold text-[#CBD5E1]">DNI/RUC</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Nombre / Razón Social</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Teléfono</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Correo</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Estado</th>
                            <th class="p-3 font-semibold text-[#CBD5E1] text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#334155]">
                        ${filteredClients.map(cl => `
                            <tr onclick="window.openClientDetailModal(${cl.id})" class="cursor-pointer hover:bg-[#334155]/20 transition-colors">
                                <td class="p-3 font-mono text-[#F8FAFC]">${cl.document}</td>
                                <td class="p-3 font-bold text-[#F8FAFC]">${cl.name}</td>
                                <td class="p-3 text-[#CBD5E1]">${cl.phone || '-'}</td>
                                <td class="p-3 text-[#CBD5E1]">${cl.email || '-'}</td>
                                <td class="p-3">
                                    <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${cl.status === 'Activo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30':'bg-slate-500/20 text-slate-400 border border-slate-500/30'}">${cl.status}</span>
                                </td>
                                <td class="p-3 text-right">
                                    <button class="bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded-lg border border-blue-600/20 font-bold transition-all text-[11px]" onclick="event.stopPropagation(); window.openClientDetailModal(${cl.id})">
                                        <i class="bi bi-folder2-open"></i> Ficha
                                    </button>
                                </td>
                            </tr>
                        `).join('') || '<tr><td colspan="6" class="p-4 text-center text-slate-500">No se encontraron clientes.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        setTimeout(() => {
            const tableSearch = document.getElementById('client-table-search');
            if (tableSearch) {
                tableSearch.focus();
                tableSearch.setSelectionRange(tableSearch.value.length, tableSearch.value.length);
                tableSearch.addEventListener('input', e => {
                    state.reportSearchQuery = e.target.value;
                    window.renderReports(c);
                });
            }
        }, 50);
    }

    // 4. STOCK
    else if (state.selectedReportId === 'stock') {
        const totalItems = products.length;
        const totalPhysicalStock = products.reduce((sum, p) => sum + p.stock, 0);
        const criticalItemsCount = products.filter(p => p.stock <= p.stock_minimo).length;
        const totalValuation = products.reduce((sum, p) => sum + (p.stock * p.precio_venta), 0);

        const filteredProducts = products.filter(p => {
            if (state.reportsFilter.category && state.reportsFilter.category !== 'Todos' && p.categoria?.nombreCategoria !== state.reportsFilter.category) return false;
            if (state.reportsFilter.product && !(p.nombre_descripcion.toLowerCase().includes(state.reportsFilter.product.toLowerCase()) || String(p.codigo_unico || p.codigo_barras || p.id_producto).toLowerCase().includes(state.reportsFilter.product.toLowerCase()))) return false;
            if (state.reportsFilter.stockBajo && p.stock > p.stock_minimo) return false;
            return true;
        });

        const categoryOptions = [...new Set(products.map(p => p.categoria?.nombreCategoria).filter(Boolean))]
            .map(cat => `<option value="${cat}" ${state.reportsFilter.category === cat ? 'selected' : ''}>${cat}</option>`).join('');

        subHtml = `
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div class="bg-[#111827] rounded-xl p-4 border border-[#334155]">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Productos Registrados</span>
                    <h3 class="text-lg font-black text-blue-400">${totalItems} items</h3>
                </div>
                <div class="bg-[#111827] rounded-xl p-4 border border-[#334155]">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Stock Físico Total</span>
                    <h3 class="text-lg font-black text-[#F8FAFC]">${totalPhysicalStock} unidades</h3>
                </div>
                <div class="bg-[#111827] rounded-xl p-4 border border-[#334155] ${criticalItemsCount > 0 ? 'border-red-500/30 bg-red-500/5' : ''}">
                    <span class="text-[10px] font-bold ${criticalItemsCount > 0 ? 'text-red-400':'text-slate-400'} uppercase tracking-wider block mb-1">Productos Críticos</span>
                    <h3 class="text-lg font-black ${criticalItemsCount > 0 ? 'text-red-500':'text-[#F8FAFC]'}">${criticalItemsCount} alertas</h3>
                </div>
                <div class="bg-[#111827] rounded-xl p-4 border border-[#334155]">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Valorización Almacén</span>
                    <h3 class="text-lg font-black text-emerald-400">${formatMoney(totalValuation)}</h3>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-[#111827] border border-[#334155] items-center">
                <div class="form-group mb-0">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Categoría</label>
                    <select class="form-control text-xs py-1.5 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] w-full" onchange="window.updateReportFilter('category', this.value)">
                        <option value="Todos" ${state.reportsFilter.category === 'Todos' ? 'selected':''}>Todas las Categorías</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div class="form-group mb-0">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Buscar Producto</label>
                    <input type="text" class="form-control text-xs py-1.5 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] w-full" placeholder="Código o nombre..." value="${state.reportsFilter.product}" oninput="window.updateReportFilter('product', this.value)">
                </div>
                <div class="flex items-center gap-2 mt-4 sm:mt-0">
                    <input type="checkbox" id="chk-stock-bajo" class="rounded border-[#334155] bg-[#1F2937] text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer" ${state.reportsFilter.stockBajo ? 'checked' : ''} onchange="window.updateReportFilter('stockBajo', this.checked)">
                    <label for="chk-stock-bajo" class="text-xs font-semibold text-slate-300 cursor-pointer select-none">Solo Stock Bajo/Crítico</label>
                </div>
            </div>

            <div class="table-responsive overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="bg-[#111827] border-b border-[#334155]">
                            <th class="p-3 font-semibold text-[#CBD5E1]">Código</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Producto</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Categoría</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Stock Actual</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Stock Mínimo</th>
                            <th class="p-3 font-semibold text-[#CBD5E1]">Estado</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#334155]">
                        ${filteredProducts.map(p => {
                            let statusText = 'Normal';
                            let badgeClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                            if (p.stock == null || p.stock === 0) {
                                statusText = 'Crítico';
                                badgeClass = 'bg-red-500/20 text-red-400 border border-red-500/30';
                            } else if (p.stock <= p.stock_minimo) {
                                statusText = 'Bajo';
                                badgeClass = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
                            }
                            return `
                                <tr>
                                    <td class="p-3 font-mono text-[#F8FAFC]">${p.codigo_unico || p.codigo_barras || p.id_producto}</td>
                                    <td class="p-3 font-bold text-[#F8FAFC]">${p.nombre_descripcion}</td>
                                    <td class="p-3 text-[#CBD5E1]">${p.categoria?.nombreCategoria || '-'}</td>
                                    <td class="p-3 font-bold ${p.stock <= p.stock_minimo ? 'text-red-400':'text-[#F8FAFC]'}">${p.stock} ${p.unidad?.nombre || ''}</td>
                                    <td class="p-3 text-[#CBD5E1]">${p.stock_minimo} ${p.unidad?.nombre || ''}</td>
                                    <td class="p-3">
                                        <span class="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">${statusText}</span>
                                    </td>
                                </tr>
                            `;
                        }).join('') || '<tr><td colspan="6" class="p-4 text-center text-slate-500">No se encontraron productos.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    const report = REPORTS_METADATA.find(r => r.id === state.selectedReportId);
    c.innerHTML = `
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-aos="fade-down">
            <div class="flex items-center gap-3">
                <button onclick="window.backToReports()" class="flex items-center justify-center p-2 rounded-xl bg-[#1E293B] text-[#CBD5E1] border border-[#334155] hover:bg-[#334155] hover:text-[#F8FAFC] transition-all">
                    <i class="bi bi-arrow-left text-xl"></i>
                </button>
                <div>
                    <h2 class="text-2xl font-bold text-[#F8FAFC] tracking-tight">${report.title}</h2>
                    <p class="text-sm text-[#CBD5E1] mt-1">${report.desc}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button class="bg-[#1E293B] border border-[#334155] text-[#CBD5E1] hover:bg-[#334155] px-4 py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm" onclick="window.exportReport('excel')">
                    <i class="bi bi-file-earmark-spreadsheet text-emerald-500"></i> Excel
                </button>
                <button class="bg-[#1E293B] border border-[#334155] text-[#CBD5E1] hover:bg-[#334155] px-4 py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm" onclick="window.exportReport('pdf')">
                    <i class="bi bi-file-pdf text-red-500"></i> PDF
                </button>
                <button class="bg-[#1E293B] border border-[#334155] text-[#CBD5E1] hover:bg-[#334155] px-4 py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm" onclick="window.exportReport('print')">
                    <i class="bi bi-printer text-blue-500"></i> Imprimir
                </button>
            </div>
        </div>

        <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] p-6" data-aos="fade-up">
            ${subHtml}
        </div>
    `;
}

// Client History & Detail modal
window.openClientDetailModal = async (clientId) => {
    const client = state.caches.clients.find(x => x.id === clientId) || 
                   (await api.getEntities()).find(x => x.id === clientId);
    if (!client) return Swal.fire({ icon: 'error', title: 'Error', text: 'No se encontró la información del cliente.' });

    const sales = await api.getSales();
    const purchases = await api.getPurchases();
    const entities = await api.getEntities();
    const proformas = MOCK_DB.proformas || [];

    const clientSales = sales.filter(s => s.clientId === clientId).sort((a,b) => b.id - a.id);
    const totalComprado = clientSales.filter(s => s.status !== 'Anulado').reduce((sum, s) => sum + s.total, 0);

    const providerProfile = entities.find(e => e.document === client.document && e.type === 'PROVEEDOR');
    const associatedPurchases = providerProfile ? purchases.filter(p => p.providerId === providerProfile.id).sort((a,b) => b.id - a.id) : [];

    const clientProformas = proformas.filter(p => p.clientId === clientId).sort((a,b) => b.id - a.id);

    const generalTabHtml = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Documento (${client.docType})</span>
                <span class="text-sm font-bold text-slate-800 font-mono">${client.document}</span>
            </div>
            <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre o Razón Social</span>
                <span class="text-sm font-bold text-slate-800">${client.name}</span>
            </div>
            <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 sm:col-span-2">
                <span class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dirección Fiscal</span>
                <span class="text-sm font-semibold text-slate-700">${client.address || '-'}</span>
            </div>
            <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Teléfono</span>
                <span class="text-sm font-semibold text-slate-700">${client.phone || '-'}</span>
            </div>
            <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Correo Electrónico</span>
                <span class="text-sm font-semibold text-slate-700">${client.email || '-'}</span>
            </div>
        </div>
    `;

    const salesTabHtml = `
        <div class="flex justify-between items-center mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">Volumen Total de Compras</span>
            <h3 class="text-xl font-black text-blue-700">${formatMoney(totalComprado)}</h3>
        </div>
        <div class="overflow-x-auto rounded-xl border border-slate-150 max-h-[250px] custom-scrollbar">
            <table class="w-full text-left text-xs border-collapse">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-200">
                        <th class="p-2.5 font-bold text-slate-600">Fecha</th>
                        <th class="p-2.5 font-bold text-slate-600">Comprobante</th>
                        <th class="p-2.5 font-bold text-slate-600">Serie</th>
                        <th class="p-2.5 font-bold text-slate-600">Total</th>
                        <th class="p-2.5 font-bold text-slate-600">Estado</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${clientSales.map(s => `
                        <tr>
                            <td class="p-2.5 text-slate-600">${s.date}</td>
                            <td class="p-2.5 text-slate-800 font-semibold">${s.docType}</td>
                            <td class="p-2.5 text-slate-700 font-mono">${s.correlative}</td>
                            <td class="p-2.5 font-bold text-slate-900">${formatMoney(s.total)}</td>
                            <td class="p-2.5">
                                <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${s.status==='Anulado' ? 'bg-red-100 text-red-800':'bg-emerald-100 text-emerald-800'}">${s.status}</span>
                            </td>
                        </tr>
                    `).join('') || '<tr><td colspan="5" class="p-4 text-center text-slate-400">No se registran transacciones de venta.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;

    const purchasesTabHtml = providerProfile ? `
        <div class="flex justify-between items-center mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Adquisiciones como Proveedor</span>
            <h3 class="text-xl font-black text-emerald-700">${formatMoney(associatedPurchases.reduce((sum, p) => sum + p.total, 0))}</h3>
        </div>
        <div class="overflow-x-auto rounded-xl border border-slate-150 max-h-[250px] custom-scrollbar">
            <table class="w-full text-left text-xs border-collapse">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-200">
                        <th class="p-2.5 font-bold text-slate-600">Fecha</th>
                        <th class="p-2.5 font-bold text-slate-600">N° Factura</th>
                        <th class="p-2.5 font-bold text-slate-600">Monto Total</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${associatedPurchases.map(p => `
                        <tr>
                            <td class="p-2.5 text-slate-600">${p.date}</td>
                            <td class="p-2.5 text-slate-700 font-mono">${p.nroFactura}</td>
                            <td class="p-2.5 font-bold text-slate-900">${formatMoney(p.total)}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="3" class="p-4 text-center text-slate-400">No se registran facturas de compra asociadas.</td></tr>'}
                </tbody>
            </table>
        </div>
    ` : `
        <div class="py-10 text-center">
            <i class="bi bi-exclamation-octagon text-3xl text-amber-500 mb-2 block"></i>
            <h4 class="font-bold text-sm text-slate-800">No Registrado como Proveedor</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Esta entidad no posee un perfil activo de tipo PROVEEDOR con RUC/DNI (${client.document}).</p>
        </div>
    `;

    const proformasTabHtml = `
        <div class="overflow-x-auto rounded-xl border border-slate-150 max-h-[250px] custom-scrollbar">
            <table class="w-full text-left text-xs border-collapse">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-200">
                        <th class="p-2.5 font-bold text-slate-600">Fecha</th>
                        <th class="p-2.5 font-bold text-slate-600">Número</th>
                        <th class="p-2.5 font-bold text-slate-600">Monto Total</th>
                        <th class="p-2.5 font-bold text-slate-600">Estado Comercial</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${clientProformas.map(prof => {
                        const status = prof.status || 'Pendiente';
                        const badgeClass = status === 'Aprobada' || status === 'Convertida a Venta' ? 'bg-emerald-100 text-emerald-800' : status === 'Rechazada' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800';
                        return `
                            <tr>
                                <td class="p-2.5 text-slate-600">${prof.date}</td>
                                <td class="p-2.5 text-slate-700 font-mono">${prof.correlative}</td>
                                <td class="p-2.5 font-bold text-slate-900">${formatMoney(prof.total)}</td>
                                <td class="p-2.5">
                                    <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}">${status}</span>
                                </td>
                            </tr>
                        `;
                    }).join('') || '<tr><td colspan="4" class="p-4 text-center text-slate-400">No se registran cotizaciones generadas.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;

    const modalHtml = `
        <div class="border-b border-slate-150 p-5 bg-slate-50 rounded-t-3xl">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-lg font-bold text-slate-900">Ficha Comercial del Cliente</h3>
                    <p class="text-xs text-blue-600 font-semibold mt-0.5">${client.name} • ${client.docType} ${client.document}</p>
                </div>
                <button class="text-slate-400 hover:text-slate-600 text-2xl font-black" onclick="closeModal(event)">&times;</button>
            </div>
        </div>
        <div class="p-6 text-slate-800">
            <!-- Tabs Buttons -->
            <div class="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto">
                <button onclick="window.switchClientTab('general')" id="tab-btn-general" class="px-4 py-2 text-xs font-bold border-b-2 border-blue-600 text-blue-600 focus:outline-none transition-all uppercase tracking-wide">Datos Generales</button>
                <button onclick="window.switchClientTab('ventas')" id="tab-btn-ventas" class="px-4 py-2 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 focus:outline-none transition-all uppercase tracking-wide">Ventas</button>
                <button onclick="window.switchClientTab('compras')" id="tab-btn-compras" class="px-4 py-2 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 focus:outline-none transition-all uppercase tracking-wide">Compras</button>
                <button onclick="window.switchClientTab('cotizaciones')" id="tab-btn-cotizaciones" class="px-4 py-2 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 focus:outline-none transition-all uppercase tracking-wide">Cotizaciones</button>
            </div>

            <!-- Tabs Content -->
            <div id="client-tab-general" class="client-tab-panel">${generalTabHtml}</div>
            <div id="client-tab-ventas" class="client-tab-panel hidden">${salesTabHtml}</div>
            <div id="client-tab-compras" class="client-tab-panel hidden">${purchasesTabHtml}</div>
            <div id="client-tab-cotizaciones" class="client-tab-panel hidden">${proformasTabHtml}</div>
        </div>
    `;

    showModal(modalHtml, 'max-w-3xl');

    window.switchClientTab = (tabId) => {
        document.querySelectorAll('.client-tab-panel').forEach(panel => panel.classList.add('hidden'));
        document.getElementById(`client-tab-${tabId}`).classList.remove('hidden');

        const activeClass = ['border-blue-600', 'text-blue-600'];
        const inactiveClass = ['border-transparent', 'text-slate-500', 'hover:text-slate-800'];

        ['general', 'ventas', 'compras', 'cotizaciones'].forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            if (t === tabId) {
                btn.classList.add(...activeClass);
                btn.classList.remove(...inactiveClass);
            } else {
                btn.classList.remove(...activeClass);
                btn.classList.add(...inactiveClass);
            }
        });
    };
};

window.openClientHistoryModal = async (clientId, clientName) => {
    window.openClientDetailModal(clientId);
};

window.renderReports = renderReports;