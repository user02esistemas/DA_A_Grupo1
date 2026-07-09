async function renderContabilidad(c) {
    const sales = await api.getSales();
    const sOpts = sales.filter(s=>s.status!=='Anulado').map(s=>`<option value="${s.id}">${s.correlative} - ${formatMoney(s.total)}</option>`).join('');
    
    c.innerHTML = `
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4" data-aos="fade-down">
            <div>
                <h2 class="text-2xl font-bold text-[#F8FAFC] tracking-tight">Módulo de Contabilidad</h2>
                <p class="text-sm text-[#CBD5E1] mt-1">Generación de Notas de Crédito, devoluciones y ajustes de facturación comercial.</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6" data-aos="fade-up">
            <!-- Emisión NC -->
            <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] p-6">
                <h3 class="text-lg font-bold text-red-400 mb-4 flex items-center gap-2 border-b border-[#334155] pb-3">
                    <i class="bi bi-arrow-counterclockwise"></i> Emitir Nota de Crédito (Devolución)
                </h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-[#CBD5E1] mb-1">Buscar Comprobante</label>
                        <div class="flex gap-2">
                            <select id="nc-sale" class="flex-grow rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all py-2.5 outline-none">
                                <option value="">Seleccione o busque comprobante...</option>
                                ${sOpts}
                            </select>
                            <button class="bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-white px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap" onclick="loadSaleDetailsForNC()">
                                <i class="bi bi-search"></i> Ver Detalle
                            </button>
                        </div>
                    </div>

                    <div id="nc-details-container" class="space-y-4 hidden">
                        <h4 class="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider text-slate-400">Detalle de Venta y Productos</h4>
                        <div class="overflow-x-auto rounded-xl border border-[#334155]">
                            <table class="w-full text-left text-xs border-collapse" id="nc-products-table">
                                <thead>
                                    <tr class="bg-[#111827] border-b border-[#334155]">
                                        <th class="p-3 font-bold text-[#CBD5E1]">Producto</th>
                                        <th class="p-3 font-bold text-[#CBD5E1]">Vendidos</th>
                                        <th class="p-3 font-bold text-[#CBD5E1]">Precio U.</th>
                                        <th class="p-3 font-bold text-[#CBD5E1]">Cant. Devolver</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-[#334155]">
                                </tbody>
                            </table>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-[#CBD5E1] mb-1">Motivo de la Devolución</label>
                            <textarea id="nc-mot" class="w-full rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all py-2.5 px-3 outline-none" rows="2" placeholder="Describa el motivo..." required></textarea>
                        </div>

                        <div class="flex justify-between items-center border-t border-[#334155] pt-4">
                            <div>
                                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Monto a Reembolsar</span>
                                <span class="text-xl font-black text-red-400" id="nc-refund-total">S/ 0.00</span>
                            </div>
                            <button type="button" class="bg-red-600 hover:bg-red-700 text-[#F8FAFC] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-red-600/20 flex items-center gap-1.5" onclick="submitNotaCredito()">
                                <i class="bi bi-receipt-cutoff"></i> Generar Nota de Crédito
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Listado NC emitidas -->
            <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden">
                <div class="p-4 border-b border-[#334155] bg-[#111827]">
                    <h3 class="font-bold text-[#F8FAFC]">Notas de Crédito Emitidas</h3>
                </div>
                <div class="overflow-x-auto max-h-[450px] custom-scrollbar">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-[#111827]/50 border-b border-[#334155]">
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">NC N°</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Documento Ref</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Motivo</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Reembolso</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Fecha</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#334155] text-xs">
                            ${MOCK_DB.notasCredito.map(n=>{
                                const refSale = sales.find(s=>s.id===n.saleId);
                                return `
                                    <tr class="hover:bg-[#111827]/40 transition-colors">
                                        <td class="p-3 font-mono font-bold text-[#F8FAFC]">NC-${String(n.id).slice(-4)}</td>
                                        <td class="p-3 text-[#CBD5E1]">${refSale?refSale.correlative:'N/A'}</td>
                                        <td class="p-3 text-[#CBD5E1]">${n.motivo}</td>
                                        <td class="p-3 font-bold text-red-400">${formatMoney(n.totalRefunded)}</td>
                                        <td class="p-3 text-[#CBD5E1]">${n.date}</td>
                                    </tr>
                                `;
                            }).join('') || '<tr><td colspan="5" class="p-8 text-center text-slate-500">No hay notas de crédito registradas</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

window.loadSaleDetailsForNC = () => {
    const saleId = parseInt(document.getElementById('nc-sale').value);
    if(!saleId) return Swal.fire('Error', 'Seleccione un comprobante.', 'error');
    
    const sale = MOCK_DB.sales.find(s => s.id === saleId);
    if(!sale || !sale.items || sale.items.length === 0) return Swal.fire('Error', 'El comprobante no tiene detalle de productos o no es válido.', 'error');
    
    const tbody = document.querySelector('#nc-products-table tbody');
    tbody.innerHTML = sale.items.map((i, idx) => {
        const p = i.price || i.product.price;
        const base = p * i.quantity;
        const d = i.discountType === '%' ? base * (i.discount/100) : (parseFloat(i.discount) || 0);
        const effectivePrice = (base - d) / i.quantity;
        
        return `
            <tr data-idx="${idx}" data-pid="${i.product.id}" data-price="${effectivePrice}" class="hover:bg-[#111827]/30 border-b border-[#334155] last:border-0">
                <td class="p-3 text-[#F8FAFC]">${i.product.name}</td>
                <td class="p-3 text-[#CBD5E1]">${i.quantity}</td>
                <td class="p-3 text-[#CBD5E1] font-mono">${formatMoney(effectivePrice)}</td>
                <td class="p-3">
                    <input type="number" class="w-20 rounded-lg border-[#334155] bg-[#1F2937] text-[#F8FAFC] py-1 text-center font-bold nc-qty-input" min="0" max="${i.quantity}" value="0" onchange="calcNCTotal()">
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('nc-details-container').classList.remove('hidden');
    calcNCTotal();
};

window.calcNCTotal = () => {
    let total = 0;
    document.querySelectorAll('#nc-products-table tbody tr').forEach(tr => {
        const qty = parseInt(tr.querySelector('.nc-qty-input').value) || 0;
        const price = parseFloat(tr.getAttribute('data-price'));
        total += (qty * price);
    });
    document.getElementById('nc-refund-total').textContent = `${formatMoney(total)}`;
};

window.submitNotaCredito = async () => {
    const saleId = parseInt(document.getElementById('nc-sale').value);
    const motivo = document.getElementById('nc-mot').value.trim();
    if(!saleId || !motivo) return Swal.fire('Error', 'Por favor complete la selección y el motivo.', 'error');
    
    const returnedItems = [];
    let totalRefunded = 0;
    
    document.querySelectorAll('#nc-products-table tbody tr').forEach(tr => {
        const qty = parseInt(tr.querySelector('.nc-qty-input').value) || 0;
        if(qty > 0) {
            const pId = parseInt(tr.getAttribute('data-pid'));
            const price = parseFloat(tr.getAttribute('data-price'));
            returnedItems.push({ productId: pId, quantity: qty, unitPrice: price });
            totalRefunded += (qty * price);
        }
    });
    
    if(returnedItems.length === 0) return Swal.fire('Error', 'Debe indicar al menos 1 producto a devolver.', 'error');
    
    await api.processNotaCredito({
        saleId: saleId,
        motivo: motivo,
        date: state.liveTimeFormatted,
        returnedItems: returnedItems,
        totalRefunded: totalRefunded
    });
    
    await Swal.fire({
        icon: 'success',
        title: 'Nota de Crédito Generada',
        text: 'La Nota de Crédito ha sido emitida exitosamente y el stock ha sido retornado al almacén.',
        confirmButtonColor: '#ef4444'
    });
    navigate('accounting');
};

window.renderContabilidad = renderContabilidad;
