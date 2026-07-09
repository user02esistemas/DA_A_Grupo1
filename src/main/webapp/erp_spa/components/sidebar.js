function renderSidebar() {
    const userRole = state.user ? state.user.nombreRol : '';

    const navHTML = Object.entries(ROUTES)
        .filter(([id, r]) => r.roles.includes(userRole))
        .map(([id, r]) => `
            <a onclick="navigate('${id}')" href="javascript:void(0)" title="${r.title}"
               class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-1 group relative overflow-hidden
               ${state.currentView === id 
                    ? 'bg-blue-600/20 text-[#3B82F6] font-semibold' 
                    : 'text-[#CBD5E1] hover:bg-[#1E293B] hover:text-[#F8FAFC]'}">
                ${state.currentView === id ? '<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#3B82F6] rounded-r-full"></div>' : ''}
                <i class="${r.icon} text-xl ${state.currentView === id ? 'text-[#3B82F6]' : 'text-slate-400 group-hover:text-[#F8FAFC]'} transition-colors ${state.sidebarCollapsed ? 'mx-auto' : ''}"></i>
                <span class="${state.sidebarCollapsed ? 'hidden' : 'block whitespace-nowrap'}">${r.title}</span>
            </a>
        `).join('');

    return `
        <!-- Sidebar -->
        <aside class="bg-[#111827] border-r border-[#334155] flex flex-col flex-shrink-0 transition-all duration-300 z-40 fixed md:relative h-full shadow-[4px_0_24px_rgba(0,0,0,0.3)] ${state.sidebarCollapsed ? '-translate-x-full md:translate-x-0 w-[5rem]' : 'translate-x-0 w-[17rem]'}">
            
            <div class="h-16 flex items-center px-4 border-b border-[#334155] ${state.sidebarCollapsed ? 'justify-center' : 'justify-between'}">
                <div class="flex items-center gap-2 ${state.sidebarCollapsed ? 'hidden' : ''}">
                    <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-[#F8FAFC]">
                        <i class="bi bi-box-seam"></i>
                    </div>
                    <span class="font-bold text-lg tracking-tight text-[#F8FAFC]">Delgado</span>
                </div>
                
                <div class="${state.sidebarCollapsed ? '' : 'hidden'} w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-[#3B82F6] font-black text-xl">
                    D
                </div>
                
                <button onclick="toggleSidebar()" class="p-2 rounded-lg text-slate-400 hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-colors">
                    <i class="bi ${state.sidebarCollapsed ? 'bi-layout-sidebar' : 'bi-layout-sidebar-inset'}"></i>
                </button>
            </div>
            
            <div class="p-3 flex-1 overflow-y-auto custom-scrollbar">
                ${navHTML}
            </div>
            
            <div class="p-4 border-t border-[#334155] mt-auto">
                <button onclick="logout()" class="flex items-center justify-center w-full gap-2 p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 font-medium transition-colors">
                    <i class="bi bi-box-arrow-right text-lg"></i>
                    <span class="${state.sidebarCollapsed ? 'hidden' : 'block'}">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    `;
}

window.renderSidebar = renderSidebar;
