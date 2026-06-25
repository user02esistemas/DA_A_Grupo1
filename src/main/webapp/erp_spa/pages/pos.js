function posNewSale() {
    state.cart = [];
    state.globalDiscount = 0;
    state.globalDiscountType = 'S/';
    state.posPayments = [];
    state.posInstallments = [];
    state.posCategoryFilter = 'Todos';
    state.posProductSearch = '';
    
    // Clear client fields in state
    const clientIdEl = document.getElementById('pos-client-id');
    if (clientIdEl) clientIdEl.value = '';
    
    const clientSelectedEl = document.getElementById('pos-client-selected');
    if (clientSelectedEl) clientSelectedEl.classList.add('hidden');
    
    const clientWrapperEl = document.getElementById('pos-client-wrapper');
    if (clientWrapperEl) clientWrapperEl.classList.remove('hidden');
    
    const clientSearchEl = document.getElementById('buscadorCliente');
    if (clientSearchEl) clientSearchEl.value = '';

    navigate('pos');
}
async function renderPOS(c) {
    state.caches.products = await api.getProducts();
    state.caches.clients = await api.getEntities(); 

    // Category calculation
    if (!state.posCategoryFilter) {
        state.posCategoryFilter = 'Todos';
    }
    const categories = ['Todos', ...new Set(state.caches.products.map(p => p.category))];
    const categoryPillsHtml = categories.map(cat => `
        <button class="px-4 py-2 rounded-xl font-semibold text-xs transition-all whitespace-nowrap border 
            ${state.posCategoryFilter === cat 
                ? 'bg-blue-600 text-[#F8FAFC] border-blue-600 shadow-sm shadow-blue-600/10 font-bold' 
                : 'bg-[#1E293B] border-[#334155] text-[#CBD5E1] hover:bg-[#334155]'}" 
            onclick="window.setPOSCategoryFilter('${cat}')">
            ${cat}
        </button>
    `).join('');

    // Product filtering
    if (!state.posProductSearch) {
        state.posProductSearch = '';
    }
    const filtered = state.caches.products.filter(p => {
        const matchCat = state.posCategoryFilter === 'Todos' || p.category === state.posCategoryFilter;
        const matchSearch = p.name.toLowerCase().includes(state.posProductSearch.toLowerCase()) || 
                            p.code.toLowerCase().includes(state.posProductSearch.toLowerCase());
        return p.stock > 0 && matchCat && matchSearch;
    });

    const prodsHtml = filtered.map(p => `
        <div class="bg-[#1E293B] rounded-2xl p-4 shadow-sm border border-[#334155] hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer relative group flex flex-col h-full" onclick="addToCart(${p.id})">
            <button class="absolute top-3 right-3 w-8 h-8 rounded-full bg-blue-600/20 text-[#3B82F6] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-blue-600 hover:text-[#F8FAFC]">
                <i class="bi bi-plus-lg text-sm font-bold"></i>
            </button>
            <div class="w-full aspect-square bg-[#111827] rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                ${p.image ? `<img src="${p.image}" class="w-full h-full object-cover">` : `<i class="bi bi-box-seam text-slate-500 text-4xl"></i>`}
            </div>
            <div class="flex-grow flex flex-col justify-between">
                <h4 class="font-semibold text-[#F8FAFC] text-sm mb-1 line-clamp-2">${p.name}</h4>
                <div class="mt-auto">
                    <p class="font-black text-[#3B82F6] text-lg">${window.formatMoney(p.price)}</p>
                    <div class="text-xs font-medium text-[#CBD5E1] mt-1 flex items-center gap-1">
                        <i class="bi bi-box2"></i> ${p.stock} disp.
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    const cartCategories = [...new Set(state.cart.map(i => i.product.category))];
    const recommended = state.caches.products.filter(p => p.stock>0 && (cartCategories.length===0 || cartCategories.includes(p.category))).slice(0, 3);
    const recHtml = recommended.map(p => `<span class="bg-blue-600/20 text-blue-400 font-semibold px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-blue-600/30 transition-colors" onclick="addToCart(${p.id})"><i class="bi bi-plus"></i> ${p.name}</span>`).join(' ');

    c.innerHTML = `
        <div class="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)] relative">
            <!-- Área Principal: Toolbar + Grid -->
            <div class="flex-1 flex flex-col min-w-0 bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden">
                
                <!-- Topbar POS -->
                <div class="p-4 border-b border-[#334155] flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#111827]">
                    <div class="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                        <button id="btnNuevaVenta" class="bg-blue-600 hover:bg-blue-700 text-[#F8FAFC] px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm shadow-blue-600/20" onclick="posNewSale()">
                            <i class="bi bi-plus-circle"></i> Nueva Venta
                        </button>
                        <button id="btnCotizar" class="bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap" onclick="generarCotizacion()">
                            <i class="bi bi-file-earmark-text"></i> Cotizar
                        </button>
                        <button class="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap" onclick="window.cargarCotizacionesModal()">
                            <i class="bi bi-folder-symlink"></i> Cargar Cotización
                        </button>
                        <button class="bg-[#1E293B] border border-[#334155] text-[#CBD5E1] hover:bg-[#334155] px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap" onclick="navigate('sales')">
                            <i class="bi bi-clock-history"></i> Historial
                        </button>
                    </div>
                    
                    <div class="relative w-full sm:max-w-xs" id="pos-client-wrapper">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i class="bi bi-search text-slate-400"></i>
                        </div>
                        <input type="text" id="buscadorCliente" class="w-full pl-10 pr-4 py-2 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm" placeholder="Buscar cliente..." autocomplete="off">
                        
                        <div id="pos-client-dropdown" class="absolute z-50 w-full mt-1 bg-[#1E293B] rounded-xl shadow-xl border border-[#334155] max-h-60 overflow-y-auto hidden"></div>
                    </div>
                </div>

                <!-- Barra de Búsqueda de Productos y Categorías -->
                <div class="px-5 py-3 border-b border-[#334155] flex flex-col md:flex-row gap-4 items-center justify-between bg-[#111827]/40">
                    <div id="listaCategorias" class="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto hide-scrollbar">
                        ${categoryPillsHtml}
                    </div>
                    <div class="relative w-full md:max-w-xs shrink-0">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i class="bi bi-search text-slate-400"></i>
                        </div>
                        <input type="text" id="pos-product-search" class="w-full pl-10 pr-4 py-1.5 rounded-xl border-[#334155] bg-[#1F2937] text-[#F8FAFC] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-xs" placeholder="Buscar producto en catálogo...">
                    </div>
                </div>

                <!-- Sugerencias -->
                <div class="px-5 py-2.5 border-b border-[#334155] flex items-center gap-3 overflow-x-auto hide-scrollbar">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <i class="bi bi-lightbulb-fill text-amber-400"></i> Sugeridos:
                    </span>
                    ${recHtml || '<span class="text-xs text-[#CBD5E1]">Agrega un producto para ver sugerencias</span>'}
                </div>

                <!-- Grid de Productos -->
                <div class="flex-1 p-5 overflow-y-auto bg-[#111827]/20 custom-scrollbar">
                    <div id="productosContainer" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        ${prodsHtml || '<div class="col-span-full text-center text-slate-400 p-8">No se encontraron productos en esta categoría o búsqueda</div>'}
                    </div>
                </div>
            </div>
            
            <!-- Panel Derecho: Carrito -->
            <div id="carritoContainer" class="w-full lg:w-[400px] flex flex-col bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden flex-shrink-0">
                <!-- Header Carrito -->
                <div class="p-4 border-b border-[#334155] bg-[#111827] text-[#F8FAFC]">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="font-bold text-lg flex items-center gap-2"><i class="bi bi-cart3 text-blue-400"></i> Carrito</h3>
                        <span id="pos-cart-count" class="bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm text-[#F8FAFC]">${state.cart.length} ítems</span>
                    </div>
                    
                    <input type="hidden" id="pos-client-id">
                    <div id="pos-client-selected" class="hidden bg-[#1E293B]/40 rounded-xl p-3 flex justify-between items-start backdrop-blur-sm border border-[#334155]">
                        <div>
                            <div class="text-[10px] uppercase font-bold tracking-wider text-blue-400 mb-0.5">Cliente Seleccionado</div>
                            <strong id="pos-client-name" class="block leading-tight text-sm text-[#F8FAFC]"></strong>
                            <small id="pos-client-doc" class="text-[#CBD5E1] text-xs"></small>
                        </div>
                        <button class="text-slate-400 hover:text-white transition-colors" onclick="clearClientPOS()">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Items Carrito -->
                <div class="flex-1 overflow-y-auto p-2 bg-[#111827]/50 custom-scrollbar" id="pos-items"></div>
                
                <!-- Resumen y Totales -->
                <div class="p-5 border-t border-[#334155] bg-[#1E293B]">
                    <div class="space-y-2 text-sm mb-4">
                        <div class="flex justify-between text-[#CBD5E1]">
                            <span>Subtotal</span>
                            <span class="font-semibold text-[#F8FAFC]" id="pos-sub">0.00</span>
                        </div>
                        
                        <div class="flex justify-between items-center text-[#CBD5E1]">
                            <span>Descuento Global</span>
                            <div class="flex items-center bg-[#1F2937] rounded-lg p-0.5 border border-[#334155]">
                                <input type="number" id="pos-desc" value="${state.globalDiscount}" min="0" class="w-16 bg-transparent border-none text-right py-1 text-sm font-semibold text-[#F8FAFC] focus:ring-0">
                                <select id="pos-desc-type" onchange="updGlobalDiscountType(this.value)" class="bg-transparent border-none py-1 pl-1 pr-6 text-sm font-bold text-blue-400 focus:ring-0 appearance-none cursor-pointer">
                                    <option value="S/" ${state.globalDiscountType==='S/'?'selected':''}>S/</option>
                                    <option value="%" ${state.globalDiscountType==='%'?'selected':''}>%</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="flex justify-between text-[#CBD5E1]">
                            <span>IGV (18%)</span>
                            <span class="font-semibold text-[#F8FAFC]" id="pos-igv">0.00</span>
                        </div>
                        
                        <div class="flex justify-between items-end pt-2 border-t border-[#334155] mt-2">
                            <span class="font-bold text-[#F8FAFC] text-lg">TOTAL</span>
                            <div class="text-right">
                                <span class="font-black text-[#3B82F6] text-2xl" id="pos-tot">0.00</span>
                                <div id="pos-tot-usd" class="text-xs text-slate-400 font-medium hidden"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Pagos Parciales Section -->
                    <div class="bg-[#111827] rounded-xl p-3 border border-[#334155] mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Pagos</span>
                            <button class="text-blue-400 hover:bg-blue-600/10 px-2 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1" onclick="addPaymentModal()">
                                <i class="bi bi-plus"></i> Agregar
                            </button>
                        </div>
                        <div id="pos-payments-list" class="space-y-1 mb-2"></div>
                        <div class="flex justify-between text-sm font-semibold text-emerald-400 mt-2">
                            <span>Pagado</span><span id="pos-paid" class="text-[#F8FAFC]">0.00</span>
                        </div>
                        <div class="flex justify-between text-sm font-bold text-amber-400 mt-1">
                            <span>Saldo</span><span id="pos-balance" class="text-[#F8FAFC]">0.00</span>
                        </div>
                        <div id="pos-installments-btn" class="hidden mt-3">
                            <button class="w-full py-2 border-2 border-dashed border-amber-500/50 text-amber-400 bg-amber-600/10 hover:bg-amber-600/20 rounded-xl text-sm font-bold transition-colors" onclick="openInstallmentsModal()">
                                Generar Cuotas (Crédito)
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-[1fr_2fr] gap-2">
                        <select id="pos-doc" class="bg-[#1F2937] border border-[#334155] rounded-xl text-[#F8FAFC] font-semibold focus:ring-2 focus:ring-blue-500">
                            <option>Boleta</option>
                            <option>Factura</option>
                        </select>
                        <button id="btnConfirmarVenta" class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex justify-center items-center gap-2" onclick="checkout(false)">
                            <i class="bi bi-check-circle-fill"></i> Emitir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Advanced Autocomplete Logic using `#buscadorCliente`
    const searchInput = document.getElementById('buscadorCliente');
    const dropdown = document.getElementById('pos-client-dropdown');
    let searchResults = [];
    let selectedIndex = -1;

    const renderResults = () => {
        if(searchResults.length === 0) { 
            dropdown.innerHTML = `<div class="p-4 text-center text-sm text-slate-500">No se encontraron clientes. <a href="#" onclick="navigate('entities')" class="text-blue-600 font-semibold hover:underline">Crear nuevo</a></div>`; 
        } else {
            dropdown.innerHTML = searchResults.map((c, i) => `
                <div class="p-3 border-b border-slate-50 last:border-0 cursor-pointer transition-colors flex flex-col ${i === selectedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}" onclick="selectClientPOS(${c.id}, '${c.name.replace(/'/g, "\\'")}', '${c.docType}', '${c.document}')">
                    <strong class="text-sm line-clamp-1">${c.name}</strong>
                    <small class="text-xs ${i === selectedIndex ? 'text-blue-500' : 'text-slate-400'}">${c.docType}: ${c.document}</small>
                </div>
            `).join('');
        }
        dropdown.classList.remove('hidden');
    };

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const text = this.value.toLowerCase().trim();
            selectedIndex = -1;
            if (text.length < 2) { dropdown.classList.add('hidden'); return; }
            searchResults = state.caches.clients.filter(c => c.type === 'CLIENTE' && (c.name.toLowerCase().includes(text) || c.document.includes(text))).slice(0, 5);
            renderResults();
        });

        searchInput.addEventListener('keydown', function(e) {
            if(dropdown.classList.contains('hidden') || searchResults.length === 0) return;
            if(e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % searchResults.length;
                renderResults();
            } else if(e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = selectedIndex - 1 < 0 ? searchResults.length - 1 : selectedIndex - 1;
                renderResults();
            } else if(e.key === 'Enter') {
                e.preventDefault();
                if(selectedIndex >= 0) {
                    const c = searchResults[selectedIndex];
                    selectClientPOS(c.id, c.name, c.docType, c.document);
                } else if(searchResults.length > 0) {
                    const c = searchResults[0];
                    selectClientPOS(c.id, c.name, c.docType, c.document);
                }
            } else if(e.key === 'Escape') {
                dropdown.classList.add('hidden');
            }
        });
    }

    document.addEventListener('click', e => { 
        if(!e.target.closest('#pos-client-wrapper')) {
            if(dropdown) dropdown.classList.add('hidden'); 
        }
    });

    // Product search input key listener
    const pSearchInput = document.getElementById('pos-product-search');
    if (pSearchInput) {
        pSearchInput.value = state.posProductSearch;
        pSearchInput.addEventListener('input', e => {
            state.posProductSearch = e.target.value;
            window.renderPOS(c); // Re-render POS
            // Refocus search input to keep typing experience fluent
            setTimeout(() => {
                const psi = document.getElementById('pos-product-search');
                if (psi) {
                    psi.focus();
                    psi.setSelectionRange(psi.value.length, psi.value.length);
                }
            }, 10);
        });
    }

    document.getElementById('pos-desc').addEventListener('input', e => { aplicarDescuentoGlobal(e.target.value, null); });
    updateCartUI();
}
function calcularSubtotalProducto(item) {
    let p = item.price || item.product.price;
    if (item.priceVariant === 'Mayorista') p = item.product.priceMayorista || p;
    if (item.priceVariant === 'Distribuidor') p = item.product.priceDistribuidor || p;
    item.price = p; // Ensure updated
    
    let base = p * item.quantity;
    if (item.discountType === '%') {
        return Math.max(0, base - (base * (item.discount / 100)));
    } else {
        return Math.max(0, base - item.discount);
    }
}
function addToCart(productId) {
    const p = state.caches.products.find(x => x.id === productId);
    if (!p) return;
    if (p.stock <= 0) return alert('Sin stock disponible');
    
    const exist = state.cart.find(i => i.product.id === productId);
    if (exist) {
        if (exist.quantity + 1 > p.stock) return alert('Stock insuficiente');
        exist.quantity += 1;
    } else {
        state.cart.push({
            product: p,
            quantity: 1,
            price: p.price,
            priceVariant: 'Minorista',
            discount: 0,
            discountType: 'S/'
        });
    }
    updateCartUI();
}
function updCart(productId, field, value) {
    const item = state.cart.find(i => i.product.id === productId);
    if (!item) return;
    
    if (field === 'qty') {
        item.quantity += value;
        if (item.quantity <= 0) {
            state.cart = state.cart.filter(i => i.product.id !== productId);
        } else if (item.quantity > item.product.stock) {
            item.quantity = item.product.stock;
            alert('Stock insuficiente');
        }
    } else if (field === 'priceVariant') {
        item.priceVariant = value;
    }
    updateCartUI();
}
function aplicarDescuentoProducto(productId, val, type) {
    const item = state.cart.find(i => i.product.id === productId);
    if (!item) return;
    if (val !== null) item.discount = parseFloat(val) || 0;
    if (type !== null) item.discountType = type;
    updateCartUI();
}
function aplicarDescuentoGlobal(val, type) {
    if (val !== null) state.globalDiscount = parseFloat(val) || 0;
    if (type !== null) state.globalDiscountType = type;
    updateCartUI();
}
function updGlobalDiscountType(type) {
    state.globalDiscountType = type;
    updateCartUI();
}
function selectClientPOS(id, name, docType, doc) {
    const idInput = document.getElementById('pos-client-id');
    if (idInput) idInput.value = id;

    const nameText = document.getElementById('pos-client-name');
    if (nameText) nameText.textContent = name;

    const docText = document.getElementById('pos-client-doc');
    if (docText) docText.textContent = `${docType}: ${doc}`;

    const clientSelected = document.getElementById('pos-client-selected');
    if (clientSelected) clientSelected.classList.remove('hidden');

    const clientWrapper = document.getElementById('pos-client-wrapper');
    if (clientWrapper) clientWrapper.classList.add('hidden');

    const dropdown = document.getElementById('pos-client-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
}
function clearClientPOS() {
    const idInput = document.getElementById('pos-client-id');
    if (idInput) idInput.value = '';

    const clientSelected = document.getElementById('pos-client-selected');
    if (clientSelected) clientSelected.classList.add('hidden');

    const clientWrapper = document.getElementById('pos-client-wrapper');
    if (clientWrapper) clientWrapper.classList.remove('hidden');

    const clientSearchInput = document.getElementById('buscadorCliente');
    if (clientSearchInput) clientSearchInput.value = '';
}
function generarCotizacion() {
    checkout(true);
}
function setPOSCategoryFilter(cat) {
    state.posCategoryFilter = cat;
    renderPOS(document.getElementById('main-area'));
}
function cargarCotizacionesModal() {
    const cotizaciones = window.MOCK_DB.proformas || [];
    const rows = cotizaciones.map(c => `
        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer" onclick="window.cargarCotizacionAlCarrito(${c.id})">
            <td class="p-3 font-bold text-slate-800">${c.correlative}</td>
            <td class="p-3 text-slate-600">${c.date}</td>
            <td class="p-3 font-medium text-slate-700">${c.clientId ? (state.caches.clients.find(x => x.id === c.clientId)?.name || 'Cliente') : 'Cliente Mostrador'}</td>
            <td class="p-3 font-black text-blue-600 text-right">${formatMoney(c.total)}</td>
        </tr>
    `).join('');

    showModal(`
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-900"><i class="bi bi-folder-symlink mr-2 text-blue-600"></i> Cargar Cotización al POS</h3>
                <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
            </div>
            
            <p class="text-slate-500 text-sm mb-4">Selecciona una cotización activa para cargar su cliente y productos al carrito de compras.</p>
            
            <div class="table-responsive max-h-80 overflow-y-auto custom-scrollbar">
                <table class="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200 sticky top-0">
                            <th class="p-3 font-semibold text-slate-500">Cotización</th>
                            <th class="p-3 font-semibold text-slate-500">Fecha</th>
                            <th class="p-3 font-semibold text-slate-500">Cliente</th>
                            <th class="p-3 font-semibold text-slate-500 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${rows || '<tr><td colspan="4" class="p-8 text-center text-slate-400">No hay cotizaciones registradas en el sistema.</td></tr>'}
                    </tbody>
                </table>
            </div>
            
            <div class="flex justify-end mt-6">
                <button class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors" onclick="closeModal()">Cancelar</button>
            </div>
        </div>
    `, 'max-w-3xl');
}
function cargarCotizacionAlCarrito(proformaId) {
    const proforma = window.MOCK_DB.proformas.find(x => x.id === proformaId);
    if (!proforma) return Swal.fire({ icon: 'error', title: 'Error', text: 'Cotización no encontrada' });

    state.cart = JSON.parse(JSON.stringify(proforma.items));
    state.globalDiscount = proforma.discount || 0;
    state.globalDiscountType = proforma.discountType || 'S/';

    if (proforma.clientId) {
        const client = state.caches.clients.find(c => c.id === proforma.clientId);
        if (client) {
            selectClientPOS(client.id, client.name, client.docType, client.document);
        }
    } else {
        clearClientPOS();
    }

    closeModal();
    updateCartUI();
    Swal.fire({
        icon: 'success',
        title: 'Cotización Cargada',
        text: 'La cotización se ha cargado con éxito al POS.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
}
function updateCartUI() {
    const countBadge = document.getElementById('pos-cart-count');
    if(countBadge) countBadge.textContent = `${state.cart.length} ítems`;

    const cont = document.getElementById('pos-items'); if(!cont) return;
    
    if (state.cart.length === 0) {
        cont.innerHTML = `
            <div class="flex flex-col items-center justify-center text-slate-500 p-8 h-full">
                <i class="bi bi-cart-x text-5xl mb-4 opacity-50"></i>
                <p class="font-medium text-[#CBD5E1]">El carrito está vacío</p>
                <p class="text-xs mt-1 text-slate-500">Selecciona productos del catálogo</p>
            </div>
        `;
    } else {
        cont.innerHTML = state.cart.map(i => {
            const itemTotal = window.calcularSubtotalProducto(i);
            return `
            <div class="bg-[#1E293B] rounded-xl p-3 shadow-sm border border-[#334155] mb-2 relative group">
                <button class="absolute -right-2 -top-2 w-6 h-6 bg-red-955 text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 hover:text-[#F8FAFC] z-10" onclick="updCart(${i.product.id}, 'qty', -${i.quantity})" title="Eliminar ítem">
                    <i class="bi bi-x text-sm"></i>
                </button>
                
                <h5 class="text-sm font-bold text-[#F8FAFC] pr-4 line-clamp-2 leading-tight mb-2">${i.product.name}</h5>
                
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-1 bg-[#1F2937] p-1 rounded-lg border border-[#334155]">
                        <select onchange="updCart(${i.product.id}, 'priceVariant', this.value)" class="text-xs border-none bg-transparent py-0.5 pl-1 pr-6 text-[#CBD5E1] font-semibold focus:ring-0 cursor-pointer">
                            <option value="Minorista" ${i.priceVariant==='Minorista'?'selected':''}>Min.</option>
                            <option value="Mayorista" ${i.priceVariant==='Mayorista'?'selected':''}>May.</option>
                            <option value="Distribuidor" ${i.priceVariant==='Distribuidor'?'selected':''}>Dist.</option>
                        </select>
                        <span class="text-xs font-black text-[#3B82F6] pr-1">${formatMoney(i.price)}</span>
                    </div>
                </div>

                <div class="flex justify-between items-end">
                    <div class="flex items-center bg-[#1F2937] rounded-lg p-0.5 border border-[#334155]">
                        <button class="w-7 h-7 flex items-center justify-center text-[#CBD5E1] hover:bg-[#334155] hover:text-[#3B82F6] rounded-md transition-colors" onclick="updCart(${i.product.id}, 'qty', -1)"><i class="bi bi-dash"></i></button>
                        <span class="w-8 text-center text-sm font-bold text-[#F8FAFC]">${i.quantity}</span>
                        <button class="w-7 h-7 flex items-center justify-center text-[#CBD5E1] hover:bg-[#334155] hover:text-[#3B82F6] rounded-md transition-colors" onclick="updCart(${i.product.id}, 'qty', 1)"><i class="bi bi-plus"></i></button>
                    </div>
                    
                    <span class="font-black text-[#F8FAFC] text-base">${formatMoney(itemTotal)}</span>
                </div>
                
                <div class="mt-2 pt-2 border-t border-[#334155] flex items-center gap-2">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Desc:</span>
                    <div class="flex items-center bg-[#1F2937] rounded text-xs border border-[#334155] flex-1">
                        <input type="number" value="${i.discount}" min="0" step="1" onchange="aplicarDescuentoProducto(${i.product.id}, this.value, null)" class="w-full bg-transparent border-none text-right py-0.5 text-[#F8FAFC] font-medium focus:ring-0">
                        <select onchange="aplicarDescuentoProducto(${i.product.id}, null, this.value)" class="bg-transparent border-none py-0.5 pl-1 pr-5 text-[#CBD5E1] font-bold focus:ring-0 appearance-none cursor-pointer">
                            <option value="S/" ${i.discountType==='S/'?'selected':''}>S/</option>
                            <option value="%" ${i.discountType==='%'?'selected':''}>%</option>
                        </select>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    const sub = state.cart.reduce((s, i) => s + window.calcularSubtotalProducto(i), 0);
    
    if (state.globalDiscountType === 'S/' && state.globalDiscount > sub) {
        state.globalDiscount = sub;
        const descInput = document.getElementById('pos-desc');
        if (descInput) descInput.value = state.globalDiscount;
    }

    const gd = state.globalDiscountType === '%' ? sub * (state.globalDiscount/100) : state.globalDiscount;
    const subDesc = Math.max(0, sub - gd);
    const igv = subDesc * 0.18;
    const tot = subDesc + igv;

    document.getElementById('pos-sub').textContent = formatMoney(sub);
    document.getElementById('pos-igv').textContent = formatMoney(igv);
    document.getElementById('pos-tot').textContent = formatMoney(tot);

    const usdEl = document.getElementById('pos-tot-usd');
    if (usdEl) {
        if (state.displayCurrency === 'USD') {
            usdEl.innerHTML = `&approx; ${formatUSD(tot)} USD`;
            usdEl.classList.remove('hidden');
        } else {
            usdEl.classList.add('hidden');
        }
    }

    // Payments Logic
    let totalPaid = state.posPayments.reduce((s,p) => s + p.amount, 0);
    let balance = Math.max(0, tot - totalPaid);
    
    document.getElementById('pos-paid').textContent = formatMoney(totalPaid);
    document.getElementById('pos-balance').textContent = formatMoney(balance);
    
    const payList = document.getElementById('pos-payments-list');
    payList.innerHTML = state.posPayments.map((p, idx) => `
        <div class="flex justify-between items-center text-xs bg-white p-1.5 rounded-lg border border-slate-100">
            <span class="font-medium text-slate-600">${p.method}</span>
            <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800">${formatMoney(p.amount)}</span>
                <button onclick="removePayment(${idx})" class="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"><i class="bi bi-x"></i></button>
            </div>
        </div>
    `).join('');

    if (balance > 0 && tot > 0) {
        document.getElementById('pos-installments-btn').classList.remove('hidden');
    } else {
        document.getElementById('pos-installments-btn').classList.add('hidden');
    }
}
function addPaymentModal() {
    const tot = parseFloat(document.getElementById('pos-tot').textContent.replace(/[^\d.-]/g, ''));
    const paid = state.posPayments.reduce((s,p) => s + p.amount, 0);
    const pending = Math.max(0, tot - paid);
    showModal(`
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-900">Agregar Pago</h3>
                <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Método de Pago</label>
                    <select id="pay-method" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5">
                        <option>Efectivo</option><option>Tarjeta de Crédito</option><option>Tarjeta de Débito</option><option>Yape/Plin</option><option>Transferencia</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Monto (S/)</label>
                    <input type="number" id="pay-amount" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5 font-bold text-lg text-blue-600" value="${pending.toFixed(2)}" step="0.01" min="0.01">
                </div>
            </div>
            <div class="flex justify-end mt-6 gap-3">
                <button class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors" onclick="closeModal()">Cancelar</button>
                <button class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors" onclick="confirmAddPayment()">Guardar Pago</button>
            </div>
        </div>
    `, 'max-w-md');
}
function confirmAddPayment() {
    const m = document.getElementById("pay-method").value;
    const a = parseFloat(document.getElementById("pay-amount").value);
    if(a > 0) {
        state.posPayments.push({ method: m, amount: a });
        closeModal();
        updateCartUI();
    }
}
function removePayment(idx) { 
    state.posPayments.splice(idx, 1); 
    updateCartUI(); 
}
function openInstallmentsModal() {
    const tot = parseFloat(document.getElementById("pos-tot").textContent.replace(/[^\d.-]/g, ""));
    const paid = state.posPayments.reduce((s,p) => s + p.amount, 0);
    const pending = Math.max(0, tot - paid);
    
    showModal(`
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-900">Generar Cuotas</h3>
                <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
            </div>
            
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p class="text-amber-800 text-sm font-medium">Saldo a financiar: <strong class="text-amber-900 text-lg ml-1">${window.formatMoney(pending)}</strong></p>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Número de Cuotas</label>
                    <input type="number" id="inst-count" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5" value="1" min="1">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Frecuencia</label>
                    <select id="inst-freq" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5">
                        <option value="30">Mensual (30 días)</option>
                        <option value="15">Quincenal (15 días)</option>
                        <option value="7">Semanal (7 días)</option>
                    </select>
                </div>
            </div>
            
            <button class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors mb-4" onclick="generateInstallments()">
                <i class="bi bi-calculator"></i> Calcular Cuotas
            </button>
            
            <div id="inst-preview" class="max-h-60 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl"></div>
            
            <div class="flex justify-end mt-6 gap-3">
                <button class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors" onclick="confirmInstallments()">Confirmar Cuotas</button>
            </div>
        </div>
    `, "max-w-md");
}
function generateInstallments() {
    const tot = parseFloat(document.getElementById("pos-tot").textContent.replace(/[^\d.-]/g, ""));
    const paid = state.posPayments.reduce((s,p) => s + p.amount, 0);
    const pending = Math.max(0, tot - paid);
    const count = parseInt(document.getElementById("inst-count").value);
    const freq = parseInt(document.getElementById("inst-freq").value);
    
    state.posInstallments = [];
    const amountPerInst = pending / count;
    let baseDate = new Date();
    
    for(let i=1; i<=count; i++) {
        baseDate.setDate(baseDate.getDate() + freq);
        state.posInstallments.push({ dueDate: baseDate.toISOString().split("T")[0], amount: amountPerInst });
    }
    
    const preview = document.getElementById("inst-preview");
    preview.innerHTML = `
        <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-500 sticky top-0">
                <tr><th class="p-2 font-semibold">N°</th><th class="p-2 font-semibold">Vencimiento</th><th class="p-2 font-semibold text-right">Monto (S/)</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                ${state.posInstallments.map((x,i) => `
                <tr class="hover:bg-slate-50">
                    <td class="p-2 text-slate-400 font-medium">${i+1}</td>
                    <td class="p-2">
                        <input type="date" value="${x.dueDate}" onchange="state.posInstallments[${i}].dueDate=this.value" class="text-sm rounded border-slate-200 py-1 px-2 focus:ring-blue-500 focus:border-blue-500">
                    </td>
                    <td class="p-2 text-right">
                        <input type="number" value="${x.amount.toFixed(2)}" step="0.01" onchange="state.posInstallments[${i}].amount=parseFloat(this.value)" class="text-sm rounded border-slate-200 py-1 px-2 text-right w-24 focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-700">
                    </td>
                </tr>`).join("")}
            </tbody>
        </table>
    `;
}
function confirmInstallments() { 
    closeModal(); 
    Swal.fire({icon: "success", title: "Cuotas generadas", toast: true, position: "top-end", showConfirmButton: false, timer: 3000}); 
}
async function checkout(isProforma) {
    if(state.cart.length === 0) return Swal.fire({icon: "error", title: "Carrito vacío", text: "El carrito está vacío"});
    const clientId = document.getElementById("pos-client-id").value;
    if(!clientId && !isProforma) return Swal.fire({icon: "error", title: "Cliente requerido", text: "Debe buscar y seleccionar un cliente para generar una venta válida."});

    const totalStr = document.getElementById("pos-tot").textContent;
    const tot = parseFloat(totalStr.replace(/[^\d.-]/g, ""));
    
    let finalPayments = [...state.posPayments];
    if (!isProforma && finalPayments.length === 0 && state.posInstallments.length === 0) {
        finalPayments.push({ method: "Efectivo", amount: tot });
    }
    const paid = finalPayments.reduce((s,p) => s + p.amount, 0);
    
    if(!isProforma && state.posInstallments.length === 0 && Math.abs(tot - paid) > 0.05) {
        return Swal.fire({icon: "warning", title: "Pago incompleto", text: "El total pagado no cubre el monto total. Genere cuotas para el saldo pendiente o agregue más pagos."});
    }

    const payload = {
        cliente: { idEntidad: parseInt(clientId) },
        usuario: { idEntidad: state.user ? state.user.idEntidad : 1 }, // Asumiendo que el usuario está en estado
        tipo_comprobante: isProforma ? "Proforma" : document.getElementById("pos-doc").value,
        total: tot,
        fecha_emision: new Date(),
        detalle: state.cart.map(item => ({
            producto: { id_producto: item.product.id },
            lote: item.product.manejaLote ? { id_lote: item.product.loteId } : null,
            cantidad: item.quantity,
            precio_unitario: item.price,
            descuento_prod: item.discountType === '%' ? item.discount / 100 : 0,
            sub_total: window.calcularSubtotalProducto(item)
        }))
    };

    const pagoInicial = finalPayments.length > 0 ? {
        metodo: { idMetodoPago: 1 }, // Asumiendo 1 = Efectivo
        monto_total: finalPayments[0].amount,
        referencia: "Pago inicial POS"
    } : null;

    const res = await api.saveSale(payload, pagoInicial);
    
    Swal.fire({
        icon: 'success',
        title: 'Venta Procesada',
        text: res.message,
        confirmButtonColor: '#10B981'
    });

    posNewSale();
}

// Global scope registration for backward compatibility
window.posNewSale = posNewSale;
window.renderPOS = renderPOS;
window.addToCart = addToCart;
window.updCart = updCart;
window.aplicarDescuentoProducto = aplicarDescuentoProducto;
window.aplicarDescuentoGlobal = aplicarDescuentoGlobal;
window.updGlobalDiscountType = updGlobalDiscountType;
window.selectClientPOS = selectClientPOS;
window.clearClientPOS = clearClientPOS;
window.generarCotizacion = generarCotizacion;
window.setPOSCategoryFilter = setPOSCategoryFilter;
window.cargarCotizacionesModal = cargarCotizacionesModal;
window.cargarCotizacionAlCarrito = cargarCotizacionAlCarrito;
window.updateCartUI = updateCartUI;
window.calcularSubtotalProducto = calcularSubtotalProducto;
window.addPaymentModal = addPaymentModal;
window.confirmAddPayment = confirmAddPayment;
window.removePayment = removePayment;
window.openInstallmentsModal = openInstallmentsModal;
window.generateInstallments = generateInstallments;
window.confirmInstallments = confirmInstallments;
window.checkout = checkout;
