
// =========================================================
// 1. FUNCIONES AUXILIARES GLOBALES
// =========================================================

function comboHtml(id, placeholder) {
    return `
        <div class="relative">
            <div class="relative">
                <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input type="text" id="${id}-input" autocomplete="off" placeholder="${placeholder}" class="w-full pl-9 rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all py-2.5 outline-none" />
            </div>
            <input type="hidden" id="${id}">
            <div id="${id}-list" class="hidden absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg"></div>
        </div>
    `;
}

const activeCombos = new Map();
let comboOutsideClickBound = false;

function setupCombo(id, items, onSelect) {
    const input = document.getElementById(id + '-input');
    const hidden = document.getElementById(id);
    const list = document.getElementById(id + '-list');
    if (!input || !hidden || !list) return;

    activeCombos.set(id, { input, list });

    function renderList(filter) {
        const f = (filter || '').toLowerCase().trim();
        const filtered = f ? items.filter(it => it.searchText.toLowerCase().includes(f)) : items;
        if (!filtered.length) {
            list.innerHTML = `<div class="px-3 py-2 text-sm text-slate-400">Sin resultados</div>`;
        } else {
            list.innerHTML = filtered.slice(0, 40).map(it => `
                <div class="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer" data-id="${it.id}">${it.label}</div>
            `).join('');
        }
        list.classList.remove('hidden');
    }

    input.addEventListener('focus', () => renderList(input.value));
    input.addEventListener('input', () => {

        // Cualquier edición de texto invalida el id seleccionado, para
        // evitar que se guarde un id "viejo" que ya no corresponde al
        // texto visible (bug que tenía la versión anterior).

        hidden.value = '';
        renderList(input.value);
    });

    list.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const row = e.target.closest('[data-id]');
        if (!row) return;
        const item = items.find(it => String(it.id) === row.dataset.id);
        if (!item) return;
        input.value = item.label;
        hidden.value = item.id;
        list.classList.add('hidden');
        if (onSelect) onSelect(item);
    });

    if (!comboOutsideClickBound) {
        comboOutsideClickBound = true;
        document.addEventListener('click', (e) => {
            activeCombos.forEach(({ input, list }) => {
                if (document.body.contains(list) && !list.contains(e.target) && e.target !== input) {
                    list.classList.add('hidden');
                }
            });
        });
    }
}

function sumItemsTotal(items) {
    return items.reduce((s, i) => s + (getItemCantidad(i) * getItemCosto(i)), 0);
}

function toSoles(amount, currency) {
    return currency === 'USD' ? amount * state.exchangeRate : amount;
}

function currencyLabel(currency) {
    return currency === 'USD' ? '$' : 'S/';
}

function kpiCard(label, value, valueClass) {
    return `
        <div class="bg-[#1E293B] rounded-2xl border border-[#334155] p-4">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">${label}</span>
            <span class="text-2xl font-black ${valueClass || 'text-[#F8FAFC]'}">${value}</span>
        </div>
    `;
}

function isThisMonth(d) {
    if (!d) return false;
    const dt = new Date(d);
    const now = new Date();
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
}

function getItemCantidad(i) {
    return i.dto.cantidadPedida ?? i.dto.cantidad ?? 0;
}
function getItemCosto(i) {
    return i.dto.precio_costo_unitario ?? i.dto.precioUnitarioPactado ?? 0;
}



function statusBadge(status) {
    const map = {
        PENDIENTE: ['bg-amber-500/20 text-amber-400 border border-amber-500/30', 'bg-amber-500'],
        APROBADA: ['bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', 'bg-emerald-500'],
        CANCELADA: ['bg-red-500/20 text-red-400 border border-red-500/30', 'bg-red-500']

    };
    const [b, dot] = map[status] || map.PENDIENTE;
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${b}"><span class="w-1.5 h-1.5 rounded-full ${dot}"></span>${status}</span>`;
}

function renderFilterableTable({ tbodyId, data, search, matches, expandedSet, emptyMessage, rowHtml, detailHtml, getId }) {
    const s = (search || '').toLowerCase();
    const filtered = data.filter(item => !s || matches(item, s));

    const tbody = document.getElementById(tbodyId);
    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-500">${emptyMessage}</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(item => {
        const id = getId(item);
        const expanded = expandedSet.has(id);
        return `
            ${rowHtml(item, expanded)}
            ${expanded ? `<tr class="bg-[#111827]/60 border-b border-[#334155]"><td colspan="6" class="p-4">${detailHtml(item)}</td></tr>` : ''}
        `;
    }).join('');
}


// ===========================
// 2. MODAL REGISTRAR COMPRA 
// ============================

window.openCompraModal = () => {
    window.compraModalState = {
        tempItems: [],
        currentProduct: null
    };

    showModal(`
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-900">Registrar Compra Real (Recepción)</h3>
                <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
            </div>
            <form id="compra-form" class="space-y-4">
                <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <label class="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Vincular a OC Pendiente (Opcional)</label>
                    ${comboHtml('c-order-link', 'Buscar OC pendiente por N° o proveedor...')}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Proveedor</label>
                        ${comboHtml('c-prov', 'Buscar por nombre o documento...')}
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Factura N°</label>
                        <input type="text" id="c-fac" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 py-2.5 outline-none px-3" required placeholder="001-00021">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Fecha Factura</label>
                        <input type="date" id="c-date" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 py-2.5 outline-none px-3" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Moneda</label>
                        <select id="c-moneda" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 py-2.5 outline-none px-3" required>
                            <option value="PEN">Soles (PEN)</option>
                            <option value="USD">Dólares (USD)</option>
                        </select>
                    </div>
                </div>
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 class="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Agregar Producto</h4>
                    <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        <div class="md:col-span-2">
                            <label class="block text-sm font-semibold text-slate-700 mb-1">Producto</label>
                            ${comboHtml('c-prod', 'Buscar por código o nombre...')}
                        </div>
                        <div id="c-lote-container" class="hidden md:col-span-1">
                            <label class="block text-sm font-bold text-emerald-600 mb-1"><i class="bi bi-layers"></i> N° Lote</label>
                            <input type="text" id="c-lote" class="w-full rounded-xl border-emerald-400 bg-white py-2.5 outline-none font-mono text-sm px-2" placeholder="Lote...">
                        </div>
                        <div class="md:col-span-1">
                            <label class="block text-sm font-semibold text-slate-700 mb-1">Cant. Real</label>
                            <input type="number" id="c-cant" class="w-full rounded-xl border-slate-200 bg-white py-2.5 outline-none px-3" value="1" min="1">
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-semibold text-slate-700 mb-1">Costo U. Real</label>
                            <div class="flex gap-2">
                                <input type="number" id="c-cost" class="w-full rounded-xl border-slate-200 bg-white py-2.5 outline-none px-3" step="0.01" placeholder="0.00">
                                <button type="button" class="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap" onclick="window.addCompraItemModal()">
                                    <i class="bi bi-plus-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="overflow-x-auto rounded-xl border border-slate-100">
                    <table class="w-full text-left border-collapse" id="c-table">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-150">
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Producto / Lote</th>
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Cant</th>
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Costo U.</th>
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Subtotal</th>
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100"></tbody>
                    </table>
                </div>
                <div class="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                    <div>
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total de Compra (Soles)</span>
                        <span class="text-2xl font-black text-emerald-600" id="c-total">S/ 0.00</span>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors" onclick="closeModal()">Cancelar</button>
                        <button type="submit" class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors flex items-center gap-2">
                            <i class="bi bi-box-arrow-in-down"></i> Ingresar al Almacén
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `, 'max-w-4xl');

    const cLoteContainer = document.getElementById('c-lote-container');
    const cLoteInput = document.getElementById('c-lote');
    const cCostInput = document.getElementById('c-cost');


    setupCombo('c-order-link', window.comprasContext?.ocItems || [], () => window.linkOCModal());

    setupCombo('c-prov', window.comprasContext?.proveedoresItems || []);
    setupCombo('c-prod', window.comprasContext?.productosItems || [], (item) => {
        window.compraModalState.currentProduct = item;
        if (cCostInput) {
            cCostInput.value = '';
            cCostInput.focus();
        }
        if (cLoteContainer && cLoteInput) {
            if (item.manejaLote) {
                cLoteContainer.classList.remove('hidden');
            } else {
                cLoteContainer.classList.add('hidden');
                cLoteInput.value = '';
            }
        }
    });

    window.linkOCModal = async (orders, prods) => {
        const ocId = document.getElementById('c-order-link').value;
        if (!ocId) return;


        const ocCompleta = await api.getPurchaseOrderById(ocId)
        if (!ocCompleta) return;

        const providerId = ocCompleta.proveedor.idEntidad;  

        const provItem = window.comprasContext.proveedoresItems.find(p => p.id === providerId);
        document.getElementById('c-prov').value = providerId ?? '';
        if (provItem) document.getElementById('c-prov-input').value = provItem.label;


        window.compraModalState.tempItems = ocCompleta.detalles.map(i => {
            const prodId = i.producto.id_producto;
            const cantidad = i.cantidadPedida;
            const costo = i.precioUnitarioPactado;
            return {

                 dto: {
                    producto: { id_producto: prodId },
                    lote: { numero_lote: null },
                    cantidad: cantidad,
                    precio_costo_unitario: costo
                },
                costoOriginal: costo,
                monedaOriginal: 'S/',
                nombre: i.producto.nombre_descripcion,
                manejaLote: !!i.producto.maneja_lote,
                subTotal: cantidad * costo,

            };
        });
        renderCompraTable();
    };

    window.addCompraItemModal = () => {
        const item = window.compraModalState.currentProduct;
        const cant = parseInt(document.getElementById('c-cant').value);
        let cost = parseFloat(document.getElementById('c-cost').value);
        const loteNum = document.getElementById('c-lote').value.trim();
        const moneda = document.getElementById('c-moneda').value;

        if (!item || cant <= 0 || isNaN(cost) || cost <= 0) {
            return Swal.fire('Error', 'Por favor seleccione un producto e ingrese una cantidad y un costo unitario válido.', 'error');
        }

        if (item.manejaLote && !loteNum) {
            return Swal.fire('Atención', 'Este producto requiere registrar un Número de Lote para ingresar al almacén.', 'warning');
        }

        const costInSoles = toSoles(cost, moneda);
        let subTotalLinea = parseFloat(cant * costInSoles);

        window.compraModalState.tempItems.push({
            dto: {
                producto: {
                    id_producto: parseInt(item.id),
                },
                lote:{
                    numero_lote : item.manejaLote ? loteNum : null
                },
                cantidad: cant,
                precio_costo_unitario: costInSoles,

            },  
            costoOriginal: cost,
            monedaOriginal: currencyLabel(moneda),
            nombre: item.label,
            manejaLote: item.manejaLote,
            subTotal: subTotalLinea
        });

        document.getElementById('c-lote').value = '';
        renderCompraTable();
    };

    window.removeCompraItem = (idx) => {
        window.compraModalState.tempItems.splice(idx, 1);
        renderCompraTable();
    };

    window.renderCompraTable = () => {
        document.querySelector('#c-table tbody').innerHTML = window.compraModalState.tempItems.map((i, idx) => `
            <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                <td class="p-3 text-slate-800">
                    ${i.nombre}
                    ${i.manejaLote && !i.dto.lote.numero_lote
                        ? `<br><input type="text" placeholder="Escriba Lote..." class="mt-1 w-full max-w-[150px] text-[10px] font-mono rounded bg-red-50 border border-red-300 text-red-600 px-2 py-1 outline-none focus:border-red-400" onchange="window.compraModalState.tempItems[${idx}].dto.lote.numero_lote = this.value; window.renderCompraTable();">`
                        : (i.dto.lote.numero_lote ? `<br><span class="inline-block mt-1 text-[10px] font-bold text-emerald-900 bg-emerald-200 px-1.5 py-0.5 rounded">LOTE: ${i.dto.lote.numero_lote}</span>` : '')}
                </td>
                <td class="p-3 text-slate-600">${i.dto.cantidad}</td>
                <td class="p-3 text-slate-600">${i.monedaOriginal || 'S/'} ${(i.costoOriginal ?? i.dto.precio_costo_unitario).toFixed(2)}</td>
                <td class="p-3 text-slate-800 font-semibold">${formatMoney(i.subTotal)}</td>
                <td class="p-3 text-right">
                    <button type="button" class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all" onclick="removeCompraItem(${idx})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        document.getElementById('c-total').textContent = formatMoney(sumItemsTotal(window.compraModalState.tempItems));
    };

    document.getElementById('compra-form').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-hourglass-split animate-spin"></i> Procesando...';

        if (window.compraModalState.tempItems.length === 0) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = originalText;
            return Swal.fire('Error', 'La tabla de compra está vacía.', 'error');
        }


        const faltanLotes = window.compraModalState.tempItems.some(i => i.manejaLote && !i.dto.lote.numero_lote);

        if (faltanLotes) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = originalText;
            return Swal.fire('Error', 'Falta ingresar el número de Lote en algunos productos de la tabla. Por favor revise las cajas rojas.', 'error');
        }

        try {
            

            const calculado = sumItemsTotal(window.compraModalState.tempItems);
            console.log("Monto Total a enviar:", calculado);

            await api.savePurchase({
                orden:{
                    idOrden: parseInt(document.getElementById('c-order-link').value) || null
                },
                proveedor: {
                    idEntidad: parseInt(document.getElementById('c-prov').value)
                },
                usuario: { idUsuario: state.user ? state.user.idUsuario : null },
                tipoComprobante : "Factura",
                serieCorrelativa: document.getElementById('c-fac').value,
                fechaCompra: document.getElementById('c-date').value,
                montoTotal: sumItemsTotal(window.compraModalState.tempItems),
                detallesCom: window.compraModalState.tempItems.map(i => i.dto)
            });
            await Swal.fire({
                icon: 'success',
                title: 'Compra registrada',
                text: 'El stock y los lotes han sido ingresados al almacén correctamente.',
                confirmButtonColor: '#10B981'
            });
            closeModal();
            navigate('purchases');
        } catch (error) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = originalText;
            Swal.fire('Error', 'Hubo un problema al guardar la compra.', 'error');
        }
    });
};

// =========================================================
// 3. MODAL ORDEN DE COMPRA (Global e Independiente)
// =========================================================
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
                        ${comboHtml('oc-prov', 'Buscar por nombre o documento...')}
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Fecha Estimada</label>
                        <input type="date" id="oc-date" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 py-2.5 px-3" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Moneda de Cotización</label>
                        <select id="oc-moneda" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 py-2.5 px-3" required>
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
                            ${comboHtml('oc-prod', 'Buscar por código o nombre...')}
                        </div>
                        <div class="md:col-span-1">
                            <label class="block text-xs text-slate-500 mb-1">Cant.</label>
                            <input type="number" id="oc-cant" class="w-full rounded-xl border-slate-200 bg-white py-2.5 px-3" value="1" min="1">
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-xs text-slate-500 mb-1">Costo Est.</label>
                            <div class="flex gap-2">
                                <input type="number" id="oc-cost" class="w-full rounded-xl border-slate-200 bg-white py-2.5 px-3" step="0.01" placeholder="0.00">
                                <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl transition-all font-bold" onclick="window.addProductoOc()">
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
                        <tbody class="divide-y divide-slate-100"></tbody>
                    </table>
                </div>
                <div class="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div>
                        <span class="text-xs text-slate-500 uppercase tracking-wide block">Total Estimado (Soles)</span>
                        <span class="text-2xl font-bold text-slate-800" id="oc-total">$S/ 0.00</span>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors" onclick="closeModal()">Cancelar</button>
                        <button type="submit" class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors">Emitir Orden de Compra</button>
                    </div>
                </div>
            </form>
        </div>
    `, 'max-w-4xl');

    setupCombo('oc-prov', window.comprasContext.proveedoresItems);
    setupCombo('oc-prod', window.comprasContext.productosItems, (item) => {
        window.productoSeleccionado = item;
        document.getElementById('oc-cost').value = '';
        document.getElementById('oc-cost').focus();
    });

    window.addProductoOc = () => {
        const item = window.productoSeleccionado;
        const cant = parseInt(document.getElementById('oc-cant').value);
        let costEst = parseFloat(document.getElementById('oc-cost').value);
        const moneda = document.getElementById('oc-moneda').value;

        if (!item || cant <= 0 || isNaN(costEst) || costEst <= 0) {
            return Swal.fire('Error', 'Por favor seleccione un producto e ingrese cantidad y costo válidos.', 'error');
        }

        const costInSoles = toSoles(costEst, moneda);

        window.tempOCItems.push({
            costoOriginal: costEst,
            monedaOriginal: currencyLabel(moneda),
            nombre: item.label,
            dto: {
                producto: {
                    id_producto:  parseInt(item.id),
                },
                cantidadPedida: cant,
                precioUnitarioPactado: costInSoles
            }
        });
        renderOCTable();
    };

    window.removeProductoOc = (idx) => {
        window.tempOCItems.splice(idx, 1);
        renderOCTable();
    };

    window.renderOCTable = () => {
        document.querySelector('#oc-table tbody').innerHTML = window.tempOCItems.map((i, idx) => `
            <tr>
                <td class="p-2.5 font-medium text-slate-800">${i.nombre}</td>
                <td class="p-2.5 text-slate-600">${i.dto.cantidadPedida}</td>
                <td class="p-2.5 text-slate-800">${i.monedaOriginal} ${i.costoOriginal.toFixed(2)}</td>
                <td class="p-2.5 text-slate-800 font-bold">${formatMoney(i.dto.cantidadPedida * i.dto.precioUnitarioPactado)}</td>
                <td class="p-2.5 text-right">
                    <button type="button" class="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" onclick="removeProductoOc(${idx})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        document.getElementById('oc-total').textContent = formatMoney(sumItemsTotal(window.tempOCItems));
    };

    document.getElementById('oc-form').addEventListener('submit', async e => {
        e.preventDefault();
        if (window.tempOCItems.length === 0) {
            return Swal.fire('Error', 'La orden de compra está vacía.', 'error');
        }
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-hourglass-split animate-spin"></i> Emitiendo...';

        try {
            await api.savePurchaseOrder({
                proveedor: { idEntidad: parseInt(document.getElementById('oc-prov').value) },
                usuario: { idUsuario: api.getUsuarioId()},
                fechaEntrega: document.getElementById('oc-date').value,
                totalEstimado: sumItemsTotal(window.tempOCItems),
                detalles: window.tempOCItems.map(i => i.dto)
            });
            await Swal.fire({
                icon: 'success',
                title: 'Orden emitida',
                text: 'La orden de compra se guardó en estado PENDIENTE.',
                confirmButtonColor: '#3b82f6'
            });
            closeModal();
            navigate('purchases');
        } catch (error) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = originalText;
            Swal.fire('Error', 'Hubo un problema al emitir la orden.', 'error');
        }
    });
};

// =========================================================
// 4. VISTA PRINCIPAL (renderCompras)
// =========================================================
async function renderCompras(c) {

    const [entidades, productos, compras, ordenes, ordenesPendientesLista] = await Promise.all([
        api.getEntities(),
        api.getProducts(),
        api.getPurchases(),
        api.getPurchaseOrders(),
        api.getPendingPurchaseOrders()

    ]);

    const proveedores = entidades.filter(entidad => entidad.nombreTipoEntidad === 'PROVEEDOR');
    const proveedoresItems = proveedores.map(p => ({
        id: p.idEntidad,
        label: `${p.tipoDocumento ?? ''} ${p.numeroDocumento ?? ''} - ${p.nombre_RazonSocial ?? 'Proveedor sin nombre'}`,
        searchText: `${p.tipoDocumento ?? ''} ${p.numeroDocumento ?? ''} ${p.nombre_RazonSocial ?? ''}`
    }));

    const productosItems = productos.map(producto => ({
        id: producto.id_producto,
        label: `${producto.codigo_unico ?? 's/c'} - ${producto.nombre_descripcion ?? 'Producto sin nombre'}`,
        searchText: `${producto.codigo_unico ?? ''} ${producto.nombre_descripcion ?? ''}`,
        manejaLote: !!producto.maneja_lote
    }));


    const ordenesPendientes = ordenes.filter(o => o.estado?.nombreEstado === 'PENDIENTE');

    const ocItems = ordenesPendientesLista.map(o => {    
        return {
            id: o.idOrden,
            label: `OC ${o.idOrden} - ${o.proveedor.nombre_RazonSocial}`,
            searchText: `${o.idOrden}  ${o.proveedor.nombre_RazonSocial}`

        };
    });

   
    window.comprasContext = { proveedoresItems, productosItems, ocItems, ordersRef: ordenes, prodsRef: productos };

    const totalEstimadoPendiente = ordenesPendientes.reduce((s, o) => s + o.totalEstimado, 0);
    const comprasEsteMes = compras.filter(cm => isThisMonth(cm.fechaCompra));
    const totalCompradoEsteMes = comprasEsteMes.reduce((s, cm) => s + cm.montoTotal, 0);


    window.estadoVistaCompras = {
        activeTab: 'oc',
        busquedaOC: '',
        filtroEstadoOC: '',
        busquedaCR: '',
        ocsExpandidas: new Set(),
        crsExpandidas: new Set()
    };

    c.innerHTML = `
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4" data-aos="fade-down">
            <div>
                <h2 class="text-2xl font-bold text-[#F8FAFC] tracking-tight">Gestión de Compras y Abastecimiento</h2>
                <p class="text-sm text-[#CBD5E1] mt-1">Registra facturas reales de compra o genera cotizaciones/órdenes de compra (OC).</p>
            </div>
            <div class="flex gap-2">
                <button class="bg-emerald-600 hover:bg-emerald-700 text-[#F8FAFC] px-4 py-2 rounded-xl font-semibold shadow-sm transition-all flex items-center gap-2" onclick="openCompraModal()">
                    <i class="bi bi-box-arrow-in-down"></i> Registrar Compra
                </button>
                <button class="bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-[#F8FAFC] px-4 py-2 rounded-xl font-semibold shadow-sm transition-all flex items-center gap-2" onclick="openOCModal()">
                    <i class="bi bi-file-earmark-plus"></i> Generar Orden de Compra (OC)
                </button>
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6" data-aos="fade-up">

            ${kpiCard('OCs pendientes', ordenesPendientes.length)}
            ${kpiCard('Total estimado pendiente', formatMoney(totalEstimadoPendiente))}
            ${kpiCard('Compras este mes', comprasEsteMes.length)}
            ${kpiCard('Total comprado este mes', formatMoney(totalCompradoEsteMes), 'text-emerald-400')}
        </div>
        <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden" data-aos="fade-up">
            <div class="flex border-b border-[#334155] px-2">
                <button id="tab-btn-oc" class="px-4 py-3 text-sm font-bold border-b-2 border-emerald-500 text-[#F8FAFC] transition-colors" onclick="switchComprasTab('oc')">
                    Órdenes de Compra
                </button>
                <button id="tab-btn-cr" class="px-4 py-3 text-sm font-bold border-b-2 border-transparent text-slate-400 hover:text-[#F8FAFC] transition-colors" onclick="switchComprasTab('cr')">
                    Compras Registradas
                </button>
            </div>
            <div class="p-4 flex flex-col sm:flex-row gap-3">
                <div class="relative flex-1">
                    <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                    <input type="text" id="compras-search-input" placeholder="Buscar por N° o proveedor..." class="w-full pl-9 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all py-2.5 outline-none" oninput="onComprasSearchInput(this.value)">
                </div>
                <select id="compras-status-filter" class="rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all py-2.5 outline-none" onchange="onComprasStatusFilter(this.value)">
                    <option value="">Todos los estados</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="APROBADA">Aprobada</option>

                    <option value="CANCELADA">Cancelada</option>

                </select>
            </div>
            <div id="tab-panel-oc" class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-[#111827] border-b border-[#334155]">
                            <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">OC N°</th>
                            <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Proveedor</th>
                            <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Fecha</th>
                            <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Total</th>
                            <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Estado</th>
                            <th class="p-3 w-8"></th>
                        </tr>
                    </thead>
                    <tbody id="oc-history-tbody" class="divide-y divide-[#334155]"></tbody>
                </table>
            </div>
            <div id="tab-panel-cr" class="overflow-x-auto hidden">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-[#111827] border-b border-[#334155]">
                            <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Factura</th>
                            <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Proveedor</th>
                            <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Fecha</th>
                            <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Total</th>
                            <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Estado</th>
                            <th class="p-3 w-8"></th>
                        </tr>
                    </thead>
                    <tbody id="cr-history-tbody" class="divide-y divide-[#334155]"></tbody>
                </table>
            </div>
        </div>
    `;


    function renderOCHistory() {
        const st = window.estadoVistaCompras;
        const base = ordenes.filter(o => !st.filtroEstadoOC || o.estado.nombreEstado === st.filtroEstadoOC);
        renderFilterableTable({
            tbodyId: 'oc-history-tbody',
            data: base,
            search: st.busquedaOC,

            matches: (o, s) =>{
                const idStr = String(o.idOrden ?? o.id ?? '').toLowerCase();
                const razonSocial = (o.proveedor?.nombre_RazonSocial || '').toLowerCase();
                return idStr.includes(s) || razonSocial.includes(s);
            },
            expandedSet: st.ocsExpandidas,
            emptyMessage: 'No hay OCs que coincidan.',
            getId: (o) => o.idOrden ?? o.id,
            rowHtml: (o, expanded) => {
                const estado = o.estado?.nombreEstado ?? 'PENDIENTE';
                return `
                    <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0">
                        <td class="p-4 whitespace-nowrap font-medium text-[#F8FAFC]">${o.idOrden ?? o.id}</td>
                        <td class="p-4 whitespace-nowrap text-[#CBD5E1]">${o.proveedor?.nombre_RazonSocial ?? 'N/A'}</td>
                        <td class="p-4 whitespace-nowrap text-[#CBD5E1]">${o.fecha ?? o.fechaEntrega ?? ''}</td>
                        <td class="p-4 whitespace-nowrap text-[#F8FAFC] font-bold">${formatMoney(o.totalEstimado ?? 0)}</td>
                        <td class="p-4 whitespace-nowrap">${statusBadge(estado)}</td>
                        <td class="p-4 whitespace-nowrap text-right">
                            <div class="flex items-center justify-end gap-1">
                                <button type="button" class="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="Ver detalle" onclick="viewOrdenDetalle(${o.idOrden ?? o.id})">
                                    <i class="bi bi-eye"></i>
                                </button>
                                ${estado === 'PENDIENTE' ? `
                                <button type="button" class="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Rechazar orden" onclick="rechazarOrdenCompra(${o.idOrden ?? o.id}, 5)">
                                    <i class="bi bi-x-circle"></i>
                                </button>` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            },
            detailHtml: () => ''
        });
    }

    window.viewOrdenDetalle = async (idOrden) => {
        const orden = await api.getPurchaseOrderById(idOrden);
        if (!orden) {
            return Swal.fire('Error', 'No se pudo cargar el detalle de la orden.', 'error');
        }

        const detallesHtml = (orden.detalles || []).map(d => `
            <tr class="border-b border-slate-100 last:border-0">
                <td class="p-3 text-slate-800">${d.producto?.nombre_descripcion ?? `Producto #${d.producto?.id_producto}`}</td>
                <td class="p-3 text-slate-600">${d.cantidadPedida}</td>
                <td class="p-3 text-slate-600">${formatMoney(d.precioUnitarioPactado)}</td>
                <td class="p-3 text-slate-800 font-semibold">${formatMoney(d.cantidadPedida * d.precioUnitarioPactado)}</td>
            </tr>
        `).join('');

        showModal(`
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-slate-900">Detalle de OC #${orden.idOrden}</h3>
                    <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div><span class="block text-slate-500 text-xs uppercase font-bold mb-1">Proveedor</span><span class="text-slate-800 font-semibold">${orden.proveedor?.nombre_RazonSocial ?? 'N/A'}</span></div>
                    <div><span class="block text-slate-500 text-xs uppercase font-bold mb-1">Fecha</span><span class="text-slate-800 font-semibold">${orden.fecha ? new Date(orden.fecha).toLocaleDateString() : ''}</span></div>
                    <div><span class="block text-slate-500 text-xs uppercase font-bold mb-1">Estado</span>${statusBadge(orden.estado?.nombreEstado ?? 'PENDIENTE')}</div>
                </div>
                <div class="overflow-x-auto rounded-xl border border-slate-100">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-150">
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Producto</th>
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Cant.</th>
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Costo U.</th>
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${detallesHtml || `<tr><td colspan="4" class="p-4 text-center text-slate-500">Sin productos.</td></tr>`}
                        </tbody>
                    </table>
                </div>
                <div class="flex justify-end items-center border-t border-slate-100 pt-4 mt-4">
                    <div class="text-right">
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Estimado</span>
                        <span class="text-2xl font-black text-slate-800">${formatMoney(orden.totalEstimado ?? 0)}</span>
                    </div>
                </div>
            </div>
        `, 'max-w-3xl');
    };


    window.rechazarOrdenCompra = async (idOrden, idEstado) => {
        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: '¿Rechazar esta orden?',
            text: 'La orden pasará a estado RECHAZADA y ya no podrá vincularse a una compra.',
            showCancelButton: true,
            confirmButtonText: 'Sí, rechazar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444'
        });
        if (!confirmacion.isConfirmed) return;

        try {
            await api.rejectPurchaseOrder(idOrden, idEstado);
            await Swal.fire('Rechazada', 'La orden de compra fue rechazada.', 'success');
            navigate('purchases');
        } catch (error) {
            Swal.fire('Error', 'No se pudo rechazar la orden.', 'error');
        }
    };

    function renderCRHistory() {
        const st = window.estadoVistaCompras;
        renderFilterableTable({
            tbodyId: 'cr-history-tbody',
            data: compras,
            search: st.busquedaCR,

            matches: (cm, s) =>{
                const serieCorrelativa = (cm.serieCorrelativa || '').toLowerCase();
                const razonSocial = (cm.proveedor?.nombre_RazonSocial || '').toLowerCase();
                return serieCorrelativa.includes(s) || razonSocial.includes(s);
            },
            expandedSet: st.crsExpandidas,
            emptyMessage: 'No hay compras que coincidan.',
            getId: (cm) => cm.idCompra,
            rowHtml: (o, expanded) => `
                <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0">
                    <td class="p-4 whitespace-nowrap font-medium text-[#F8FAFC]">${o.serieCorrelativa ?? 'N/A'}</td>
                    <td class="p-4 whitespace-nowrap text-[#CBD5E1]">${o.proveedor?.nombre_RazonSocial ?? 'N/A' }</td>
                    <td class="p-4 whitespace-nowrap text-[#CBD5E1]">${o.fechaCompra ?? ''}</td>
                    <td class="p-4 whitespace-nowrap text-[#F8FAFC] font-bold">${formatMoney(o.montoTotal ?? 0)}</td>

                    <td class="p-4 whitespace-nowrap">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Ingresado
                        </span>
                    </td>

                    <td class="p-4 whitespace-nowrap text-right">
                        <button type="button" class="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="Ver detalle" onclick="viewCompraDetalle(${o.idCompra})">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `,
            detailHtml: () => ''
        });
    }

    window.viewCompraDetalle = async (idCompra) => {
        const compra = await api.getPurchaseById(idCompra);
        if (!compra) {
            return Swal.fire('Error', 'No se pudo cargar el detalle de la compra.', 'error');
        }

        const detallesHtml = (compra.detallesCom || []).map(d => `
            <tr class="border-b border-slate-100 last:border-0">
                <td class="p-3 text-slate-800">${d.producto?.nombre_descripcion ?? 'Producto'}${d.lote?.numero_lote ? ` &middot; Lote: ${d.lote.numero_lote}` : ''}</td>
                <td class="p-3 text-slate-600">${d.cantidad}</td>
                <td class="p-3 text-slate-600">${formatMoney(d.precio_costo_unitario)}</td>
                <td class="p-3 text-slate-800 font-semibold">${formatMoney(d.cantidad * d.precio_costo_unitario)}</td>
            </tr>
        `).join('');

        showModal(`
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-slate-900">Detalle de Compra FAC-${compra.serieCorrelativa}</h3>
                    <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div><span class="block text-slate-500 text-xs uppercase font-bold mb-1">Proveedor</span><span class="text-slate-800 font-semibold">${compra.proveedor?.nombre_RazonSocial ?? 'N/A'}</span></div>
                    <div><span class="block text-slate-500 text-xs uppercase font-bold mb-1">Fecha</span><span class="text-slate-800 font-semibold">${compra.fechaCompra ? new Date(compra.fechaCompra).toLocaleDateString() : ''}</span></div>
                    <div><span class="block text-slate-500 text-xs uppercase font-bold mb-1">Total</span><span class="text-slate-800 font-semibold">${formatMoney(compra.montoTotal ?? 0)}</span></div>
                </div>
                <div class="overflow-x-auto rounded-xl border border-slate-100">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-150">
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Producto</th>
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Cant.</th>
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Costo U.</th>
                                <th class="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${detallesHtml || `<tr><td colspan="4" class="p-4 text-center text-slate-500">Sin productos.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        `, 'max-w-3xl');
    };

    window.switchComprasTab = (tab) => {
        window.estadoVistaCompras.activeTab = tab;
        const isOC = tab === 'oc';
        document.getElementById('tab-panel-oc').classList.toggle('hidden', !isOC);
        document.getElementById('tab-panel-cr').classList.toggle('hidden', isOC);
        document.getElementById('tab-btn-oc').classList.toggle('border-emerald-500', isOC);
        document.getElementById('tab-btn-oc').classList.toggle('text-[#F8FAFC]', isOC);
        document.getElementById('tab-btn-oc').classList.toggle('border-transparent', !isOC);
        document.getElementById('tab-btn-oc').classList.toggle('text-slate-400', !isOC);
        document.getElementById('tab-btn-cr').classList.toggle('border-emerald-500', !isOC);
        document.getElementById('tab-btn-cr').classList.toggle('text-[#F8FAFC]', !isOC);
        document.getElementById('tab-btn-cr').classList.toggle('border-transparent', isOC);
        document.getElementById('tab-btn-cr').classList.toggle('text-slate-400', isOC);

        const searchInput = document.getElementById('compras-search-input');
        const statusFilter = document.getElementById('compras-status-filter');
        searchInput.value = isOC ? window.estadoVistaCompras.busquedaOC : window.estadoVistaCompras.busquedaCR;
        searchInput.placeholder = isOC ? 'Buscar por N° OC o proveedor...' : 'Buscar por N° Factura o proveedor...';
        statusFilter.classList.toggle('hidden', !isOC);
    };

    window.onComprasSearchInput = (value) => {
        if (window.estadoVistaCompras.activeTab === 'oc') {
            window.estadoVistaCompras.busquedaOC = value;
            renderOCHistory();
        } else {
            window.estadoVistaCompras.busquedaCR = value;
            renderCRHistory();
        }
    };

    window.onComprasStatusFilter = (value) => {
        window.estadoVistaCompras.filtroEstadoOC = value;
        renderOCHistory();
    };

    window.toggleHistoryRow = (type, id) => {
        const set = type === 'OC' ? window.estadoVistaCompras.ocsExpandidas : window.estadoVistaCompras.crsExpandidas;
        set.has(id) ? set.delete(id) : set.add(id);
        type === 'OC' ? renderOCHistory() : renderCRHistory();
    };

    renderOCHistory();
    renderCRHistory();
}

window.renderCompras = renderCompras;