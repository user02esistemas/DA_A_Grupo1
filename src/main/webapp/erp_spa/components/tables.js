function renderTableHeader(columns) {
    return `
        <thead>
            <tr>
                ${columns.map(col => `
                    <th class="p-3 font-semibold text-[#CBD5E1] text-left">${col}</th>
                `).join('')}
            </tr>
        </thead>
    `;
}
function renderTableEmptyState(colspan, message = 'No se encontraron registros.') {
    return `
        <tr>
            <td colspan="${colspan}" class="p-8 text-center text-[#CBD5E1] text-sm">
                <div class="flex flex-col items-center justify-center gap-2 py-4">
                    <i class="bi bi-inbox text-3xl text-slate-400"></i>
                    <span>${message}</span>
                </div>
            </td>
        </tr>
    `;
}

window.renderTableHeader = renderTableHeader;
window.renderTableEmptyState = renderTableEmptyState;
