// Import pages to register them on window object for inline HTML event handlers compatibility
// Expose routing & state globally
window.navigate = navigate;
window.ROUTES = ROUTES;
window.state = state;
window.api = api;

// Layout & authentication rendering
function renderLogin() {
    document.getElementById('app').innerHTML = `
        <div class="min-h-screen w-full flex items-center justify-center bg-[#0F172A] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative">
            <div class="absolute inset-0 bg-blue-600/5 backdrop-blur-3xl"></div>
            
            <div class="w-full max-w-md bg-[#1E293B] rounded-3xl shadow-2xl p-8 relative z-10 animate-[fadeIn_0.5s_ease-out] border border-[#334155]">
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-[#F8FAFC] mb-4 shadow-lg shadow-blue-600/30">
                        <i class="bi bi-box-seam text-3xl"></i>
                    </div>
                    <h1 class="text-3xl font-black tracking-tight text-[#F8FAFC]">Delgado EIRL</h1>
                    <p class="text-[#CBD5E1] font-medium mt-2">ERP & POS Industrial</p>
                </div>
                
                <form id="login-form" class="space-y-5">
                    <div>
                        <label class="block text-sm font-semibold text-[#CBD5E1] mb-1">Usuario</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <i class="bi bi-person"></i>
                            </div>
                            <input type="text" id="l-user" class="pl-10 w-full rounded-xl border-[#334155] bg-[#1F2937] border text-[#F8FAFC] focus:border-blue-500 focus:bg-[#111827] focus:ring-4 focus:ring-blue-500/10 transition-all py-3 outline-none" required placeholder="admin">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-[#CBD5E1] mb-1">Contraseña</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <i class="bi bi-lock"></i>
                            </div>
                            <input type="password" id="l-pass" class="pl-10 w-full rounded-xl border-[#334155] bg-[#1F2937] border text-[#F8FAFC] focus:border-blue-500 focus:bg-[#111827] focus:ring-4 focus:ring-blue-500/10 transition-all py-3 outline-none" required placeholder="••••••••">
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-[#F8FAFC] font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center mt-4">
                        <span>Ingresar al Sistema</span>
                        <i class="bi bi-arrow-right ml-2"></i>
                    </button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.innerHTML = `<i class="bi bi-arrow-repeat animate-spin text-xl"></i>`;
        btn.disabled = true;
        
        try {
            const userData = await api.login(
                document.getElementById('l-user').value,
                document.getElementById('l-pass').value
            );

            state.user = userData;

            // Guardamos la sesión en localStorage
            localStorage.setItem(
                'usuario_sesion',
                JSON.stringify(state.user)
            );

            state.currentView = 'dashboard';
            initApp();
        } catch(err) { 
            Swal.fire({
                icon: 'error',
                title: 'Error de Acceso',
                text: err.message,
                confirmButtonColor: '#3b82f6',
                background: '#1E293B', 
                color: '#F8FAFC'
            });
            btn.innerHTML = `<span>Ingresar al Sistema</span><i class="bi bi-arrow-right ml-2"></i>`;
            btn.disabled = false;
        }
    });
}

function renderLayout() {
    const sidebarHTML = renderSidebar();
    const headerHTML = renderHeader();
    
    document.getElementById('app').innerHTML = `
        ${!state.sidebarCollapsed ? `
        <div class="fixed inset-0 bg-[#0F172A]/50 z-30 md:hidden backdrop-blur-sm" onclick="toggleSidebar()"></div>
        ` : ''}
        
        ${sidebarHTML}

        <main class="flex-1 flex flex-col min-w-0 bg-[#0F172A] relative h-screen">
            ${headerHTML}

            <div id="main-area" class="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar scroll-smooth">
                <div class="flex justify-center items-center h-full">
                    <div class="animate-spin rounded-full h-12 w-12 border-4 border-[#334155] border-t-blue-500"></div>
                </div>
            </div>
        </main>
    `;
    
    if (!document.getElementById('custom-scrollbar-styles')) {
        const style = document.createElement('style');
        style.id = 'custom-scrollbar-styles';
        style.innerHTML = `
            .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
            
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    }

    const pageRenderFunctionName = ROUTES[state.currentView]?.render;
    if (typeof window[pageRenderFunctionName] === 'function') {
        window[pageRenderFunctionName](document.getElementById('main-area'));
    }
}

window.toggleSidebar = () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    renderLayout();
};

window.logout = () => { 
    state.user = null; 
    state.cart = []; 
    localStorage.removeItem('usuario_sesion');
    initApp(); 
};

window.toggleThemeMode = () => {
    const body = document.body;
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    }
    renderLayout(); 
};

async function initApp() { 
    if (window.innerWidth < 768) state.sidebarCollapsed = true;
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
    
    // Recuperar la sesión guardada en localStorage si el estado volátil se reinicia
    if (!state.user) {
        const savedSession = localStorage.getItem('usuario_sesion');
        if (savedSession) {
            state.user = JSON.parse(savedSession);
        }
    }
    
    if (state.user) {
        try {
            await cargarDatosMaestro();
            renderLayout();
       } catch (error) {
            console.error("Error al cargar datos: ", error);
            renderLayout();
       }
    } else {
        renderLogin();
    }
}

async function cargarDatosMaestro() {
    const response = await fetch('MaestroController');
    if(!response.ok){
        throw new Error("No se pudieron cargar los datos maestros");
    }

    const data = await response.json();
    state.caches.entities = data.listar;
    state.caches.users = data.listarUsu;
    state.caches.products = data.listarProd;
    state.caches.lotes = data.listarLotes;
    state.caches.certificados = data.listarCerti;
}

window.initApp = initApp;
window.renderLogin = renderLogin;
window.renderLayout = renderLayout;

initApp();