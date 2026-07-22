async function renderEntidades(c) {
    state.caches.entities = await api.getEntities();
    
    c.innerHTML = `
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4" data-aos="fade-down">
            <div>
                <h2 class="text-2xl font-bold text-[#F8FAFC] tracking-tight">Directorio de Entidades</h2>
                <p class="text-sm text-[#CBD5E1] mt-1">Gestión de clientes, proveedores y trabajadores</p>
            </div>
            <div class="flex gap-2">
                <button class="bg-blue-600 hover:bg-blue-700 text-[#F8FAFC] px-4 py-2 rounded-xl font-semibold shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2" onclick="openEntityModal()">
                    <i class="bi bi-plus-lg"></i> Nueva Entidad
                </button>
            </div>
        </div>

        <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden" data-aos="fade-up">
            <!-- Toolbar de Filtros -->
            <div class="p-4 border-b border-[#334155] bg-[#111827]">
                <div class="relative max-w-xl w-full mb-4">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="bi bi-search text-slate-400"></i>
                    </div>
                    <input type="text" id="e-search" class="block w-full pl-10 pr-4 py-2.5 border border-[#334155] rounded-xl leading-5 bg-[#1F2937] text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow" placeholder="Buscar por nombre, DNI o RUC..." value="${state.entitiesFilter.search}">
                </div>
                
                <div class="flex flex-col sm:flex-row gap-4 justify-between">
                    <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1" id="e-type-filters">
                        ${['Todos', 'CLIENTE', 'PROVEEDOR', 'TRABAJADOR'].map(t => `
                            <button class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${state.entitiesFilter.type === t ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30' : 'bg-[#1E293B] border border-[#334155] text-[#CBD5E1] hover:bg-[#334155]'}" onclick="setEntityFilter('type', '${t}')">
                                ${t === 'Todos' ? 'Todos' : t.charAt(0) + t.slice(1).toLowerCase() + 's'}
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1" id="e-doc-filters">
                        ${['Todos', 'DNI', 'RUC'].map(t => `
                            <button class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${state.entitiesFilter.docType === t ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30' : 'bg-[#1E293B] border border-[#334155] text-[#CBD5E1] hover:bg-[#334155]'}" onclick="setEntityFilter('docType', '${t}')">
                                ${t === 'Todos' ? 'Cualquier Doc.' : t}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Tabla -->
            <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-[#111827] border-b border-[#334155]">
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Tipo</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Documento</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Razón Social / Nombre</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Contacto</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Estado</th>
                            <th class="p-4 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#334155]" id="e-table-body">
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    document.getElementById('e-search').addEventListener('input', e => {
        state.entitiesFilter.search = e.target.value.toLowerCase();
        updateEntitiesTable();
    });
    
    updateEntitiesTable();
};

window.setEntityFilter = (key, val) => {
    state.entitiesFilter[key] = val;
    renderEntidades(document.getElementById('main-area'));
};

window.updateEntitiesTable = function() {
    const tbody = document.getElementById('e-table-body');
    const f = state.entitiesFilter;
    const listaOriginal = state.caches.entities || [];
    
    const filtered = listaOriginal.filter(e => {

        const tipoTexto = (e.nombreTipoEntidad || '').toUpperCase();


        const matchType = f.type === 'Todos' || tipoTexto === f.type;
        const matchDoc = f.docType === 'Todos' || (e.tipoDocumento || '') === f.docType;

        const buscarText = f.search.trim().toLowerCase();
        const nombre = (e.nombre_RazonSocial || '').toLowerCase();
        const documento = (e.numeroDocumento || '').toLowerCase();
        const matchSearch = nombre.includes(buscarText) || documento.includes(buscarText);

        return matchType && matchDoc && matchSearch;
    });

    tbody.innerHTML = filtered.map(e => {

        const tipoTexto = (e.nombreTipoEntidad || '').toUpperCase();

        let typeColor = 'bg-[#1F2937] text-[#CBD5E1] border border-[#334155]';
        if (tipoTexto === 'CLIENTE') typeColor = 'bg-blue-500/20 text-[#3B82F6] border border-blue-500/30';
        if (tipoTexto === 'PROVEEDOR') typeColor = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
        if (tipoTexto === 'TRABAJADOR') typeColor = 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';

        const estadoTexto = e.nombreEstado || 'Activo';
        const esActivo = estadoTexto.toLowerCase() === "activo";

        return `
        <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0">
            <td class="p-4 whitespace-nowrap">
                <span class="px-2.5 py-1 rounded-md text-xs font-bold ${typeColor}">${tipoTexto}</span>
            </td>
            <td class="p-4 whitespace-nowrap">
                <div class="font-bold text-[#F8FAFC]">${e.numeroDocumento || '-'}</div>
                <div class="text-xs text-[#CBD5E1]">${e.tipoDocumento}</div>
            </td>
            <td class="p-4">
                <div class="font-bold text-[#F8FAFC]">${e.nombre_RazonSocial}</div>
                <div class="text-xs text-[#CBD5E1] flex items-center gap-1 mt-0.5"><i class="bi bi-geo-alt text-slate-500"></i> ${e.direccion || 'Sin dirección'}</div>
            </td>
            <td class="p-4 whitespace-nowrap text-sm text-[#CBD5E1]">
                ${e.telefono ? `<div class="flex items-center gap-1.5"><i class="bi bi-telephone text-slate-500"></i> ${e.telefono}</div>` : ''}
                ${e.email ? `<div class="flex items-center gap-1.5 mt-0.5"><i class="bi bi-envelope text-slate-500"></i> ${e.email}</div>` : ''}
            </td>
            <td class="p-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${esActivo ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
                    <span class="w-1.5 h-1.5 rounded-full ${esActivo ? 'bg-emerald-500' : 'bg-red-500'}"></span>
                    ${estadoTexto}
                </span>
            </td>
            <td class="p-4 whitespace-nowrap text-right">
                ${tipoTexto === 'CLIENTE' ? `
                    <button class="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded-lg transition-colors" title="Historial" onclick="openClientHistoryModal(${e.idEntidad}, '${(e.nombre_RazonSocial || '').replace(/'/g, "\\'")}')">
                        <i class="bi bi-clock-history text-lg"></i>
                    </button>
                ` : ''}
                <button class="p-2 text-slate-400 hover:text-[#F8FAFC] hover:bg-[#334155] rounded-lg transition-colors ml-1" title="Editar" onclick="openEntityModal(${e.idEntidad})">
                    <i class="bi bi-pencil-square text-lg"></i>
                </button>
                <button class="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-1" title="Inhabilitar" onclick="deleteEntity(${e.idEntidad})">
                    <i class="bi bi-trash3 text-lg"></i>
                </button>
            </td>
        </tr>
    `}).join('') || `
        <tr><td colspan="6" class="p-12 text-center text-[#CBD5E1]">
            <i class="bi bi-search text-3xl mb-3 block opacity-50 text-slate-500"></i>
            <p>No se encontraron resultados para la búsqueda actual</p>
        </td></tr>
    `;
};

window.deleteEntity = async (id) => {
    if (!id) {
        Swal.fire('Error', 'ID de entidad no válido', 'error');
        return;
    }

    const result = await Swal.fire({
        title: '¿Inhabilitar entidad?',
        text: "La entidad pasará a estar en estado Inactivo.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, inhabilitar',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'rounded-2xl' }
    });
    
    if (result.isConfirmed) {
        try {
            const response = await fetch('EntidadesController?action=eliminar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idEntidad: parseInt(id) })
            });
            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    title: '¡Inhabilitada!',
                    text: 'La entidad se inhabilitó correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' }
                });
                if (typeof window.renderEntidades === 'function') {
                    window.renderEntidades(document.getElementById('main-area'));
                }
            } else {
                Swal.fire({ title: 'Error', text: data.error || 'No se pudo inhabilitar.', icon: 'error', customClass: { popup: 'rounded-2xl' } });
            }
        } catch (e) {
            Swal.fire({ title: 'Error', text: 'Error de comunicación con el servidor.', icon: 'error', customClass: { popup: 'rounded-2xl' } });
        }
    }
};

window.openEntityModal = async(id = null) => {
    const e = id ? state.caches.entities.find(x => x.idEntidad === id) : {
        idEntidad: null, 
        idTipoEntidad: '' , 
        tipoDocumento: '', 
        numeroDocumento: '', 
        nombre_RazonSocial: '', 
        direccion: '', 
        telefono: '', 
        email: '' };
    
    const tipoEntidades = await api.getTipoEntities();

    showModal(`
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-900">${id ? 'Editar' : 'Nueva'} Entidad</h3>
                <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
            </div>
            
            <form id="ent-form" class="space-y-4">
                <input type="hidden" id="ent-id" value="${e.idEntidad || ''}">
                
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Tipo de Entidad</label>
                    <select id="ent-type" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5">
                        <option value="" ${!e.idTipoEntidad ? 'selected' : ''} disabled>
                            Seleccione un tipo ...
                        </option>
                    
                        ${tipoEntidades.map(t => `
                            <option value = "${t.idTipoEntidad}" ${e.idTipoEntidad === t.idTipoEntidad ? 'selected' : ''}>
                                ${t.nombreTipoEntidad.toUpperCase()}
                            </option> 
                            `).join('')}
                    </select>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Tipo de Documento</label>
                        <select id="ent-doctype" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5">
                            <option value="" ${!e.tipoDocumento ? 'selected' : ''} disabled>
                                Seleccione un tipo ...
                            </option>
                            <option value="DNI" ${e.tipoDocumento==='DNI'?'selected':''}>DNI</option>
                            <option value="RUC" ${e.tipoDocumento==='RUC'?'selected':''}>RUC</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Número de Documento</label>
                        <input type="text" id="ent-doc" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5" value="${e.numeroDocumento}" required>
                        <p class="text-xs text-red-500 mt-1 hidden" id="ent-doc-error"></p>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Nombre o Razón Social</label>
                    <input type="text" id="ent-name" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5" value="${e.nombre_RazonSocial}" required>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Dirección</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><i class="bi bi-geo-alt"></i></div>
                        <input type="text" id="ent-addr" class="w-full pl-9 rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5" value="${e.direccion}">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><i class="bi bi-telephone"></i></div>
                            <input type="tel" id="ent-phone" class="w-full pl-9 rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5" value="${e.telefono}">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><i class="bi bi-envelope"></i></div>
                            <input type="email" id="ent-email" class="w-full pl-9 rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5" value="${e.email}">
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end pt-4 mt-6 border-t border-slate-100 gap-3">
                    <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <i class="bi bi-save"></i> Guardar Entidad
                    </button>
                </div>
            </form>
        </div>
    `, 'max-w-2xl');

    const docTypeSelect = document.getElementById('ent-doctype');
    const docInput = document.getElementById('ent-doc');
    const errorMsg = document.getElementById('ent-doc-error');

    function validateDoc() {
        const t = docTypeSelect.value;
        const v = docInput.value.trim();
        const isNum = /^\d+$/.test(v);
        
        docInput.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        errorMsg.classList.add('hidden');
        
        if (v.length === 0) return true;

        if (t === 'DNI' && (!isNum || v.length !== 8)) {
            errorMsg.textContent = 'El DNI debe tener exactamente 8 dígitos numéricos.';
            docInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
            errorMsg.classList.remove('hidden');
            return false;
        }
        if (t === 'RUC' && (!isNum || v.length !== 11)) {
            errorMsg.textContent = 'El RUC debe tener exactamente 11 dígitos numéricos.';
            docInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
            errorMsg.classList.remove('hidden');
            return false;
        }
        return true;
    }

    docInput.addEventListener('input', validateDoc);
    docTypeSelect.addEventListener('change', validateDoc);

    document.getElementById('ent-form').addEventListener('submit', async ev => {
        ev.preventDefault();
        if (!validateDoc()) return;
        
        const idValue = document.getElementById('ent-id').value;

        const entidadDTO = {
            idEntidad: idValue ? parseInt(idValue) : null,            
            idTipoEntidad: parseInt(document.getElementById('ent-type').value),
            tipoDocumento: document.getElementById('ent-doctype').value,
            numeroDocumento: document.getElementById('ent-doc').value.trim(),
            nombre_RazonSocial: document.getElementById('ent-name').value,
            direccion: document.getElementById('ent-addr').value,
            telefono: document.getElementById('ent-phone').value,
            email: document.getElementById('ent-email').value
        };
        const guardadoExitoso =await api.saveEntity(entidadDTO);

        if(guardadoExitoso){

            Swal.fire({
                title: '¡Operación Exitosa!',
                text: `La entidad ha sido ${idValue ? 'actualizada' : 'registrada'} correctamente.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl' }
            });
            closeModal();
            renderEntidades(document.getElementById('main-area'));
        }else{
            Swal.fire({
                title: 'Error',
                text: 'No se pudo guardar la entidad en el servidor.',
                icon: 'error',
                customClass: { popup: 'rounded-2xl' }
            });
        }
        
    });
};

window.renderEntidades = renderEntidades;