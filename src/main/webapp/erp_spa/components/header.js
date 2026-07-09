function renderHeader() {
    const title = ROUTES[state.currentView]?.title || 'Delgado ERP';

    const nombreMostrar = state.user ? (state.user.nombreEntidad || state.user.usuario) : 'Usuario';

    const rolMostrar = state.user ? (state.user.nombreRol) : 'Admin';


    const initial = nombreMostrar.charAt(0).toUpperCase();
    const themeIcon = document.body.classList.contains('light-theme') ? 'bi-moon-stars-fill' : 'bi-sun-fill';
    
    return `
        <!-- Topbar -->
        <header class="h-16 bg-[#111827]/80 backdrop-blur-md border-b border-[#334155] px-6 flex items-center justify-between sticky top-0 z-30">
            <div class="flex items-center gap-3">
                <button onclick="toggleSidebar()" class="md:hidden p-2 rounded-lg text-[#CBD5E1] hover:bg-[#1E293B] transition-colors">
                    <i class="bi bi-list text-xl"></i>
                </button>
                <h2 class="text-xl font-bold text-[#F8FAFC] tracking-tight">${title}</h2>
            </div>
            
            <div class="flex items-center gap-4">
                
                <!-- Theme Toggle Button -->
                <button onclick="toggleThemeMode()" class="flex items-center justify-center p-2 rounded-xl bg-[#1E293B] text-[#CBD5E1] border border-[#334155] hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors" title="Cambiar tema (Claro / Oscuro)">
                    <i class="bi ${themeIcon} text-lg"></i>
                </button>
                
                <!-- Clock -->
                <div class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] rounded-lg text-sm font-medium text-[#CBD5E1] border border-[#334155]">
                    <i class="bi bi-clock text-blue-400"></i>
                    <span id="live-clock-display">${state.liveTimeFormatted || 'Cargando reloj...'}</span>
                </div>
                
                <!-- User Badge -->
                <div class="flex items-center gap-3 pl-4 border-l border-[#334155]">
                    <div class="text-right hidden sm:block">
                        <p class="text-sm font-bold text-[#F8FAFC] leading-none">${nombreMostrar}</p>
                        <p class="text-xs text-[#CBD5E1] font-medium mt-1">${rolMostrar}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                        ${initial}
                    </div>
                </div>
            </div>
        </header>
    `;
}

window.renderHeader = renderHeader;
