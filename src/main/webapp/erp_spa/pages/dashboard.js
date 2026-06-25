async function renderDashboard(c) {
    // 1. Fetch data from simulated DB/API layers
    const sales = await api.getSales();
    const purchases = await api.getPurchases();
    const products = await api.getProducts();
    const entities = await api.getEntities();
    const installments = await api.getInstallments ? await api.getInstallments() : [];
    const movements = await api.getRecentMovements ? await api.getRecentMovements() : [];

    // 2. Dates setup
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonthStr = todayStr.slice(0, 7);

    // 3. Metric Calculations (Soles only)
    const dailySales = sales.filter(s => s.date.startsWith(todayStr) && s.status !== 'Anulado');
    const dailyTotal = dailySales.reduce((sum, s) => sum + s.total, 0);

    const monthlySales = sales.filter(s => s.date.startsWith(currentMonthStr) && s.status !== 'Anulado');
    const monthlyTotal = monthlySales.reduce((sum, s) => sum + s.total, 0);

    const monthlyPurchases = purchases.filter(p => p.date.startsWith(currentMonthStr));
    const monthlyPurchasesTotal = monthlyPurchases.reduce((sum, p) => sum + p.total, 0);

    const estimatedUtility = monthlyTotal - monthlyPurchasesTotal;

    const clientsCount = entities.filter(e => e.type === 'CLIENTE').length;
    const productsCount = products.length;

    // 4. Installments & Credits Calculations
    const pendingInstallments = installments.filter(i => i.status !== 'Cancelada' && i.status !== 'Pagado' && i.dueDate >= todayStr);
    const pendingAmount = pendingInstallments.reduce((sum, i) => sum + (i.amount - (i.paidAmount || 0)), 0);

    const overdueInstallments = installments.filter(i => i.status !== 'Cancelada' && i.status !== 'Pagado' && i.dueDate < todayStr);
    const overdueAmount = overdueInstallments.reduce((sum, i) => sum + (i.amount - (i.paidAmount || 0)), 0);

    const totalToCollect = installments.filter(i => i.status !== 'Cancelada' && i.status !== 'Pagado')
                                       .reduce((sum, i) => sum + (i.amount - (i.paidAmount || 0)), 0);

    // 5. Today's Received Payments (Sales cash flow)
    let todayPaymentsCount = 0;
    let todayPaymentsSum = 0;
    sales.filter(s => s.date.startsWith(todayStr) && s.status !== 'Anulado').forEach(s => {
        if (s.payments && s.payments.length > 0) {
            s.payments.forEach(p => {
                todayPaymentsSum += p.amount;
                todayPaymentsCount++;
            });
        } else if (s.paymentMethod !== 'Crédito') {
            todayPaymentsSum += s.total;
            todayPaymentsCount++;
        }
    });

    // 6. Inventory Summary & Critical Stock
    const totalInventoryUnits = products.reduce((sum, p) => sum + p.stock, 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const criticalStockProducts = products.filter(p => p.stock <= p.minStock);

    // 7. Payment Methods Doughnut Calculation
    const paymentSums = { 'Efectivo': 0, 'Transferencia': 0, 'Tarjeta': 0, 'Crédito': 0 };
    sales.filter(s => s.status !== 'Anulado').forEach(s => {
        if (s.paymentMethod === 'Crédito') {
            paymentSums['Crédito'] += s.total;
        } else if (s.payments && s.payments.length > 0) {
            s.payments.forEach(p => {
                const method = p.method || 'Efectivo';
                if (paymentSums[method] !== undefined) paymentSums[method] += p.amount;
                else paymentSums['Efectivo'] += p.amount;
            });
        } else {
            const method = s.paymentMethod || 'Efectivo';
            if (paymentSums[method] !== undefined) paymentSums[method] += s.total;
            else paymentSums['Efectivo'] += s.total;
        }
    });
    const totalPaymentsReceived = Object.values(paymentSums).reduce((a, b) => a + b, 0);

    // 8. Weekly Sales and Purchases trend calculation
    const salesWeeklyData = [];
    const purchasesWeeklyData = [];
    const weekdayLabels = [];
    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        weekdayLabels.push(weekdays[d.getDay()]);

        const daySales = sales.filter(s => s.date.startsWith(dStr) && s.status !== 'Anulado');
        salesWeeklyData.push(daySales.reduce((sum, s) => sum + s.total, 0));

        const dayPurchases = purchases.filter(p => p.date.startsWith(dStr));
        purchasesWeeklyData.push(dayPurchases.reduce((sum, p) => sum + p.total, 0));
    }

    // 9. Timeline of activities (Last 20)
    let timeline = [];
    sales.forEach(s => {
        timeline.push({
            time: s.date,
            label: s.status === 'Anulado' ? 'Venta Anulada' : 'Venta Registrada',
            desc: `Comprobante ${s.correlative}`,
            amount: s.total,
            isNegative: false,
            icon: 'fa-receipt',
            color: s.status === 'Anulado' ? 'text-red-500 bg-red-500/10' : 'text-blue-500 bg-blue-500/10'
        });
    });
    purchases.forEach(p => {
        timeline.push({
            time: p.date,
            label: 'Compra Registrada',
            desc: `Factura ${p.nroFactura} - ${p.supplierName || 'Proveedor'}`,
            amount: p.total,
            isNegative: true,
            icon: 'fa-cart-shopping',
            color: 'text-emerald-500 bg-emerald-500/10'
        });
    });
    entities.forEach(e => {
        timeline.push({
            time: e.id ? new Date(e.id).toISOString().split('T')[0] + ' 12:00:00' : todayStr + ' 12:00:00',
            label: `${e.type === 'CLIENTE' ? 'Cliente' : 'Proveedor'} Creado`,
            desc: e.name,
            amount: null,
            isNegative: false,
            icon: 'fa-user-plus',
            color: 'text-indigo-500 bg-indigo-500/10'
        });
    });
    movements.forEach(m => {
        timeline.push({
            time: m.date || todayStr + ' 12:00:00',
            label: `Kardex: ${m.type}`,
            desc: `${m.reason} (${m.quantity} und)`,
            amount: null,
            isNegative: m.type !== 'ENTRADA',
            icon: 'fa-arrow-left-right',
            color: m.type === 'ENTRADA' ? 'text-teal-500 bg-teal-500/10' : 'text-amber-500 bg-amber-500/10'
        });
    });

    // Sort timeline descending
    timeline.sort((a, b) => b.time.localeCompare(a.time));
    const recentActivity = timeline.slice(0, 20);

    // 10. Render Layout HTML
    c.innerHTML = `
        <!-- HEADER MODULE -->
        <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" data-aos="fade-down">
            <div>
                <h2 class="text-2xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2">
                    <i class="bi bi-speedometer2 text-blue-500"></i> Centro de Control
                </h2>
                <p class="text-xs text-[#CBD5E1] mt-1 font-medium flex flex-wrap items-center gap-1.5">
                    <span>Panel general de monitorización, finanzas y operaciones comerciales</span>
                    <span class="text-[#3B82F6] font-bold">•</span>
                    <span id="dashboard-clock-display" class="font-mono text-blue-400 font-bold">Cargando fecha y hora...</span>
                </p>
            </div>
            
            <div class="flex flex-wrap gap-2">
                <!-- Tipo de Cambio Card -->
                <div onclick="window.editExchangeRate()" class="flex items-center gap-3 px-4 py-2 bg-[#172033] border border-[#1E293B] rounded-xl cursor-pointer hover:border-blue-500 hover:bg-[#1E293B] transition-all group">
                    <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold">
                        $
                    </div>
                    <div>
                        <span class="block text-[10px] font-bold text-[#CBD5E1] uppercase tracking-wide">USD Referencial</span>
                        <span class="text-xs font-black text-[#F8FAFC] group-hover:text-blue-400 transition-colors">USD = S/ ${state.exchangeRate.toFixed(2)}</span>
                    </div>
                    <i class="bi bi-pencil-square text-xs text-slate-400 ml-1 group-hover:text-blue-500 transition-colors"></i>
                </div>
            </div>
        </div>

        <!-- 1. RAPID METRICS GRID (6 CARDS RESPONSIVE) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6" data-aos="fade-up">
            <!-- Ventas del Día -->
            <div class="bg-[#172033] rounded-2xl p-4 border border-[#1E293B] hover:shadow-md transition-shadow relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                <div class="relative flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg shrink-0 shadow-inner">
                        <i class="bi bi-calendar-event"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-wider mb-0.5">Ventas Hoy</p>
                        <h3 class="text-base font-black text-[#F8FAFC]">${window.formatMoney(dailyTotal)}</h3>
                        <span class="text-[9px] text-emerald-400 font-bold"><i class="bi bi-arrow-up-short"></i> Activo</span>
                    </div>
                </div>
            </div>
            
            <!-- Ventas del Mes -->
            <div class="bg-[#172033] rounded-2xl p-4 border border-[#1E293B] hover:shadow-md transition-shadow relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                <div class="relative flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg shrink-0 shadow-inner">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-wider mb-0.5">Ventas del Mes</p>
                        <h3 class="text-base font-black text-[#F8FAFC]">${window.formatMoney(monthlyTotal)}</h3>
                        <span class="text-[9px] text-slate-400 font-medium">Facturado</span>
                    </div>
                </div>
            </div>
            
            <!-- Compras del Mes -->
            <div class="bg-[#172033] rounded-2xl p-4 border border-[#1E293B] hover:shadow-md transition-shadow relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 w-16 h-16 bg-red-500/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                <div class="relative flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center text-lg shrink-0 shadow-inner">
                        <i class="bi bi-cart-dash"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-wider mb-0.5">Compras Mes</p>
                        <h3 class="text-base font-black text-[#F8FAFC]">${window.formatMoney(monthlyPurchasesTotal)}</h3>
                        <span class="text-[9px] text-red-400 font-semibold">Gastos</span>
                    </div>
                </div>
            </div>
            
            <!-- Utilidad Estimada -->
            <div class="bg-[#172033] rounded-2xl p-4 border border-[#1E293B] hover:shadow-md transition-shadow relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 w-16 h-16 bg-purple-500/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                <div class="relative flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-lg shrink-0 shadow-inner">
                        <i class="bi bi-graph-up-arrow"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-wider mb-0.5">Utilidad Neta</p>
                        <h3 class="text-base font-black ${estimatedUtility >= 0 ? 'text-emerald-400' : 'text-red-400'}">${window.formatMoney(estimatedUtility)}</h3>
                        <span class="text-[9px] text-[#CBD5E1] font-medium">Margen bruto</span>
                    </div>
                </div>
            </div>

            <!-- Clientes -->
            <div class="bg-[#172033] rounded-2xl p-4 border border-[#1E293B] hover:shadow-md transition-shadow relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                <div class="relative flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-lg shrink-0 shadow-inner">
                        <i class="bi bi-people"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-wider mb-0.5">Clientes</p>
                        <h3 class="text-base font-black text-[#F8FAFC]">${clientsCount}</h3>
                        <span class="text-[9px] text-[#CBD5E1] font-medium">Entidades activas</span>
                    </div>
                </div>
            </div>

            <!-- Productos -->
            <div class="bg-[#172033] rounded-2xl p-4 border border-[#1E293B] hover:shadow-md transition-shadow relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                <div class="relative flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-lg shrink-0 shadow-inner">
                        <i class="bi bi-tags"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-wider mb-0.5">Productos</p>
                        <h3 class="text-base font-black text-[#F8FAFC]">${productsCount}</h3>
                        <span class="text-[9px] text-[#CBD5E1] font-medium">Items en catálogo</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. QUICK ACTIONS BAR -->
        <div class="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6" data-aos="fade-up">
            <button onclick="navigate('pos')" class="flex items-center justify-center gap-2 p-3 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-semibold text-xs shadow-inner">
                <i class="bi bi-cart-plus text-base"></i> Nueva Venta
            </button>
            <button onclick="navigate('purchases')" class="flex items-center justify-center gap-2 p-3 bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-semibold text-xs shadow-inner">
                <i class="bi bi-bag-plus text-base"></i> Registrar Compra
            </button>
            <button onclick="navigate('inventory')" class="flex items-center justify-center gap-2 p-3 bg-amber-600/10 text-amber-400 border border-amber-600/20 rounded-xl hover:bg-amber-600 hover:text-white transition-all font-semibold text-xs shadow-inner">
                <i class="bi bi-box-seam text-base"></i> Registrar Producto
            </button>
            <button onclick="navigate('entities')" class="flex items-center justify-center gap-2 p-3 bg-purple-600/10 text-purple-400 border border-purple-600/20 rounded-xl hover:bg-purple-600 hover:text-white transition-all font-semibold text-xs shadow-inner">
                <i class="bi bi-person-plus text-base"></i> Registrar Cliente
            </button>
            <button onclick="navigate('reports')" class="flex items-center justify-center gap-2 p-3 bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-semibold text-xs shadow-inner">
                <i class="bi bi-file-earmark-bar-graph text-base"></i> Ver Reportes
            </button>
            <button onclick="navigate('installments')" class="flex items-center justify-center gap-2 p-3 bg-rose-600/10 text-rose-400 border border-rose-600/20 rounded-xl hover:bg-rose-600 hover:text-white transition-all font-semibold text-xs shadow-inner">
                <i class="bi bi-credit-card text-base"></i> Gestionar Cuotas
            </button>
        </div>

        <!-- 3. VISUAL GRAPHS BLOCK (3 CHARTS GRID) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" data-aos="fade-up">
            <!-- Weekly sales and purchases chart -->
            <div class="lg:col-span-2 bg-[#172033] rounded-2xl shadow-sm border border-[#1E293B] p-5">
                <div class="flex justify-between items-center mb-4">
                    <h5 class="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Flujo de Caja Semanal (Últimos 7 días)</h5>
                    <div class="flex items-center gap-4 text-xs font-semibold">
                        <span class="flex items-center gap-1.5 text-blue-400"><span class="w-2.5 h-2.5 bg-blue-600 rounded-full"></span> Ventas</span>
                        <span class="flex items-center gap-1.5 text-red-400"><span class="w-2.5 h-2.5 bg-red-500 rounded-full"></span> Compras</span>
                    </div>
                </div>
                <div class="h-[260px] w-full">
                    <canvas id="weeklyFlowChart"></canvas>
                </div>
            </div>

            <!-- Payment Methods Doughnut chart -->
            <div class="bg-[#172033] rounded-2xl shadow-sm border border-[#1E293B] p-5 flex flex-col">
                <h5 class="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider mb-4">Distribución Métodos de Pago</h5>
                <div class="relative w-full h-[160px] flex items-center justify-center shrink-0 mb-4">
                    <canvas id="payMethodsChart"></canvas>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs flex-grow overflow-y-auto">
                    <div class="flex items-center justify-between p-2 rounded bg-[#0B1120] border border-[#1E293B]">
                        <span class="text-slate-300 font-semibold flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Efectivo</span>
                        <span class="font-bold text-[#F8FAFC]">${window.formatMoney(paymentSums['Efectivo'])}</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded bg-[#0B1120] border border-[#1E293B]">
                        <span class="text-slate-300 font-semibold flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Transf.</span>
                        <span class="font-bold text-[#F8FAFC]">${window.formatMoney(paymentSums['Transferencia'])}</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded bg-[#0B1120] border border-[#1E293B]">
                        <span class="text-slate-300 font-semibold flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500"></span> Tarjeta</span>
                        <span class="font-bold text-[#F8FAFC]">${window.formatMoney(paymentSums['Tarjeta'])}</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded bg-[#0B1120] border border-[#1E293B]">
                        <span class="text-slate-300 font-semibold flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Crédito</span>
                        <span class="font-bold text-[#F8FAFC]">${window.formatMoney(paymentSums['Crédito'])}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. SECONDARY DATA PANELS AND ACTIVITY TIMELINE -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" data-aos="fade-up">
            
            <!-- Operational Details & Alertas -->
            <div class="flex flex-col gap-6 lg:col-span-2">
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <!-- Cuotas y Créditos Summary -->
                    <div class="bg-[#172033] rounded-2xl border border-[#1E293B] p-5 flex flex-col justify-between">
                        <div>
                            <h5 class="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-3"><i class="bi bi-wallet2 text-rose-400"></i> Balance de Créditos</h5>
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <span class="block text-[10px] text-slate-400 font-semibold uppercase">Vencidas</span>
                                    <span class="text-sm font-black text-red-500">${window.formatMoney(overdueAmount)}</span>
                                    <span class="block text-[9px] text-red-400/80 mt-0.5">${overdueInstallments.length} vencimientos</span>
                                </div>
                                <div>
                                    <span class="block text-[10px] text-slate-400 font-semibold uppercase">Vigentes</span>
                                    <span class="text-sm font-black text-amber-500">${window.formatMoney(pendingAmount)}</span>
                                    <span class="block text-[9px] text-amber-400/80 mt-0.5">${pendingInstallments.length} por cobrar</span>
                                </div>
                            </div>
                        </div>
                        <div class="border-t border-[#1E293B] pt-3 flex justify-between items-center mt-2">
                            <span class="text-xs text-[#CBD5E1] font-semibold">Total por Cobrar</span>
                            <span class="text-base font-black text-blue-400">${window.formatMoney(totalToCollect)}</span>
                        </div>
                    </div>

                    <!-- Cashier & Inventory Value -->
                    <div class="bg-[#172033] rounded-2xl border border-[#1E293B] p-5 flex flex-col justify-between">
                        <div>
                            <h5 class="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-3"><i class="bi bi-box-seam text-blue-400"></i> Resumen de Existencias</h5>
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <span class="block text-[10px] text-slate-400 font-semibold uppercase">Existencias</span>
                                    <span class="text-sm font-black text-[#F8FAFC]">${totalInventoryUnits} und</span>
                                    <span class="block text-[9px] text-[#CBD5E1] mt-0.5">${productsCount} items únicos</span>
                                </div>
                                <div>
                                    <span class="block text-[10px] text-slate-400 font-semibold uppercase">Valor Almacén</span>
                                    <span class="text-sm font-black text-emerald-400">${window.formatMoney(totalInventoryValue)}</span>
                                    <span class="block text-[9px] text-slate-400 mt-0.5">Precio de Venta</span>
                                </div>
                            </div>
                        </div>
                        <div class="border-t border-[#1E293B] pt-3 flex justify-between items-center mt-2">
                            <span class="text-xs text-[#CBD5E1] font-semibold">Cobros Registrados Hoy</span>
                            <span class="text-base font-black text-emerald-400">${window.formatMoney(todayPaymentsSum)} (${todayPaymentsCount})</span>
                        </div>
                    </div>
                </div>

                <!-- Critical Stock Alerts -->
                <div class="bg-[#172033] rounded-2xl border border-[#1E293B] p-5">
                    <h5 class="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-3 flex items-center justify-between">
                        <span><i class="bi bi-exclamation-triangle text-red-500"></i> Alertas de Inventario Crítico</span>
                        ${criticalStockProducts.length > 0 ? `<span class="bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-red-500/20">${criticalStockProducts.length} Alertas</span>` : ''}
                    </h5>
                    <div class="max-h-[160px] overflow-y-auto pr-1">
                        ${criticalStockProducts.length > 0 ? `
                        <div class="divide-y divide-[#1E293B]">
                            ${criticalStockProducts.map(p => `
                            <div class="py-2.5 flex items-center justify-between">
                                <div>
                                    <span class="font-mono text-xs font-bold text-red-400">${p.code}</span>
                                    <span class="text-xs font-bold text-[#F8FAFC] ml-2">${p.name}</span>
                                </div>
                                <div class="text-right">
                                    <span class="text-xs text-red-400 font-black">Stock: ${p.stock} ${p.unit}</span>
                                    <span class="block text-[10px] text-slate-400">Mínimo: ${p.minStock} ${p.unit}</span>
                                </div>
                            </div>
                            `).join('')}
                        </div>
                        ` : `
                        <div class="py-6 text-center text-[#CBD5E1] text-xs font-semibold">
                            <i class="bi bi-shield-check text-emerald-400 text-lg block mb-1"></i>
                            Todos los productos se encuentran dentro de los niveles permitidos.
                        </div>
                        `}
                    </div>
                </div>
            </div>

            <!-- Chronological Timeline of Recent Activities -->
            <div class="bg-[#172033] rounded-2xl border border-[#1E293B] p-5 flex flex-col max-h-[465px]">
                <h5 class="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-4"><i class="bi bi-activity text-blue-400"></i> Actividad Reciente</h5>
                <div class="flex-grow overflow-y-auto pr-1 custom-scrollbar">
                    ${recentActivity.length > 0 ? `
                    <div class="relative border-l-2 border-[#1E293B] ml-2 pl-4 space-y-4">
                        ${recentActivity.map(act => `
                        <div class="relative">
                            <div class="absolute -left-[25px] top-0 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${act.color} border border-[#172033]">
                                <i class="fa ${act.icon}"></i>
                            </div>
                            <div>
                                <span class="block text-[10px] text-slate-400 font-mono">${act.time}</span>
                                <h6 class="text-xs font-bold text-[#F8FAFC] mt-0.5">${act.label}</h6>
                                <p class="text-[10px] text-[#CBD5E1] mt-0.5 leading-relaxed">${act.desc}</p>
                                ${act.amount !== null ? `<span class="inline-block text-[10px] font-black ${act.isNegative ? 'text-red-400':'text-emerald-400'} mt-1">${act.isNegative ? '-':'+'} ${window.formatMoney(act.amount)}</span>` : ''}
                            </div>
                        </div>
                        `).join('')}
                    </div>
                    ` : `
                    <div class="h-full flex flex-col justify-center items-center text-center text-slate-500 py-12">
                        <i class="bi bi-inbox text-3xl mb-2"></i>
                        <p class="text-xs">No se han registrado actividades aún</p>
                    </div>
                    `}
                </div>
            </div>

        </div>
    `;

    // 11. Custom Switcher for Exchange Rate
    window.editExchangeRate = () => {
        Swal.fire({
            title: 'Actualizar Tipo de Cambio',
            input: 'number',
            inputAttributes: { min: '0.01', step: '0.01' },
            inputValue: state.exchangeRate,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#2563EB',
            customClass: { 
                popup: 'rounded-2xl bg-[#172033] text-[#F8FAFC] border border-[#1E293B]',
                title: 'text-lg font-bold text-[#F8FAFC]',
                input: 'bg-[#0B1120] text-[#F8FAFC] border-[#1E293B] rounded-xl focus:ring-0',
                confirmButton: 'rounded-xl font-bold px-4 py-2.5',
                cancelButton: 'rounded-xl font-semibold px-4 py-2.5 bg-[#0B1120] border border-[#1E293B] text-slate-300 hover:bg-[#1E293B]'
            }
        }).then((res) => {
            if (res.isConfirmed && res.value) {
                window.updateExchangeRate(res.value);
                window.renderDashboard(c);
            }
        });
    };

    // 12. RENDER CHART ENGINE (Chart.js)
    setTimeout(() => {
        const isLight = document.body.classList.contains('light-theme');
        const labelColor = isLight ? '#475569' : '#cbd5e1';
        const gridColor = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)';
        const borderColor = isLight ? '#cbd5e1' : '#1e293b';

        // A. Weekly Cash Flow Chart (Sales and Purchases)
        const weeklyCtx = document.getElementById('weeklyFlowChart');
        if (weeklyCtx) {
            new Chart(weeklyCtx, {
                type: 'bar',
                data: {
                    labels: weekdayLabels,
                    datasets: [
                        {
                            label: 'Ventas',
                            data: salesWeeklyData,
                            backgroundColor: '#2563eb', // Premium primary blue
                            borderRadius: 6,
                            barPercentage: 0.5,
                            categoryPercentage: 0.8
                        },
                        {
                            label: 'Compras',
                            data: purchasesWeeklyData,
                            backgroundColor: '#ef4444', // Red 500
                            borderRadius: 6,
                            barPercentage: 0.5,
                            categoryPercentage: 0.8
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { 
                            grid: { color: gridColor }, 
                            ticks: { color: labelColor, font: { family: 'Inter', size: 10 } },
                            border: { display: false }
                        },
                        x: { 
                            grid: { display: false }, 
                            ticks: { color: labelColor, font: { family: 'Inter', size: 10, weight: 600 } },
                            border: { display: false }
                        }
                    }
                }
            });
        }

        // B. Payment Methods Distribution (Doughnut Chart)
        const payCtx = document.getElementById('payMethodsChart');
        if (payCtx) {
            const hasPayments = totalPaymentsReceived > 0;
            new Chart(payCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Efectivo', 'Transferencia', 'Tarjeta', 'Crédito'],
                    datasets: [{
                        data: hasPayments ? [paymentSums['Efectivo'], paymentSums['Transferencia'], paymentSums['Tarjeta'], paymentSums['Crédito']] : [1, 0, 0, 0],
                        backgroundColor: hasPayments ? ['#3b82f6', '#10b981', '#a855f7', '#f59e0b'] : ['#475569'],
                        borderColor: borderColor,
                        borderWidth: 2,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: { 
                        legend: { display: false }
                    }
                }
            });
        }

        // Dynamic ticking clock inside dashboard header
        let dashboardClockInterval = null;
        const updateDashboardClock = () => {
            const clockEl = document.getElementById('dashboard-clock-display');
            if (clockEl) {
                const now = new Date();
                const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                const dayName = days[now.getDay()];
                const dayNum = now.getDate();
                const monthName = months[now.getMonth()];
                const year = now.getFullYear();
                const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                clockEl.textContent = `${dayName}, ${dayNum} de ${monthName} de ${year} — ${timeStr}`;
            } else {
                // 2. Ahora sí la variable existe y se puede limpiar de manera segura
                if (dashboardClockInterval) {
                    clearInterval(dashboardClockInterval);
                }
            }
        };
        updateDashboardClock();
        cdashboardClockInterval = setInterval(updateDashboardClock, 1000);

        if (window.AOS) AOS.init();
    }, 50);
}

window.renderDashboard = renderDashboard;
