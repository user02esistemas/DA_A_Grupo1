async function renderCompras(c) {
    const provs = await api.getEntities(); 
    const providers = provs.filter(p => p.type === 'PROVEEDOR');
    const prods = await api.getProducts();
    const compras = await api.getPurchases();
    const orders = await api.getPurchaseOrders();

    const provHtml = providers.map(p => `<option value="${p.id}">${p.docType} ${p.document} - ${p.name}</option>`).join('');
    const prodHtml = prods.map(p => `<option value="${p.id}" data-price="${p.price}" data-lote="${p.manejaLote}">${p.code} - ${p.name}</option>`).join('');
    
    window.comprasContext = { provHtml, prodHtml }; 

    const pendingOrders = orders.filter(o => o.status === 'PENDIENTE');
    const ocOpts = pendingOrders.map(o => `<option value="${o.id}">${o.correlative} - ${providers.find(p=>p.id===o.providerId)?.name}</option>`).join('');

    const crRows = compras.map(com => `
        <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0">
            <td class="p-4 whitespace-nowrap font-medium text-[#F8FAFC]">FAC-${com.nroFactura}</td>
            <td class="p-4 whitespace-nowrap text-[#CBD5E1]">${providers.find(p=>p.id===com.providerId)?.name||'N/A'}</td>
            <td class="p-4 whitespace-nowrap text-[#CBD5E1]">${new Date(com.date).toLocaleDateString()}</td>
            <td class="p-4 whitespace-nowrap text-[#F8FAFC] font-bold">${formatMoney(com.total)}</td>
            <td class="p-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Ingresado
                </span>
            </td>
        </tr>
    `).join('');
    
    const ocRows = orders.map(o => {
        let b = o.status==='PENDIENTE'?'bg-amber-500/20 text-amber-400 border border-amber-500/30':(o.status==='APROBADA'?'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30':'bg-red-500/20 text-red-400 border border-red-500/30');
        let dot = o.status==='PENDIENTE'?'bg-amber-500':(o.status==='APROBADA'?'bg-emerald-500':'bg-red-500');
        return `
            <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0">
                <td class="p-4 whitespace-nowrap font-medium text-[#F8FAFC]">${o.correlative}</td>
                <td class="p-4 whitespace-nowrap text-[#CBD5E1]">${providers.find(p=>p.id===o.providerId)?.name||'N/A'}</td>
                <td class="p-4 whitespace-nowrap text-[#CBD5E1]">${o.date}</td>
                <td class="p-4 whitespace-nowrap text-[#F8FAFC] font-bold">${formatMoney(o.estimatedTotal)}</td>
                <td class="p-4 whitespace-nowrap">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${b}">
                        <span class="w-1.5 h-1.5 rounded-full ${dot}"></span>
                        ${o.status}
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    c.innerHTML = `
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4" data-aos="fade-down">
            <div>
                <h2 class="text-2xl font-bold text-[#F8FAFC] tracking-tight">Gestión de Compras y Abastecimiento</h2>
                <p class="text-sm text-[#CBD5E1] mt-1">Registra facturas reales de compra o genera cotizaciones/órdenes de compra (OC).</p>
            </div>
            <button class="bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-[#F8FAFC] px-4 py-2 rounded-xl font-semibold shadow-sm transition-all flex items-center gap-2" onclick="openOCModal()">
                <i class="bi bi-file-earmark-plus"></i> Generar Orden de Compra (OC)
            </button>
        </div>

        <div class="grid grid-cols-1 gap-6 mb-6">
            <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] p-6" data-aos="fade-up">
                <h3 class="text-lg font-bold text-[#F8FAFC] mb-4 flex items-center gap-2 border-b border-[#334155] pb-3 text-emerald-400">
                    <i class="bi bi-box-arrow-in-down"></i> Registrar Compra Real (Recepción)
                </h3>
                
                <form id="compra-form" class="space-y-4">
                    <div class="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <label class="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Vincular a OC Pendiente (Opcional)</label>
                        <select id="c-order-link" class="w-full rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all py-2.5 outline-none" onchange="linkOC()">
                            <option value="">-- Compra Directa (Sin OC) --</option>
                            ${ocOpts}
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-[#CBD5E1] mb-1">Proveedor</label>
                            <select id="c-prov" class="w-full rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all py-2.5 outline-none" required>
                                <option value="">Seleccionar...</option>
                                ${provHtml}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-[#CBD5E1] mb-1">Factura N°</label>
                            <input type="text" id="c-fac" class="w-full rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all py-2.5 outline-none" required placeholder="001-00021">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-[#CBD5E1] mb-1">Fecha Factura</label>
                            <input type="date" id="c-date" class="w-full rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all py-2.5 outline-none" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-[#CBD5E1] mb-1">Moneda</label>
                            <select id="c-moneda" class="w-full rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all py-2.5 outline-none" required>
                                <option value="PEN">Soles (PEN)</option>
                                <option value="USD">Dólares (USD)</option>
                            </select>
                        </div>
                    </div>

                    <div class="p-4 rounded-xl bg-[#111827] border border-[#334155]">
                        <h4 class="text-sm font-bold text-[#F8FAFC] mb-3 uppercase tracking-wider text-slate-400">Agregar Producto</h4>
                        <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-[#CBD5E1] mb-1">Producto</label>
                                <select id="c-prod" class="w-full rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all py-2.5 outline-none">
                                    ${prodHtml}
                                </select>
                            </div>
                            
                            <div id="c-lote-container" class="hidden md:col-span-1">
                                <label class="block text-sm font-bold text-emerald-400 mb-1"><i class="bi bi-layers"></i> N° Lote</label>
                                <input type="text" id="c-lote" class="w-full rounded-xl border-emerald-500/50 bg-[#1F2937] text-[#F8FAFC] focus:border-emerald-500 py-2.5 outline-none font-mono text-sm shadow-[0_0_10px_rgba(16,185,129,0.2)]" placeholder="Lote...">
                            </div>

                            <div class="md:col-span-1">
                                <label class="block text-sm font-semibold text-[#CBD5E1] mb-1">Cant. Real</label>
                                <input type="number" id="c-cant" class="w-full rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all py-2.5 outline-none" value="1" min="1">
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-[#CBD5E1] mb-1">Costo U. Real</label>
                                <div class="flex gap-2">
                                    <input type="number" id="c-cost" class="w-full rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all py-2.5 outline-none" step="0.01">
                                    <button type="button" class="bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#F8FAFC] px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap" onclick="addCompraItem()">
                                        <i class="bi bi-plus-lg"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="overflow-x-auto rounded-xl border border-[#334155]">
                        <table class="w-full text-left border-collapse" id="c-table">
                            <thead>
                                <tr class="bg-[#111827] border-b border-[#334155]">
                                    <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Producto / Lote</th>
                                    <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Cant</th>
                                    <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Costo U.</th>
                                    <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Subtotal</th>
                                    <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[#334155]">
                            </tbody>
                        </table>
                    </div>

                    <div class="flex justify-between items-center border-t border-[#334155] pt-4 mt-6">
                        <div>
                            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total de Compra (Soles)</span>
                            <span class="text-2xl font-black text-emerald-400" id="c-total">S/ 0.00</span>
                        </div>
                        <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-[#F8FAFC] font-bold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2">
                            <i class="bi bi-box-arrow-in-down"></i> Ingresar al Almacén
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6" data-aos="fade-up">
            <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden">
                <div class="p-4 border-b border-[#334155] bg-[#111827] flex justify-between items-center">
                    <h3 class="font-bold text-[#F8FAFC]">Historial Órdenes de Compra</h3>
                </div>
                <div class="overflow-x-auto max-h-[300px] custom-scrollbar">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-[#111827]/50 border-b border-[#334155]">
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">OC N°</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Proveedor</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Fecha</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Total</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Estado</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#334155] text-xs">
                            ${ocRows || '<tr><td colspan="5" class="p-8 text-center text-slate-500">No hay OCs emitidas.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden">
                <div class="p-4 border-b border-[#334155] bg-[#111827] flex justify-between items-center">
                    <h3 class="font-bold text-[#F8FAFC]">Historial Compras Reales</h3>
                </div>
                <div class="overflow-x-auto max-h-[300px] custom-scrollbar">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-[#111827]/50 border-b border-[#334155]">
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Factura</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Proveedor</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Fecha</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Total</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Estado</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#334155] text-xs">
                            ${crRows || '<tr><td colspan="5" class="p-8 text-center text-slate-500">No hay compras registradas.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // ---------------------------------------------------------
    // LÓGICA DE COMPRA (Validación de Lotes y Monedas Integrada)
    // ---------------------------------------------------------
    window.tempCompraItems = [];
    
    window.linkOC = () => {
        const ocId = document.getElementById('c-order-link').value;
        if(!ocId) return;
        const oc = orders.find(o => o.id == ocId);
        if(!oc) return;
        
        document.getElementById('c-prov').value = oc.providerId;
        
        // Mapeamos los items y buscamos si requieren lote para pintar las cajitas rojas
        window.tempCompraItems = oc.items.map(i => {
            const prodInfo = prods.find(p => p.id === i.productId);
            return {
                ...i,
                manejaLote: prodInfo ? prodInfo.manejaLote : false,
                loteNumber: null // Aún no sabemos el lote
            };
        });
        renderCompraTable();
    };

    const cProdSelect = document.getElementById('c-prod');
    const cLoteContainer = document.getElementById('c-lote-container');
    const cLoteInput = document.getElementById('c-lote');
    const cCostInput = document.getElementById('c-cost');

    if (cProdSelect) {
        cProdSelect.addEventListener('change', e => {
            const opt = e.target.options[e.target.selectedIndex];
            cCostInput.value = (opt.getAttribute('data-price') * 0.7).toFixed(2);
            
            if(opt.getAttribute('data-lote') === 'true') {
                cLoteContainer.classList.remove('hidden');
            } else {
                cLoteContainer.classList.add('hidden');
                cLoteInput.value = '';
            }
        });
        
        if (cProdSelect.options[0]) cProdSelect.dispatchEvent(new Event('change'));
    }

    window.addCompraItem = () => {
        const pSel = document.getElementById('c-prod');
        const opt = pSel.options[pSel.selectedIndex];
        const pId = pSel.value;
        const name = opt.text;
        const cant = parseInt(document.getElementById('c-cant').value);
        let cost = parseFloat(cCostInput.value); 
        
        const manejaLote = opt.getAttribute('data-lote') === 'true';
        const loteNum = document.getElementById('c-lote').value.trim();
        
        const esDolares = document.getElementById('c-moneda').value === 'USD';

        if(!pId || cant<=0 || isNaN(cost) || cost<=0) {
            return Swal.fire('Error', 'Por favor ingrese una cantidad y un costo unitario válido.', 'error');
        }
        
        if(manejaLote && !loteNum) {
            return Swal.fire('Atención', 'Este producto requiere registrar un Número de Lote para ingresar al almacén.', 'warning');
        }

        let costInSoles = cost;
        let etiquetaMoneda = 'S/';
        if (esDolares) {
            costInSoles = cost * state.exchangeRate; 
            etiquetaMoneda = '$';
        }
        
        window.tempCompraItems.push({ 
            productId: parseInt(pId), 
            quantity: cant, 
            cost: costInSoles, 
            costoOriginal: cost, 
            monedaOriginal: etiquetaMoneda,
            name: name,
            manejaLote: manejaLote,
            loteNumber: manejaLote ? loteNum : null 
        });
        
        document.getElementById('c-lote').value = ''; 
        renderCompraTable();
    };

    window.removeCompraItem = (idx) => {
        window.tempCompraItems.splice(idx, 1);
        renderCompraTable();
    };

    window.renderCompraTable = () => {
        document.querySelector('#c-table tbody').innerHTML = window.tempCompraItems.map((i, idx) => `
            <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0">
                <td class="p-3 text-[#F8FAFC]">
                    ${i.name}
                    ${i.manejaLote && !i.loteNumber 
                        ? `<br><input type="text" placeholder="Escriba Lote..." class="mt-1 w-full max-w-[150px] text-[10px] font-mono rounded bg-red-500/10 border border-red-500/50 text-red-400 px-2 py-1 outline-none focus:border-red-400" onchange="window.tempCompraItems[${idx}].loteNumber = this.value; window.renderCompraTable();">` 
                        : (i.loteNumber ? `<br><span class="inline-block mt-1 text-[10px] font-bold text-emerald-900 bg-emerald-400 px-1.5 py-0.5 rounded">LOTE: ${i.loteNumber}</span>` : '')}
                </td>
                <td class="p-3 text-[#CBD5E1]">${i.quantity}</td>
                <td class="p-3 text-[#CBD5E1]">${i.monedaOriginal || 'S/'} ${(i.costoOriginal || i.cost).toFixed(2)}</td>
                <td class="p-3 text-[#F8FAFC] font-semibold">${formatMoney((i.quantity * i.cost))}</td>
                <td class="p-3 text-right">
                    <button type="button" class="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all" onclick="removeCompraItem(${idx})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        const total = window.tempCompraItems.reduce((s,i)=>s+(i.quantity*i.cost),0);
        document.getElementById('c-total').textContent = formatMoney(total);
    };

    document.getElementById('compra-form').addEventListener('submit', async e => {
        e.preventDefault();
        if(window.tempCompraItems.length===0) return Swal.fire('Error', 'La tabla de compra está vacía.', 'error');
        
        // Bloqueamos el Guardado si el usuario dejó lotes vacíos en la tabla (ej. por vincular una OC)
        const faltanLotes = window.tempCompraItems.some(i => i.manejaLote && !i.loteNumber);
        if (faltanLotes) {
            return Swal.fire('Error', 'Falta ingresar el número de Lote en algunos productos de la tabla. Por favor revise las cajas rojas.', 'error');
        }

        await api.savePurchase({
            orderId: parseInt(document.getElementById('c-order-link').value) || null,
            providerId: parseInt(document.getElementById('c-prov').value),
            nroFactura: document.getElementById('c-fac').value,
            date: document.getElementById('c-date').value,
            total: window.tempCompraItems.reduce((s,i)=>s+(i.quantity*i.cost),0),
            items: window.tempCompraItems
        });
        
        await Swal.fire({
            icon: 'success',
            title: 'Compra registrada',
            text: 'El stock y los lotes han sido ingresados al almacén correctamente.',
            confirmButtonColor: '#10B981',
            customClass: { popup: 'rounded-2xl bg-[#1E293B] text-[#F8FAFC] border border-[#334155]' }
        });
        navigate('purchases');
    });
}
window.openOCModal = () => {
    window.tempOCItems = [];
    showModal(`
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-900">Emitir Orden de Compra</h3>
                <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
            </div>
            
            <p class="text-xs text-slate-500 mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <i class="bi bi-info-circle text-blue-500 mr-1"></i> Cotiza con tu proveedor. Esto <strong>no aumenta</strong> el stock en el sistema hasta que se registre la compra real.
            </p>
            
            <form id="oc-form" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Proveedor</label>
                        <select id="oc-prov" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5" required>
                            <option value="">Seleccionar...</option>
                            ${window.comprasContext.provHtml}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Fecha Estimada</label>
                        <input type="date" id="oc-date" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Moneda de Cotización</label>
                        <select id="oc-moneda" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5" required>
                            <option value="PEN">Soles (PEN)</option>
                            <option value="USD">Dólares (USD)</option>
                        </select>
                    </div>
                </div>
                
                <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <h4 class="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Añadir Producto a Cotizar</h4>
                    <div class="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                        <div class="md:col-span-3">
                            <label class="block text-xs text-slate-500 mb-1">Producto</label>
                            <select id="oc-prod" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 py-2.5" onchange="document.getElementById('oc-cost').value = (this.options[this.selectedIndex].getAttribute('data-price') * 0.7).toFixed(2)">
                                ${window.comprasContext.prodHtml}
                            </select>
                        </div>
                        <div class="md:col-span-1">
                            <label class="block text-xs text-slate-500 mb-1">Cant.</label>
                            <input type="number" id="oc-cant" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 py-2.5" value="1" min="1">
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-xs text-slate-500 mb-1">Costo Est.</label>
                            <div class="flex gap-2">
                                <input type="number" id="oc-cost" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 py-2.5" step="0.01">
                                <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl transition-all font-bold" onclick="addOCItem()">
                                    <i class="bi bi-plus-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="overflow-x-auto rounded-xl border border-slate-100">
                    <table class="w-full text-left text-xs border-collapse" id="oc-table">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-150">
                                <th class="p-2.5 font-bold text-slate-600">Producto a Cotizar</th>
                                <th class="p-2.5 font-bold text-slate-600">Cant</th>
                                <th class="p-2.5 font-bold text-slate-600">Costo Est.</th>
                                <th class="p-2.5 font-bold text-slate-600">Subtotal</th>
                                <th class="p-2.5 font-bold text-slate-600 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            </tbody>
                    </table>
                </div>
                
                <div class="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div>
                        <span class="text-xs text-slate-500 uppercase tracking-wide block">Total Estimado (Soles)</span>
                        <span class="text-2xl font-bold text-slate-800" id="oc-total">S/ 0.00</span>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors" onclick="closeModal()">Cancelar</button>
                        <button type="submit" class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors">Emitir Orden de Compra</button>
                    </div>
                </div>
            </form>
        </div>
    `, 'max-w-4xl');

    // Disparar el primer precio al abrir
    setTimeout(() => {
        const firstProd = document.getElementById('oc-prod');
        if(firstProd && firstProd.options[0]) {
            document.getElementById('oc-cost').value = (firstProd.options[0].getAttribute('data-price') * 0.7).toFixed(2);
        }
    }, 100);

    window.addOCItem = () => {
        const pSel = document.getElementById('oc-prod');
        const pId = pSel.value;
        const name = pSel.options[pSel.selectedIndex].text;
        const cant = parseInt(document.getElementById('oc-cant').value);
        let costEst = parseFloat(document.getElementById('oc-cost').value); 
        
        const esDolares = document.getElementById('oc-moneda').value === 'USD';

        if(!pId || cant<=0 || isNaN(costEst) || costEst<=0) {
            return Swal.fire('Error', 'Por favor ingrese cantidad y costo válidos.', 'error');
        }
        
        let costInSoles = costEst;
        let etiqueta = 'S/';
        if (esDolares) {
            costInSoles = costEst * state.exchangeRate;
            etiqueta = '$';
        }
        
        // Fíjate que aquí NO pedimos lote, porque es una orden de compra, ¡no ha llegado nada aún!
        window.tempOCItems.push({ 
            productId: parseInt(pId), 
            quantity: cant, 
            cost: costInSoles, // guardado en soles
            costoOriginal: costEst, // lo que digitó el usuario
            monedaOriginal: etiqueta,
            name 
        });
        renderOCTable();
    };
    
    window.removeOCItem = (idx) => {
        window.tempOCItems.splice(idx, 1);
        renderOCTable();
    };

    window.renderOCTable = () => {
        document.querySelector('#oc-table tbody').innerHTML = window.tempOCItems.map((i, idx) => `
            <tr>
                <td class="p-2.5 font-medium text-slate-800">${i.name}</td>
                <td class="p-2.5 text-slate-600">${i.quantity}</td>
                <td class="p-2.5 text-slate-800">${i.monedaOriginal} ${i.costoOriginal.toFixed(2)}</td>
                <td class="p-2.5 text-slate-800 font-bold">${formatMoney((i.quantity * i.cost))}</td>
                <td class="p-2.5 text-right">
                    <button type="button" class="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" onclick="removeOCItem(${idx})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        const total = window.tempOCItems.reduce((s,i)=>s+(i.quantity*i.cost),0);
        document.getElementById('oc-total').textContent = formatMoney(total);
    };

    document.getElementById('oc-form').addEventListener('submit', async e => {
        e.preventDefault();
        if(window.tempOCItems.length===0) return Swal.fire('Error', 'La orden de compra está vacía.', 'error');
        await api.savePurchaseOrder({
            providerId: parseInt(document.getElementById('oc-prov').value),
            date: document.getElementById('oc-date').value,
            estimatedTotal: window.tempOCItems.reduce((s,i)=>s+(i.quantity*i.cost),0),
            items: window.tempOCItems
        });
        await Swal.fire({
            icon: 'success',
            title: 'Orden emitida',
            text: 'La orden de compra se guardó en estado PENDIENTE.',
            confirmButtonColor: '#3b82f6'
        });
        closeModal();
        navigate('purchases');
    });
};
window.renderCompras = renderCompras;
