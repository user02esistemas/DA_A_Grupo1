const formatMoney = (amountInSoles) => {
    return `S/ ${parseFloat(amountInSoles).toFixed(2)}`;
};
const formatUSD = (amountInSoles) => {
    return `$ ${(amountInSoles / state.exchangeRate).toFixed(2)}`;
};
const convertirMoneda = (monto, monedaDestino) => {
    if (monedaDestino === 'USD') return monto / state.exchangeRate;
    return monto;
};
function formatDateTime(dateObj) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const h = String(hours).padStart(2, '0');
    return `${d}/${m}/${y} - ${h}:${minutes} ${ampm}`;
}
function startClock() {
    setInterval(() => {
        const now = new Date();
        state.liveTimeFormatted = formatDateTime(now);
        const clockEl = document.getElementById('live-clock-display');
        if (clockEl) clockEl.textContent = state.liveTimeFormatted;
    }, 1000);
}
const exportToCSV = (dataArray, filename) => {
    if (!dataArray || !dataArray.length) {
        Swal.fire({ icon: 'warning', title: 'Sin Datos', text: 'No hay datos para exportar.' });
        return;
    }
    const headers = Object.keys(dataArray[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of dataArray) {
        const values = headers.map(header => {
            let val = row[header] === null || row[header] === undefined ? '' : row[header];
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvData = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
const importProductsCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n');
        if(lines.length < 2) { Swal.fire('Error', 'Archivo CSV vacío o inválido.', 'error'); return; }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const requiredHeaders = ['codigo', 'nombre', 'categoria', 'unidad', 'precio', 'stock', 'codigo_barras'];
        
        const valid = requiredHeaders.every(rh => headers.includes(rh));
        if(!valid) {
            Swal.fire('Error', 'El archivo no tiene las columnas requeridas: ' + requiredHeaders.join(', '), 'error');
            return;
        }

        const newProducts = [];
        const { MOCK_DB, api } = window;
        const { showModal, closeModal } = window;

        for(let i=1; i<lines.length; i++) {
            if(!lines[i].trim()) continue;
            let cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            
            let prodObj = {};
            headers.forEach((h, idx) => {
                prodObj[h] = cols[idx];
            });

            newProducts.push({
                code: prodObj.codigo || '',
                barcode: prodObj.codigo_barras || '',
                name: prodObj.nombre || '',
                category: prodObj.categoria || 'General',
                unit: prodObj.unidad || 'Unidad',
                price: parseFloat(prodObj.precio) || 0,
                stock: parseInt(prodObj.stock) || 0,
                minStock: 5,
                manejaLote: false
            });
        }
        
        const previewHTML = `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-slate-900">Vista Previa - Importar CSV</h3>
                    <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
                </div>
                <p class="text-slate-600 mb-4">Se encontraron ${newProducts.length} productos listos para importar.</p>
                <div class="overflow-x-auto rounded-xl border border-slate-150 max-h-[300px] mb-6">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-200">
                                <th class="p-2.5 font-bold text-slate-600">Código</th>
                                <th class="p-2.5 font-bold text-slate-600">Nombre</th>
                                <th class="p-2.5 font-bold text-slate-600">Categoría</th>
                                <th class="p-2.5 font-bold text-slate-600">Precio</th>
                                <th class="p-2.5 font-bold text-slate-600">Stock</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${newProducts.map(p=>`<tr><td class="p-2.5 font-mono text-slate-800">${p.code}</td><td class="p-2.5 text-slate-800 font-medium">${p.name}</td><td class="p-2.5 text-slate-600">${p.category}</td><td class="p-2.5 text-slate-800 font-bold">${formatMoney(p.price)}</td><td class="p-2.5 text-slate-850 font-bold">${p.stock}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <button class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors" onclick="closeModal(event)">Cancelar</button>
                    <button class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors" id="btn-confirm-import">Confirmar Importación</button>
                </div>
            </div>
        `;
        showModal(previewHTML, 'max-w-3xl');
        
        document.getElementById('btn-confirm-import').onclick = async () => {
            for(let p of newProducts) {
                await api.saveProduct(p);
            }
            closeModal();
            await Swal.fire({
                icon: 'success',
                title: 'Importación Completada',
                text: `${newProducts.length} productos importados correctamente.`,
                confirmButtonColor: '#3b82f6'
            });
            if(state.currentView === 'inventory') {
                if (typeof window.renderLayout === 'function') window.renderLayout();
            }
        };
    };
    reader.readAsText(file);
    event.target.value = '';
};

window.exportToCSV = exportToCSV;
window.importProductsCSV = importProductsCSV;
window.formatMoney = formatMoney;
window.formatUSD = formatUSD;
window.convertirMoneda = convertirMoneda;
