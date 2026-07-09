const ROUTES = {
    'dashboard': { title: 'Dashboard', icon: 'bi-pie-chart-fill', render: 'renderDashboard', roles: ['ADMINISTRADOR', 'VENDEDOR'] },
    'pos': { title: 'Punto de Venta', icon: 'bi-cash-register', render: 'renderPOS', roles: ['ADMINISTRADOR', 'VENDEDOR'] },
    'sales': { title: 'Historial Ventas', icon: 'bi-receipt', render: 'renderVentas', roles: ['ADMINISTRADOR', 'VENDEDOR'] },
    'inventory': { title: 'Inventario', icon: 'bi-box-seam', render: 'renderInventario', roles: ['ADMINISTRADOR'] },
    'purchases': { title: 'Compras', icon: 'bi-cart-check', render: 'renderCompras', roles: ['ADMINISTRADOR'] },
    'accounting': { title: 'Contabilidad', icon: 'bi-calculator', render: 'renderContabilidad', roles: ['ADMINISTRADOR'] },
    'installments': { title: 'Cuotas y Pagos', icon: 'bi-journal-check', render: 'renderInstallments', roles: ['ADMINISTRADOR', 'VENDEDOR'] },
    'entities': { title: 'Entidades', icon: 'bi-people-fill', render: 'renderEntidades', roles: ['ADMINISTRADOR', 'VENDEDOR'] },
    'movements': { title: 'Movimientos Inv.', icon: 'bi-arrow-left-right', render: 'renderMovimientos', roles: ['ADMINISTRADOR'] },
    'admin': { title: 'Administración', icon: 'bi-gear-fill', render: 'renderAdmin', roles: ['ADMINISTRADOR'] },
    'reports': { title: 'Reportes', icon: 'bi-bar-chart-line-fill', render: 'renderReports', roles: ['ADMINISTRADOR'] }
};


function navigate(viewId) {
    
    const userRole = state.user ? state.user.nombreRol : '';

    
    if (!ROUTES[viewId] || !ROUTES[viewId].roles.includes(userRole)) { 
        Swal.fire({
            icon: 'warning',
            title: 'Acceso Denegado',
            text: 'No tienes permisos para acceder a este módulo.'
        });
        return; 
    }
    
    state.currentView = viewId;
    if (window.innerWidth < 768) state.sidebarCollapsed = true;
    if (typeof window.renderLayout === 'function') {
        window.renderLayout();
    }
}

window.navigate = navigate;
window.ROUTES = ROUTES;
