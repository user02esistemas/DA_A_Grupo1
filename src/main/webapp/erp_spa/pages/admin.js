async function renderAdmin(c) {
    state.caches.users = await api.getUsers();
    
    const rows = state.caches.users.map(u => `
        <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0">
            <td class="p-4 whitespace-nowrap text-[#CBD5E1] font-mono text-xs">${u.idUsuario}</td>
            <td class="p-4 whitespace-nowrap text-[#F8FAFC] font-semibold">${u.nombreEntidad}</td>
            <td class="p-4 whitespace-nowrap text-[#CBD5E1]">${u.usuario}</td>
            <td class="p-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${u.nombreRol==='ADMINISTRADOR' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'}">
                    ${u.nombreRol}
                </span>
            </td>
            <td class="p-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${(u.nombreEstado || '').toUpperCase() === 'ACTIVO' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
                    <span class="w-1.5 h-1.5 rounded-full ${(u.nombreEstado || '').toUpperCase() === 'ACTIVO' ?'bg-emerald-500':'bg-red-500'}"></span>
                    ${u.nombreEstado || 'Desconocido'}
                </span>
            </td>
            <td class="p-4 whitespace-nowrap text-right flex justify-end gap-1">
                <button class="p-2 text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#334155] rounded-lg transition-colors" title="Editar" onclick="openUserModal(${u.idUsuario})">
                    <i class="bi bi-pencil-square text-lg"></i>
                </button>
                <button class="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar" onclick="deleteUser(${u.idUsuario})">
                    <i class="bi bi-trash3 text-lg"></i>
                </button>
            </td>
        </tr>
    `).join('');

    const erRows = MOCK_DB.exchangeRates.map(er => `
        <tr class="hover:bg-[#111827]/40 transition-colors border-b border-[#334155] last:border-0">
            <td class="p-4 whitespace-nowrap text-[#F8FAFC] font-semibold">${er.from} a ${er.to}</td>
            <td class="p-4 whitespace-nowrap text-[#F8FAFC] font-bold font-mono text-base">${er.rate.toFixed(2)}</td>
            <td class="p-4 whitespace-nowrap text-[#CBD5E1] font-mono text-xs">${er.date}</td>
            <td class="p-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${er.status === 'Activo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
                    <span class="w-1.5 h-1.5 rounded-full ${er.status==='Activo'?'bg-emerald-500':'bg-red-500'}"></span>
                    ${er.status}
                </span>
            </td>
            <td class="p-4 whitespace-nowrap text-right">
                <button class="p-2 text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#334155] rounded-lg transition-colors" onclick="openExchangeRateModal(${er.id})">
                    <i class="bi bi-pencil-square text-lg"></i>
                </button>
            </td>
        </tr>
    `).join('');

    c.innerHTML = `
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4" data-aos="fade-down">
            <div>
                <h2 class="text-2xl font-bold text-[#F8FAFC] tracking-tight">Panel de Administración</h2>
                <p class="text-sm text-[#CBD5E1] mt-1">Configuración de usuarios, accesos de personal y mantenimiento de tipos de cambio de divisas.</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6" data-aos="fade-up">
            <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden">
                <div class="p-4 border-b border-[#334155] bg-[#111827] flex justify-between items-center">
                    <h3 class="font-bold text-[#F8FAFC]">Administración de Usuarios</h3>
                    <button class="bg-blue-600 hover:bg-blue-700 text-[#F8FAFC] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm shadow-blue-600/20 transition-all flex items-center gap-1" onclick="openUserModal()">
                        <i class="bi bi-plus-lg"></i> Nuevo Usuario
                    </button>
                </div>
                <div class="overflow-x-auto max-h-[400px] custom-scrollbar">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-[#111827]/50 border-b border-[#334155]">
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">ID</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Nombre</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Usuario</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Rol</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Estado</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#334155] text-xs">
                            ${rows || '<tr><td colspan="6" class="p-8 text-center text-slate-500">No hay usuarios registrados.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="bg-[#1E293B] rounded-2xl shadow-sm border border-[#334155] overflow-hidden">
                <div class="p-4 border-b border-[#334155] bg-[#111827] flex justify-between items-center">
                    <h3 class="font-bold text-[#F8FAFC]">Tipos de Cambio</h3>   
                    <button class="bg-blue-600 hover:bg-blue-700 text-[#F8FAFC] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm shadow-blue-600/20 transition-all flex items-center gap-1" onclick="openExchangeRateModal()">
                        <i class="bi bi-plus-lg"></i> Nuevo Registro
                    </button>
                </div>
                <div class="overflow-x-auto max-h-[400px] custom-scrollbar">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-[#111827]/50 border-b border-[#334155]">
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Par de Monedas</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Tipo de Cambio</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Fecha</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase">Estado</th>
                                <th class="p-3 text-xs font-bold text-[#CBD5E1] uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#334155] text-xs">
                            ${erRows || '<tr><td colspan="5" class="p-8 text-center text-slate-500">No hay tipos de cambio registrados.</td></tr>'}
                        </tbody>
                    </table>    
                </div>
            </div>
        </div>
    `;
}

window.openUserModal = async (id = null) => {
    const u = id ? state.caches.users.find(x => x.idUsuario === id) : {
        idUsuario: null,
        idEntidad: null,
        nombreEntidad:'',
        username: '', 
        password: '', 
        idRole: '', 
        idEstado: null};

    const roles = await api.getRoles();

    const estadoHtml = id ? `
        <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
            <select id="u-status" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5">
                <option value="15" ${u.idEstado === 15 ? 'selected' : ''}>Activo</option>
                <option value="16" ${u.idEstado === 16 ? 'selected' : ''}>Inactivo</option>
            </select>
        </div>
    ` : '';

    const html = `
        <div class="p-6 text-slate-800">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-900">${id ? 'Editar' : 'Nuevo'} Usuario</h3>
                <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
            </div>
            
            <form id="user-form" class="space-y-4">
                <input type="hidden" id="u-id" value="${u.idUsuario || ''}">
                <input type="hidden" id="u-id-entidad" value="${u.idEntidad || ''}">
                <div class = "relative">
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Nombre Real (Trabajador)</label>
                    <input type="text" id="u-entidad-buscar" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5" 
                    value="${u.nombreEntidad}"  
                    placeholder="Buscar nombre o DNI ..."
                    autocomplete = "off" required ${id ? 'disabled' : ''}>

                    <div id="u-entidad-resultado" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg hidden max-h-40 overflow-y-auto">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Nombre de Usuario</label>
                        <input type="text" id="u-username" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5" value="${u.usuario || ''}" required placeholder="Ej. jperez">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Contraseña</label>
                        <input type="password" id="u-password" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5" ${id ? 'placeholder="Dejar en blanco para conservar"' : 'required'}>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Rol</label>
                        <select id="u-role" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5">
                            <option value="" ${!u.idRole ? 'selected' : ''} disabled>
                                Seleccione Rol ...
                            </option>
                            
                            ${roles.map(r =>`
                                <option value = "${r.idRol}" ${u.idRole === r.idRol ? 'selected' : ''}>
                                    ${r.nombreRol.toUpperCase()}
                                </option>
                                `).join('')}

                        </select>
                    </div>
                    ${estadoHtml}
                </div>
                
                <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors" onclick="closeModal(event)">Cancelar</button>
                    <button type="submit" class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors">Guardar Usuario</button>
                </div>
            </form>
        </div>
    `;
    
    showModal(html, 'max-w-md');

    const busqueda = document.getElementById('u-entidad-buscar');
    const resultado = document.getElementById('u-entidad-resultado');
    const hiddenIdInput = document.getElementById('u-id-entidad');

    if (!state.caches.entities || state.caches.entities.length === 0) {
        state.caches.entities = await api.getEntities();
    }
    
    const trabajadores = state.caches.entities.filter(e => (e.nombreTipoEntidad || '').toUpperCase() === 'TRABAJADOR');

    busqueda.addEventListener('input', (e) =>{
        const term = e.target.value.toLowerCase().trim();
        hiddenIdInput.value = '';

        if (term.length < 2) {
            resultado.classList.add('hidden');
            return;
        }

        const matches = trabajadores.filter(t => 
            (t.numeroDocumento || '').toLowerCase().includes(term) ||
            (t.nombre_RazonSocial || '').toLowerCase().includes(term)
        );

        if (matches.length > 0) {
            resultado.innerHTML = matches.map(m => `
                <div class="p-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0" 
                     onclick="selectTrabajador(${m.idEntidad}, '${(m.nombre_RazonSocial || '').replace(/'/g, "\\'")}')">
                    <div class="font-bold text-sm text-slate-800">${m.nombre_RazonSocial}</div>
                    <div class="text-xs text-slate-500">DNI: ${m.numeroDocumento || 'S/N'}</div>
                </div>
            `).join('');
            resultado.classList.remove('hidden');
        } else {
            resultado.innerHTML = `<div class="p-2 text-sm text-slate-500 text-center">No se encontraron trabajadores</div>`;
            resultado.classList.remove('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!busqueda.contains(e.target) && !resultado.contains(e.target)) {
            resultado.classList.add('hidden');
        }
    });

    window.selectTrabajador = (idEntidad, nombre) => {
        hiddenIdInput.value = idEntidad;
        busqueda.value = nombre;
        resultado.classList.add('hidden');
    };

    document.getElementById('user-form').onsubmit = async (ev) => {
        ev.preventDefault();
        const uid = document.getElementById('u-id').value;
        const idEnt = document.getElementById('u-id-entidad').value;
        const pass = document.getElementById('u-password').value;
        const statusEl = document.getElementById('u-status');
        const roleSele = document.getElementById('u-role');

        if (!idEnt) {
            alert("Debe seleccionar un trabajador válido de la lista.");
            return;
        }

        if(!roleSele.value){
            alert("Debe seleccionar un rol para el usuario.");
            return;
        }

        if (!uid && !pass) {
            alert("La contraseña es obligatoria para un usuario nuevo.");
            return;
        }
        
        const usuarioDTO= {
            idUsuario: uid ? parseInt(uid) : 0,
            idEntidad: parseInt(idEnt),
            usuario: document.getElementById('u-username').value.trim(),
            idRol: parseInt(roleSele.value),
            idEstado: statusEl ? parseInt(statusEl.value) : 15
        };

        if (pass) {
            usuarioDTO.paswordHash = pass; 
        }

        const btnSubmit = ev.target.querySelector('button[type="submit"]');
        const originalText = btnSubmit.innerHTML;
        
       try {
            btnSubmit.innerHTML = 'Guardando...';
            btnSubmit.disabled = true;

            await api.saveUser(usuarioDTO);
            closeModal();
            
            Swal.fire({
                title: '¡Operación Exitosa!',
                text: 'Usuario guardado correctamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl' }
            });
            
            if (typeof window.renderAdmin === 'function') {
                window.renderAdmin(document.getElementById('main-area') || c); 
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                customClass: { popup: 'rounded-2xl' }
            });
            btnSubmit.innerHTML = originalText;
            btnSubmit.disabled = false;
        }
    };
};

window.deleteUser = async (idUsuario) => {
    const result = await Swal.fire({
        title: '¿Inhabilitar usuario?',
        text: "El usuario ya no podrá ingresar al sistema.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, inhabilitar',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'rounded-2xl' }
    });
    
    if(result.isConfirmed) {
        try {
            await api.deleteUser(idUsuario);
            Swal.fire({
                title: '¡Completado!',
                text: 'El usuario ha sido inhabilitado.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl' }
            });
            renderAdmin(document.getElementById('main-area'));
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                customClass: { popup: 'rounded-2xl' }
            });
        }
    }
};

window.openExchangeRateModal = (id = null) => {
    const er = id ? MOCK_DB.exchangeRates.find(x => x.id === id) : { from: 'USD', to: 'PEN', rate: 3.75, date: new Date().toISOString().split('T')[0], status: 'Activo' };
    
    const html = `
        <div class="p-6 text-slate-800">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-900">${id ? 'Editar' : 'Nuevo'} Tipo de Cambio</h3>
                <button class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors" onclick="closeModal(event)"><i class="bi bi-x-lg"></i></button>
            </div>
            
            <form id="er-form" class="space-y-4">
                <input type="hidden" id="er-id" value="${id || ''}">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Moneda Origen</label>
                        <select id="er-from" class="w-full rounded-xl border-slate-200 bg-slate-100 py-2.5 focus:outline-none" disabled>
                            <option value="USD" selected>USD</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Moneda Destino</label>
                        <select id="er-to" class="w-full rounded-xl border-slate-200 bg-slate-100 py-2.5 focus:outline-none" disabled>
                            <option value="PEN" selected>PEN</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Tipo de Cambio</label>
                        <input type="number" id="er-rate" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5 font-bold font-mono" step="0.001" value="${er.rate}" required>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Fecha</label>
                        <input type="date" id="er-date" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5 font-mono" value="${er.date}" required>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
                    <select id="er-status" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 py-2.5">
                        <option value="Activo" ${er.status==='Activo'?'selected':''}>Activo (Actualizar globalmente)</option>
                        <option value="Inactivo" ${er.status==='Inactivo'?'selected':''}>Inactivo (Solo histórico)</option>
                    </select>
                </div>
                
                <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors" onclick="closeModal(event)">Cancelar</button>
                    <button type="submit" class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors">Guardar Cambio</button>
                </div>
            </form>
        </div>
    `;
    
    showModal(html, 'max-w-md');
    
    document.getElementById('er-form').onsubmit = (ev) => {
        ev.preventDefault();
        const erid = document.getElementById('er-id').value;
        const rate = parseFloat(document.getElementById('er-rate').value);
        const status = document.getElementById('er-status').value;
        
        const erData = {
            from: 'USD',
            to: 'PEN',
            rate: rate,
            date: document.getElementById('er-date').value,
            status: status
        };
        
        if (status === 'Activo') {
            MOCK_DB.exchangeRates.forEach(x => x.status = 'Inactivo');
            state.exchangeRate = rate;
        }
        
        if (erid) {
            const index = MOCK_DB.exchangeRates.findIndex(x => x.id == erid);
            if (index > -1) MOCK_DB.exchangeRates[index] = { ...MOCK_DB.exchangeRates[index], ...erData };
        } else {
            erData.id = MOCK_DB.exchangeRates.length ? Math.max(...MOCK_DB.exchangeRates.map(x => x.id)) + 1 : 1;
            MOCK_DB.exchangeRates.unshift(erData);
        }
        
       
        localStorage.setItem('DELGADO_ERP_MOCK_DB', JSON.stringify(MOCK_DB));
        closeModal();
        if (typeof window.renderLayout === 'function') window.renderLayout();
    };
};

window.renderAdmin = renderAdmin;
