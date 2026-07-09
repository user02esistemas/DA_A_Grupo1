function showModal(contentHTML, size = 'max-w-2xl') {
    const sizeMap = {
        'lg': 'max-w-5xl',
        'md': 'max-w-2xl',
        'sm': 'max-w-md',
        'xl': 'max-w-7xl'
    };
    const twSize = sizeMap[size] || size;
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="fixed inset-0 z-[2000] flex justify-center items-center bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-4">
            <div class="bg-[#1E293B] text-[#F8FAFC] border border-[#334155] rounded-2xl shadow-xl w-full ${twSize} max-h-[95vh] overflow-y-auto transform transition-all animate-[slideIn_0.3s_ease-out]">
                ${contentHTML}
            </div>
        </div>
    `;
    document.getElementById('modal-container').appendChild(div.firstElementChild);
}
function closeModal(e) {
    if (e) {
        const backdrop = e.target.closest('.fixed.inset-0');
        if (backdrop) backdrop.remove();
    } else {
        document.getElementById('modal-container').innerHTML = '';
    }
}

window.showModal = showModal;
window.closeModal = closeModal;
