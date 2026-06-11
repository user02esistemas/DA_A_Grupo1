async function renderInventario(c) {
    const prods = await api.getProducts();
    state.caches.products = prods;
    const rows = prods.map(p => `
        <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0">
            <td class="p-4 whitespace-nowrap">
                <strong class="text-[#F8FAFC]">${p.code}</strong><br>
                <small class="text-[#CBD5E1]"><i class="bi bi-barcode"></i> ${p.barcode || 'S/B'}</small>
            </td>
            <td class="p-4">
                <strong class="text-[#F8FAFC]">${p.name}</strong><br>
                <small class="text-[#CBD5E1]">${p.category}</small>
            </td>
            <td class="p-4 whitespace-nowrap text-[#F8FAFC] font-medium">${formatMoney(p.price)}</td>
            <td class="p-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${p.stock <= p.minStock ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
                    ${p.stock} ${p.unit}
                </span>
                ${p.manejaLote ? '<br><span class="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] border border-blue-500/30 font-bold"><i class="bi bi-layers-half"></i> Lotes</span>' : ''}
            </td>
            <td class="p-4 whitespace-nowrap text-[#CBD5E1]">${p.procesoSoldadura || 'N/A'}</td>
            <td class="p-4 whitespace-nowrap text-right">
                <button class="p-2 text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#334155] rounded-lg transition-colors" onclick="openProductModal(${p.id})" title="Editar">
                    <i class="bi bi-pencil-square text-lg"></i>
                </button>
                ${p.manejaLote ? `
                    <button class="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded-lg transition-colors ml-1" onclick="openLotesModal(${p.id}, '${p.name.replace(/'/g, "\\'")}')" title="Ver Lotes">
                        <i class="bi bi-boxes text-lg"></i>
                    </button>
                ` : ''}
                <button class="p-2 text-sky-400 hover:text-sky-300 hover:bg-sky-600/20 rounded-lg transition-colors ml-1" onclick="openKardexModal(${p.id})" title="Kardex">
                    <i class="bi bi-file-earmark-spreadsheet text-lg"></i>
                </button>
            </td>
        </tr>
    `).join('');

    c.innerHTML = `
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4" data-aos="fade-down">
            <div>
                <h2 class="text-2xl font-bold text-[#F8FAFC] tracking-tight">Inventario y Catálogo</h2>
                <p class="text-sm text-[#CBD5E1] mt-1">Administración del catálogo de productos, trazabilidad por lotes e historial de Kardex.</p>
            </div>
            <div class="flex gap-2">
                <button class="bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-[#CBD5E1] px-4 py-2 rounded-xl font-semibold shadow-sm transition-all flex items-center gap-2" onclick="api.getProducts().then(d => exportToCSV(d, 'inventario.csv'))">
                    <i class="bi bi-download"></i> Exportar
                </button>
                <label class="bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-[#CBD5E1] px-4 py-2 rounded-xl font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                    <i class="bi bi-upload"></i> Importar CSV
                    <input type="file" accept=".csv" style="display:none;" onchange="importProductsCSV(event)">
                </label>
                <button class="bg-blue-600 hover:bg-blue-700 text-[#F8FAFC] px-4 py-2 rounded-xl font-semibold shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2" onclick="openProductModal()">
                    <i class="bi bi-plus-lg"></i> Nuevo Producto
                </button>
            </div>
        </div>

        <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden" data-aos="fade-up">
            <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-[#111827] border-b border-[#334155]">
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Código / Barras</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Producto / Categoría</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Precio</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Stock</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Proceso Soldadura</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#334155]">
                        ${rows || '<tr><td colspan="6" class="p-12 text-center text-[#CBD5E1]"><i class="bi bi-inbox text-3xl opacity-50 block mb-2"></i>No hay productos registrados en el inventario.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

window.openProductModal = (id = null) => {
    // Si hay un ID, buscamos el producto. Si no, creamos un objeto vacío.
    const p = id ? state.caches.products.find(x => x.id === id) : { 
        code: '', barcode: '', name: '', category: '', unit: '', 
        price: 0, priceMayorista: 0, priceDistribuidor: 0, 
        stock: 0, minStock: 0, manejaLote: false, 
        procesoSoldadura: '', amperaje: '', materialBase: '', 
        image: '', requiresCert: false 
    };
    
    if (id && !p) {
        return Swal.fire('Error', 'No se encontró el producto en la caché.', 'error');
    }

    const isNew = !id;
    
    showModal(`
        <div class="p-6 text-slate-800">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-900">${id ? 'Editar' : 'Nuevo'} Maestro de Producto</h3>
                <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
            </div>
            
            <form id="prod-form" class="space-y-4">
                <input type="hidden" id="p-id" value="${id || ''}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5"><i class="bi bi-info-circle-fill"></i> Datos Principales</h4>
                            
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-1">Nombre del Producto</label>
                                <input type="text" id="p-name" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 py-2 px-3" value="${p.name}" required>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 mb-1">Código Único</label>
                                    <input type="text" id="p-code" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 py-2 px-3 font-mono" value="${p.code}" required>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 mb-1">Código de Barras</label>
                                    <input type="text" id="p-barcode" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 py-2 px-3" value="${p.barcode||''}">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
                                    <input type="text" id="p-cat" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 py-2 px-3" value="${p.category}" list="cat-list" autocomplete="off" required>
                                    <datalist id="cat-list">${MOCK_DB.categories.map(c => `<option value="${c}">${c}</option>`).join('')}</datalist>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 mb-1">Unidad de Medida</label>
                                    <input type="text" id="p-unit" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 py-2 px-3" value="${p.unit}" list="unit-list" autocomplete="off" required>
                                    <datalist id="unit-list">${MOCK_DB.units.map(u => `<option value="${u}">${u}</option>`).join('')}</datalist>
                                </div>
                            </div>
                        </div>

                        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5"><i class="bi bi-tag-fill"></i> Precios y Stock</h4>
                            <div class="grid grid-cols-3 gap-2">
                                <div>
                                    <label class="block text-[10px] font-semibold text-slate-600 mb-1">P. Minorista</label>
                                    <input type="number" step="0.01" id="p-price" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 py-1.5 px-3" value="${p.price}" required>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-semibold text-slate-600 mb-1">P. Mayorista</label>
                                    <input type="number" step="0.01" id="p-price-may" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 py-1.5 px-3" value="${p.priceMayorista || p.price}" required>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-semibold text-slate-600 mb-1">P. Distribuidor</label>
                                    <input type="number" step="0.01" id="p-price-dist" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 py-1.5 px-3" value="${p.priceDistribuidor || p.price}" required>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 mb-1">Stock Mínimo</label>
                                    <input type="number" id="p-min" class="w-full rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 py-2 px-3" value="${p.minStock}" required>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 mb-1">Stock Actual</label>
                                    <input type="number" id="p-stock" class="w-full rounded-xl border-slate-200 bg-white py-2 px-3 disabled:bg-slate-100 disabled:text-slate-500" value="${p.stock}" ${!isNew ? 'disabled' : ''} ${isNew && p.manejaLote ? 'disabled' : ''}>
                                    <small id="stock-lote-msg" class="${isNew && p.manejaLote ? '' : 'hidden'} text-[10px] text-slate-500 mt-1 block">Gestionado por lotes/compras</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5"><i class="bi bi-image-fill"></i> Imagen del Producto</h4>
                            <div class="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-100/50 transition-colors cursor-pointer relative overflow-hidden" id="img-drop-zone" style="min-height: 120px;">
                                <input type="file" id="p-img-file" accept="image/jpeg, image/png" style="display:none">
                                <div class="space-y-1 relative z-10" id="img-dz-content">
                                    <i class="bi bi-cloud-arrow-up text-3xl text-slate-400"></i>
                                    <p class="text-xs text-slate-600">Clic para cambiar imagen</p>
                                </div>
                                <img class="absolute inset-0 w-full h-full object-contain bg-white rounded-2xl ${p.image ? '' : 'hidden'}" id="img-preview" src="${p.image||''}">
                                <input type="hidden" id="p-img-data" value="${p.image||''}">
                            </div>
                        </div>

                        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5"><i class="bi bi-shield-fill-check"></i> Certificación y Lotes</h4>
                            
                            <div class="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-150">
                                <span class="text-xs font-semibold text-slate-700">Maneja Lote</span>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="p-lote" onchange="toggleLoteSection(); toggleStockPorLote()" class="sr-only peer" ${p.manejaLote ? 'checked' : ''}>
                                    <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            
                            <div id="lote-section" class="${p.manejaLote ? '' : 'hidden'} p-3 rounded-xl bg-blue-50 border border-blue-150 space-y-2">
                                <p class="text-[11px] text-slate-600 font-medium">
                                    <i class="bi bi-info-circle-fill text-blue-500 mr-1"></i>
                                    Este producto requiere trazabilidad. Los lotes se gestionarán en Compras o en el Módulo de Lotes.
                                </p>
                            </div>

                            <div class="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-150">
                                <span class="text-xs font-semibold text-slate-700">Requiere Certificado</span>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="p-cert" onchange="toggleCertSection()" class="sr-only peer" ${p.requiresCert ? 'checked' : ''}>
                                    <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>
                            
                            <div id="cert-section" class="${p.requiresCert ? '' : 'hidden'} p-3 rounded-xl bg-amber-50 border border-amber-150 space-y-2">
                                <p class="text-[11px] text-slate-600 font-medium">
                                    <i class="bi bi-shield-check text-amber-600 mr-1"></i>
                                    Se exigirá documento PDF del certificado al ingresar mercadería.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-1.5">
                        <i class="bi bi-save"></i> ${isNew ? 'Guardar Producto' : 'Actualizar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    `, 'max-w-4xl');

    window.toggleLoteSection = () => {
        const checked = document.getElementById('p-lote').checked;
        document.getElementById('lote-section').classList.toggle('hidden', !checked);
    };

    window.toggleCertSection = () => {
        const checked = document.getElementById('p-cert').checked;
        document.getElementById('cert-section').classList.toggle('hidden', !checked);
    };

    window.toggleStockPorLote = () => {
        const manejaLote = document.getElementById('p-lote').checked;
        const stockInput = document.getElementById('p-stock');
        const stockMsg = document.getElementById('stock-lote-msg');
        
        if (manejaLote) {
            stockInput.disabled = true;
            stockInput.value = '';
            stockInput.required = false;
            stockMsg.classList.remove('hidden');
        } else {
            stockInput.disabled = false;
            stockInput.required = true;
            stockMsg.classList.add('hidden');
        }
    };

    // Drag & Drop Image
    const imgDz = document.getElementById('img-drop-zone');
    const imgFile = document.getElementById('p-img-file');
    const imgPreview = document.getElementById('img-preview');
    const imgData = document.getElementById('p-img-data');

    if(imgDz) {
        imgDz.addEventListener('click', () => imgFile.click());
        imgDz.addEventListener('dragover', e => { e.preventDefault(); imgDz.classList.add('bg-slate-100'); });
        imgDz.addEventListener('dragleave', e => { e.preventDefault(); imgDz.classList.remove('bg-slate-100'); });
        imgDz.addEventListener('drop', e => {
            e.preventDefault(); imgDz.classList.remove('bg-slate-100');
            if(e.dataTransfer.files.length) handleImageFile(e.dataTransfer.files[0]);
        });
        imgFile.addEventListener('change', e => {
            if(e.target.files.length) handleImageFile(e.target.files[0]);
        });
    }

    function handleImageFile(file) {
        if(!file.type.match('image.*')) return Swal.fire('Error', 'Solo imágenes JPG/PNG', 'error');
        const reader = new FileReader();
        reader.onload = e => {
            imgPreview.src = e.target.result;
            imgPreview.classList.remove('hidden');
            imgData.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Drag & Drop PDF
    const pdfDz = document.getElementById('pdf-drop-zone');
    const pdfFile = document.getElementById('p-pdf-file');
    const pdfName = document.getElementById('pdf-file-name');
    const pdfData = document.getElementById('p-pdf-data');

    if(pdfDz) {
        pdfDz.addEventListener('click', () => pdfFile.click());
        pdfDz.addEventListener('dragover', e => { e.preventDefault(); pdfDz.classList.add('bg-slate-100'); });
        pdfDz.addEventListener('dragleave', e => { e.preventDefault(); pdfDz.classList.remove('bg-slate-100'); });
        pdfDz.addEventListener('drop', e => {
            e.preventDefault(); pdfDz.classList.remove('bg-slate-100');
            if(e.dataTransfer.files.length) handlePdfFile(e.dataTransfer.files[0]);
        });
        pdfFile.addEventListener('change', e => {
            if(e.target.files.length) handlePdfFile(e.target.files[0]);
        });
    }

    function handlePdfFile(file) {
        if(file.type !== 'application/pdf') return Swal.fire('Error', 'Solo archivos PDF', 'error');
        pdfName.innerHTML = `<i class="bi bi-file-pdf-fill text-red-500"></i> ${file.name}`;
        pdfData.value = file.name;
    }

document.getElementById('prod-form').addEventListener('submit', async ev => {
        ev.preventDefault();
        const pid = document.getElementById('p-id').value;
        const isNewP = !pid;
        const manejaLote = document.getElementById('p-lote').checked;
        const reqCert = document.getElementById('p-cert').checked;
        
        let initialStock = 0;
        if (!isNewP && !manejaLote) initialStock = parseInt(document.getElementById('p-stock').value) || 0;
        if (!isNewP && manejaLote) initialStock = p.stock;
        
        // --- CAMBIO 1: VALIDACIÓN INTELIGENTE ---
        if (isNewP && manejaLote) {
            initialStock = parseInt(document.getElementById('l-stock')?.value) || 0;
            
            // Solo exigimos N° de lote si el usuario está ingresando stock inicial.
            // Si el stock es 0 (porque va a ingresar luego por Compras), lo dejamos pasar.
            if (initialStock > 0) {
                if(!document.getElementById('l-num').value) return Swal.fire('Error', "Debe ingresar un número de lote inicial si el stock es mayor a cero.", 'error');
                if(reqCert && !document.getElementById('c-num').value) return Swal.fire('Error', "Debe ingresar el número de certificado.", 'error');
            }
        }
        
        if (isNewP && !manejaLote) {
            initialStock = parseInt(document.getElementById('p-stock').value) || 0; 
        }

        const catVal = document.getElementById('p-cat').value.trim();
        const unitVal = document.getElementById('p-unit').value.trim();
        const basePrice = parseFloat(document.getElementById('p-price').value) || 0;
        
        const prod = {
            id: isNewP ? null : parseInt(pid),
            code: document.getElementById('p-code').value,
            barcode: document.getElementById('p-barcode').value,
            name: document.getElementById('p-name').value,
            category: catVal || 'General',
            unit: unitVal || 'Unidad',
            price: basePrice,
            precioMayorista: parseFloat(document.getElementById('p-price-may').value) || basePrice,
            precioDistribuidor: parseFloat(document.getElementById('p-price-dist').value) || basePrice,
            stock: initialStock, // Entrará con 0
            minStock: parseInt(document.getElementById('p-min').value),
            manejaLote: manejaLote,
            requiresCert: reqCert,
            image: document.getElementById('p-img-data').value,
            procesoSoldadura: p.procesoSoldadura,
            amperaje: p.amperaje,
            materialBase: p.materialBase
        };
        
        if (catVal && !MOCK_DB.categories.includes(catVal)) MOCK_DB.categories.push(catVal);
        if (unitVal && !MOCK_DB.units.includes(unitVal)) MOCK_DB.units.push(unitVal);
        
        const savedProd = await api.saveProduct(prod);

        // --- CAMBIO 2: GUARDADO DEL LOTE ---
        // Solo creamos el lote en la base de datos si el stock inicial es mayor a 0
        if (isNewP && manejaLote && initialStock > 0) {
            const newLote = {
                id: Date.now(),
                productId: savedProd.id,
                loteNumber: document.getElementById('l-num').value,
                dateIn: document.getElementById('l-date').value || new Date().toISOString().split('T')[0],
                stock: initialStock,
                hasCert: reqCert,
                certificateName: document.getElementById('p-pdf-data').value || 'Certificado.pdf'
            };
            MOCK_DB.lotes.push(newLote);
            // Guardar actualizaciones de estado
            localStorage.setItem('DELGADO_ERP_MOCK_DB', JSON.stringify(MOCK_DB));
        }

        closeModal();
        renderInventario(document.getElementById('main-area'));
    });
};

// Kardex
window.openKardexModal = async (productId) => {
    const p = state.caches.products.find(x => x.id === productId);
    if (!p) return;
    
    let movements = await api.getMovements();
    movements = movements.filter(m => m.productId === productId);
    movements.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let calculatedStock = 0;
    movements.forEach(m => {
        if(m.type === 'ENTRADA') calculatedStock += m.quantity;
        if(m.type === 'SALIDA') calculatedStock -= m.quantity;
        if(m.type === 'AJUSTE') calculatedStock = m.quantity;
        m.cumulativeStock = calculatedStock;
    });

    window.currentKardexData = movements;

    showModal(`
        <div class="p-6 text-slate-800">
            <div class="flex justify-between items-center mb-6 print-hidden">
                <h3 class="text-xl font-bold text-slate-900 flex items-center gap-2"><i class="bi bi-file-earmark-spreadsheet-fill text-sky-500"></i> Kardex de Producto</h3>
                <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
            </div>
            
            <div id="kardex-print-area" class="space-y-4">
                <div class="border-b border-slate-200 pb-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <h2 class="text-lg font-black text-slate-900">${p.name}</h2>
                            <p class="text-xs text-slate-500 mt-1"><strong>Código:</strong> ${p.code} | <strong>Categoría:</strong> ${p.category}</p>
                        </div>
                        <div class="text-right">
                            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stock Actual</span>
                            <h2 class="text-2xl font-black text-emerald-600 leading-none mt-1">${p.stock} <span class="text-xs text-slate-500 font-medium">${p.unit}</span></h2>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 border border-slate-200 rounded-2xl items-end print-hidden">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Desde</label>
                        <input type="date" id="k-date-from" class="w-full rounded-xl border-slate-200 bg-white py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hasta</label>
                        <input type="date" id="k-date-to" class="w-full rounded-xl border-slate-200 bg-white py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Mov.</label>
                        <select id="k-type" class="w-full rounded-xl border-slate-200 bg-white py-1.5 text-xs">
                            <option value="Todos">Todos</option>
                            <option value="ENTRADA">ENTRADA</option>
                            <option value="SALIDA">SALIDA</option>
                            <option value="AJUSTE">AJUSTE</option>
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex-grow shadow-sm flex items-center justify-center gap-1.5" onclick="filtrarKardex()">
                            <i class="bi bi-filter"></i> Filtrar
                        </button>
                        <button class="border border-slate-200 hover:bg-slate-100 text-slate-600 px-3 py-2 rounded-xl transition-colors" onclick="window.print()" title="Imprimir / PDF">
                            <i class="bi bi-printer-fill"></i>
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-3 text-center" id="kardex-summary">
                </div>

                <div class="overflow-x-auto rounded-xl border border-slate-150">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-200">
                                <th class="p-2.5 font-bold text-slate-600">Fecha y Hora</th>
                                <th class="p-2.5 font-bold text-slate-600">Tipo</th>
                                <th class="p-2.5 font-bold text-slate-600">Referencia</th>
                                <th class="p-2.5 font-bold text-slate-600 text-right">Entrada</th>
                                <th class="p-2.5 font-bold text-slate-600 text-right">Salida</th>
                                <th class="p-2.5 font-bold text-slate-600 text-right bg-slate-100 border-l border-slate-200">Stock Acum.</th>
                            </tr>
                        </thead>
                        <tbody id="kardex-tbody" class="divide-y divide-slate-100">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `, 'max-w-4xl');

    filtrarKardex();
};

window.filtrarKardex = () => {
    const from = document.getElementById('k-date-from').value;
    const to = document.getElementById('k-date-to').value;
    const type = document.getElementById('k-type').value;

    let filtered = window.currentKardexData;

    if (from) filtered = filtered.filter(m => new Date(m.date) >= new Date(from));
    if (to) filtered = filtered.filter(m => new Date(m.date) <= new Date(to + 'T23:59:59'));
    if (type !== 'Todos') filtered = filtered.filter(m => m.type === type);

    let totIn = 0;
    let totOut = 0;
    let finalStock = filtered.length > 0 ? filtered[filtered.length - 1].cumulativeStock : 0;

    filtered.forEach(m => {
        if(m.type === 'ENTRADA') totIn += m.quantity;
        if(m.type === 'SALIDA') totOut += m.quantity;
    });

    document.getElementById('kardex-summary').innerHTML = `
        <div class="bg-emerald-50 rounded-2xl p-3 border border-emerald-150">
            <span class="text-[9px] uppercase font-bold text-emerald-600 tracking-wide block">Entradas (Filtro)</span>
            <span class="text-lg font-black text-emerald-700 block mt-1">+${totIn}</span>
        </div>
        <div class="bg-red-50 rounded-2xl p-3 border border-red-150">
            <span class="text-[9px] uppercase font-bold text-red-600 tracking-wide block">Salidas (Filtro)</span>
            <span class="text-lg font-black text-red-700 block mt-1">-${totOut}</span>
        </div>
        <div class="bg-blue-50 rounded-2xl p-3 border border-blue-150">
            <span class="text-[9px] uppercase font-bold text-blue-600 tracking-wide block">Stock Final</span>
            <span class="text-lg font-black text-blue-700 block mt-1">${finalStock}</span>
        </div>
    `;

    document.getElementById('kardex-tbody').innerHTML = filtered.map(m => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-2.5 font-mono text-slate-500 whitespace-nowrap">${m.date.replace('T', ' ')}</td>
            <td class="p-2.5">
                <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${m.type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800' : m.type === 'SALIDA' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}">${m.type}</span>
            </td>
            <td class="p-2.5 text-slate-600">${m.reason || 'Sin referencia'}</td>
            <td class="p-2.5 text-right font-semibold text-emerald-600">${m.type === 'ENTRADA' ? '+' + m.quantity : m.type === 'AJUSTE' && m.quantity >= m.cumulativeStock ? m.quantity : '-'}</td>
            <td class="p-2.5 text-right font-semibold text-red-600">${m.type === 'SALIDA' ? '-' + m.quantity : '-'}</td>
            <td class="p-2.5 text-right font-bold text-slate-800 bg-slate-50/80 border-l border-slate-150">${m.cumulativeStock}</td>
        </tr>
    `).join('') || `<tr><td colspan="6" class="p-6 text-center text-slate-400 text-xs">No hay movimientos que coincidan con los filtros</td></tr>`;
};

// Lotes
window.openLotesModal = async (productId, productName) => {
    state.currentLotesProductId = productId;
    state.currentLotesProductName = productName;
    await renderLotesModalContent();
};

window.renderLotesModalContent = async () => {
    const lotes = await api.getLotes(state.currentLotesProductId);
    
    const rows = lotes.map(l => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-3 font-mono font-bold text-slate-800">${l.loteNumber}</td>
            <td class="p-3 text-slate-500">${l.dateIn}</td>
            <td class="p-3 text-slate-700 font-bold">${l.stock} unid.</td>
            <td class="p-3">
                ${l.hasCert 
                    ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><i class="bi bi-file-pdf"></i> Certificado</span><br>
                       <small class="text-slate-400 text-[10px] font-mono block mt-0.5">${l.certificateName}</small>` 
                    : '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><i class="bi bi-exclamation-triangle"></i> Faltante</span>'}
            </td>
            <td class="p-3 text-right">
                ${l.hasCert 
                    ? `<button class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onclick="alert('Descargando certificado ${l.certificateName}')" title="Descargar"><i class="bi bi-download"></i></button>`
                    : `<label class="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-all cursor-pointer inline-block" title="Subir PDF">
                          <i class="bi bi-upload"></i>
                          <input type="file" accept=".pdf" class="hidden" onchange="uploadCert(event, ${l.id})">
                       </label>`
                }
            </td>
        </tr>
    `).join('');

    const html = `
        <div class="p-6 text-slate-800">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-900">Gestión de Lotes: ${state.currentLotesProductName}</h3>
                <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event); renderInventario(document.getElementById('main-area'))"><i class="bi bi-x-lg"></i></button>
            </div>
            
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
                <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3"><i class="bi bi-plus-circle-fill text-blue-500"></i> Registrar Entrada de Nuevo Lote</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                        <label class="block text-[10px] text-slate-600 mb-1">N° Lote (Alfanumérico)</label>
                        <input type="text" id="nl-number" class="w-full rounded-xl border-slate-200 bg-white py-1.5 text-xs font-mono" placeholder="L-2026-002">
                    </div>
                    <div>
                        <label class="block text-[10px] text-slate-600 mb-1">Fecha de Ingreso</label>
                        <input type="date" id="nl-date" class="w-full rounded-xl border-slate-200 bg-white py-1.5 text-xs" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="block text-[10px] text-slate-600 mb-1">Stock Inicial</label>
                        <div class="flex gap-2">
                            <input type="number" id="nl-stock" class="w-full rounded-xl border-slate-200 bg-white py-1.5 text-xs font-bold text-center" min="1" value="10">
                            <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 rounded-xl transition-all whitespace-nowrap" onclick="addNewLote()">
                                + Añadir
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3"><i class="bi bi-list-stars"></i> Lotes Registrados en Sistema</h4>
            <div class="overflow-x-auto rounded-xl border border-slate-150">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200">
                            <th class="p-3 font-bold text-slate-600">Número de Lote</th>
                            <th class="p-3 font-bold text-slate-600">Fecha de Ingreso</th>
                            <th class="p-3 font-bold text-slate-600">Stock Disponible</th>
                            <th class="p-3 font-bold text-slate-600">Estado Certificado</th>
                            <th class="p-3 font-bold text-slate-600 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${rows || '<tr><td colspan="5" class="p-6 text-center text-slate-400">No hay lotes registrados para este producto</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    if(!document.getElementById('lotes-modal-container')) {
        showModal(`<div id="lotes-modal-container">${html}</div>`, 'max-w-3xl');
    } else {
        document.getElementById('lotes-modal-container').innerHTML = html;
    }
};

window.addNewLote = async () => {
    const num = document.getElementById('nl-number').value.trim();
    const date = document.getElementById('nl-date').value;
    const stock = parseInt(document.getElementById('nl-stock').value);

    if(!num || stock <= 0) return Swal.fire('Error', 'Por favor ingrese un número de lote válido y stock mayor a cero.', 'error');

    await api.saveLote({
        productId: state.currentLotesProductId,
        loteNumber: num,
        dateIn: date,
        stock: stock,
        hasCert: false
    });

    const prod = state.caches.products.find(x => x.id === state.currentLotesProductId);
    if(prod) {
        prod.stock += stock;
        await api.saveProduct(prod);
    }

    await renderLotesModalContent();
};

window.uploadCert = async (event, loteId) => {
    const file = event.target.files[0];
    if(!file) return;
    
    await api.uploadCertificateToLote(loteId, file.name);
    await Swal.fire('Éxito', 'Certificado subido correctamente.', 'success');
    await renderLotesModalContent();
};

window.renderInventario = renderInventario;
