// ==========================================
// STORAGE & PERSISTENCE ENGINE (ES6 MODULE)
// ==========================================

const STORAGE_KEY = 'DELGADO_ERP_MOCK_DB';

// 1. Initial Seed Data
const SEED_DB = {
    exchangeRates: [
        { id: 1, from: 'USD', to: 'PEN', rate: 3.75, date: '2026-05-18', status: 'Activo' }
    ],
    categories: ['Tuberías', 'Válvulas', 'Conexiones', 'Herramientas', 'Insumos'],
    units: ['Unidad', 'Metro', 'Kg', 'Galón', 'Caja'],
    products: [
        { id: 1, code: 'P001', barcode: '775000100011', name: 'Tubo de Acero 2"', category: 'Tuberías', unit: 'Unidad', price: 150.00, priceMayorista: 140.00, priceDistribuidor: 130.00, stock: 45, minStock: 20, manejaLote: true, procesoSoldadura: 'SMAW', amperaje: '100-130A', materialBase: 'Acero al Carbono', image: '' },
        { id: 2, code: 'P002', barcode: '775000100022', name: 'Válvula Esférica', category: 'Válvulas', unit: 'Unidad', price: 85.50, priceMayorista: 80.00, priceDistribuidor: 75.00, stock: 12, minStock: 15, manejaLote: false, procesoSoldadura: 'N/A', amperaje: 'N/A', materialBase: 'Bronce', image: '' }
    ],
    lotes: [
        { id: 1, productId: 1, loteNumber: 'L-2026-001', dateIn: '2026-05-01', stock: 45, hasCert: true, certificateName: 'Certificado_Calidad_P001.pdf' }
    ],
    sales: [],
    proformas: [],
    installments: [],
    inventoryMovements: [],
    purchases: [],
    guias: [], // OBSOLETO
    notasCredito: [],
    purchaseOrders: []
};

// 2. Load DB from LocalStorage or Load Seed
let MOCK_DB = JSON.parse(localStorage.getItem(STORAGE_KEY));
if (!MOCK_DB) {
    MOCK_DB = JSON.parse(JSON.stringify(SEED_DB));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DB));
}

function saveDB() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DB));
}

// 3. Counters for Correlatives
let boletaCounter = parseInt(localStorage.getItem('boletaCounter')) || 1;
let facturaCounter = parseInt(localStorage.getItem('facturaCounter')) || 1;
let proformaCounter = parseInt(localStorage.getItem('proformaCounter')) || 1;
let ocCounter = parseInt(localStorage.getItem('ocCounter')) || 1;

function saveCounters() {
    localStorage.setItem('boletaCounter', boletaCounter);
    localStorage.setItem('facturaCounter', facturaCounter);
    localStorage.setItem('proformaCounter', proformaCounter);
    localStorage.setItem('ocCounter', ocCounter);
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// 4. API Service Layer
const api = {
    async login(username, password) {
       try {
        const response = await fetch('UsuariosController?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usuario: username,
                    paswordHash: password 
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Credenciales incorrectas o usuario inactivo.');
                }
                throw new Error('Error en el servidor al intentar iniciar sesión.');
            }

            
            const user = await response.json();
            
            
            localStorage.setItem('usuario_sesion', JSON.stringify(user));
            
            return user;
        
       } catch (error) {
            console.error('Error en login', error);
            throw error;
       }
    },
    
    async getProducts() {
        await delay(50);
        return JSON.parse(JSON.stringify(MOCK_DB.products));
    },
    
    async saveProduct(product) {
        await delay(100);
        if (product.id) {
            const idx = MOCK_DB.products.findIndex(p => p.id === product.id);
            if (idx !== -1) MOCK_DB.products[idx] = product;
        } else {
            product.id = Date.now();
            MOCK_DB.products.push(product);
        }
        saveDB();
        return product;
    },
    
    async deleteProduct(id) {
        await delay(100);
        MOCK_DB.products = MOCK_DB.products.filter(p => p.id !== id);
        saveDB();
    },
    
    async getLotes(productId) {
        await delay(50);
        return productId !== undefined 
            ? MOCK_DB.lotes.filter(l => l.productId === productId) 
            : JSON.parse(JSON.stringify(MOCK_DB.lotes));
    },
    
    async saveLote(lote) {
        await delay(100);
        lote.id = Date.now();
        MOCK_DB.lotes.push(lote);
        saveDB();
        return lote;
    },
    
    async uploadCertificateToLote(loteId, fileName) {
        await delay(300);
        const lote = MOCK_DB.lotes.find(l => l.id === loteId);
        if (lote) {
            lote.hasCert = true;
            lote.certificateName = fileName;
            saveDB();
        }
    },
    
    //Llamamos al Servlet para que pase la lista
    async getUsers(){
        try {
            
            const response = await fetch('UsuariosController?action=listarUsu');

            if(!response.ok){
                throw new Error(`Error en el servidor: ${response.status}`);
            }

            return await response.json();


        } catch (e) {
            console.error('Error fetching entities:', e);
            return[];
        }
        
    },

    async getEntities() {
        try{

            const response = await fetch('EntidadesController?action=listar');

            if(!response.ok){
                throw new Error(`Error en el servidor: ${response.status}`);
            }
            return await response.json();

        }catch(e){
            console.error('Error fetching entities:', e);
            return[];
        }
    },
    
    async getTipoEntities(){
        try{

            const response = await fetch('EntidadesController?action=listarTipoEnt');
            
            if(!response.ok){
                throw new Error(`Error en el servidor: ${response.status}`);
            }

            return await response.json();
            
        }catch(e){
            console.error('Error fetching tipo entities:', e);
            return[];
        }
    },

    async getRoles(){
        try{

            const response = await fetch('UsuariosController?action=listarRoles');
            if(!response.ok){
                throw new Error(`Error en el servidor : ${response.status}` );
            }

            return await response.json();

        }catch(e){
            console.error('Error fetching roles:' , e);
            return[];
        }
    },

    async saveEntity(entidadDTO) {
        try{

            const accion = entidadDTO.idEntidad ? 'actualizar' : 'insertar';

            const response = await fetch(`EntidadesController?action=${accion}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entidadDTO)
            });

            if(!response.ok){
                throw new Error(`Error en el servidor: ${response.status}`);
            }

            state.caches.entities = await this.getEntities();

            return true;

        }catch(e){
            console.error('Error saving entity:', e);
            throw new Error('Error al guardar la entidad. Intente nuevamente.');
        }
    },

    async saveUser(usuarioDTO){
        try {

            const accion = usuarioDTO.idUsuario ? 'actualizar' : 'insertar';

            const response = await fetch (`UsuariosController?action=${accion}`, {
                method: 'POST',
                headers: {'Content-Type' : 'application/json'},
                body: JSON.stringify(usuarioDTO)
            });

            if(!response.ok){
                throw new Error(`Error en el servidor: ${response.status}`);
            }

            state.caches.users = await this.getUsers();

            return true;
            
        } catch (error) {
            console.error('Error saving usuario: ',error );
            throw new Error('Error al guardar el usuario. Intente nuevamente.');
        }
    },
    
    async deleteEntity(id) {
        await delay(100);
        MOCK_DB.entities = MOCK_DB.entities.filter(e => e.id !== id);
        saveDB();
    },
    
    async processSale(sale, cart, isProforma = false) {
        await delay(300);
        sale.id = Date.now();
        sale.items = JSON.parse(JSON.stringify(cart));
        
        if (isProforma) {
            sale.correlative = `P001-${String(proformaCounter++).padStart(5, '0')}`;
            MOCK_DB.proformas.push(sale);
            saveCounters();
            saveDB();
            return { type: 'Cotización', data: sale };
        }
        
        if (sale.docType === 'Boleta') sale.correlative = `B001-${String(boletaCounter++).padStart(5, '0')}`;
        else sale.correlative = `F001-${String(facturaCounter++).padStart(5, '0')}`;
        
        MOCK_DB.sales.push(sale);
        saveCounters();
        
        cart.forEach(item => {
            const prod = MOCK_DB.products.find(p => p.id === item.product.id);
            if (prod) {
                prod.stock -= item.quantity;
                MOCK_DB.inventoryMovements.push({
                    id: Date.now() + Math.random(),
                    date: sale.date,
                    type: 'SALIDA',
                    productId: prod.id,
                    quantity: item.quantity,
                    reason: `Venta ${sale.docType} ${sale.correlative}`
                });
            }
        });

        if (sale.installments && sale.installments.length > 0) {
            sale.installments.forEach((inst, idx) => {
                MOCK_DB.installments.push({
                    id: Date.now() + idx,
                    saleId: sale.id,
                    clientId: sale.clientId,
                    dueDate: inst.dueDate,
                    amount: inst.amount,
                    paidAmount: 0,
                    status: 'Pendiente'
                });
            });
        }
        saveDB();
        return { type: sale.docType, data: sale };
    },
    
    async getPurchases() {
        await delay(50);
        return JSON.parse(JSON.stringify(MOCK_DB.purchases));
    },
    
    async savePurchase(purchase) {
        await delay(300);
        purchase.id = Date.now();
        MOCK_DB.purchases.push(purchase);
        
        if (purchase.orderId) {
            const oc = MOCK_DB.purchaseOrders.find(o => o.id === purchase.orderId);
            if (oc) oc.status = 'APROBADA';
        }

        // Iteramos los productos comprados
        purchase.items.forEach(item => {
            const prod = MOCK_DB.products.find(p => p.id === item.productId);
            if (prod) {
                // Aumentamos el stock general
                prod.stock += item.quantity;
                
                // MAGIA: Si el item tiene un lote escrito, lo insertamos en la BD de Lotes
                if (item.loteNumber) {
                    MOCK_DB.lotes.push({
                        id: Date.now() + Math.random(),
                        productId: prod.id,
                        loteNumber: item.loteNumber,
                        dateIn: purchase.date, // Se registra con la fecha de la factura
                        stock: item.quantity,
                        hasCert: false
                    });
                }

                // Generamos el movimiento de Kardex
                MOCK_DB.inventoryMovements.push({
                    id: Date.now() + Math.random(),
                    date: purchase.date,
                    type: 'ENTRADA',
                    productId: prod.id,
                    quantity: item.quantity,
                    reason: `Compra Fac. ${purchase.nroFactura}`
                });
            }
        });
        saveDB();
        return purchase;
    },


    async getPurchaseOrders() {
        await delay(50);
        return JSON.parse(JSON.stringify(MOCK_DB.purchaseOrders));
    },
    
    async savePurchaseOrder(oc) {
        await delay(300);
        oc.id = Date.now();
        oc.correlative = 'OC-' + String(ocCounter++).padStart(4, '0');
        oc.status = 'PENDIENTE';
        MOCK_DB.purchaseOrders.push(oc);
        saveCounters();
        saveDB();
        return oc;
    },

    async getInstallments() {
        await delay(50);
        return JSON.parse(JSON.stringify(MOCK_DB.installments));
    },
    
    async paySaleInstallments(saleId, amount) {
        await delay(100);
        let remaining = parseFloat(amount);
        const insts = MOCK_DB.installments
            .filter(i => i.saleId === saleId && i.status !== 'Cancelada')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        for (let i of insts) {
            if (remaining <= 0) break;
            
            const pendingAmount = i.amount - (i.paidAmount || 0);
            
            if (remaining >= pendingAmount) {
                i.paidAmount = (i.paidAmount || 0) + pendingAmount;
                i.status = 'Cancelada';
                remaining -= pendingAmount;
            } else {
                i.paidAmount = (i.paidAmount || 0) + remaining;
                i.status = 'Parcial';
                remaining = 0;
            }
        }
        saveDB();
    },
    
    async payInstallment(id) {
        await delay(100);
        const inst = MOCK_DB.installments.find(i => i.id === id);
        if (inst) {
            inst.status = 'Pagado';
            saveDB();
        }
    },

    async getMovements() {
        await delay(50);
        return JSON.parse(JSON.stringify(MOCK_DB.inventoryMovements));
    },

    async getSales() {
        await delay(50);
        return JSON.parse(JSON.stringify(MOCK_DB.sales));
    },
    
    async processNotaCredito(nc) {
        await delay(200);
        nc.id = Date.now();
        
        const sale = MOCK_DB.sales.find(s => s.id === nc.saleId);
        if (sale) {
            sale.total -= nc.totalRefunded;
            if (sale.total <= 0) sale.status = 'Anulado';
            else sale.status = 'Devolución Parcial';
        }
        
        nc.returnedItems.forEach(item => {
            const prod = MOCK_DB.products.find(p => p.id === item.productId);
            if (prod) {
                prod.stock += item.quantity;
                MOCK_DB.inventoryMovements.push({
                    id: Date.now() + Math.random(),
                    date: nc.date,
                    type: 'ENTRADA',
                    productId: prod.id,
                    quantity: item.quantity,
                    reason: `Nota Crédito #${nc.id} (Ref: ${sale ? sale.correlative : nc.saleId})`
                });
            }
        });

        MOCK_DB.notasCredito.push(nc);
        saveDB();
        return nc;
    }
};

// 5. Global Reactive Application State
const state = {
    user: JSON.parse(localStorage.getItem('usuario_sesion')) || null,
    currentView: 'dashboard',
    cart: [],
    globalDiscount: 0,
    globalDiscountType: 'S/',
    posPayments: [],
    posInstallments: [],
    posOptionsExpanded: false,
    sidebarCollapsed: false,
    caches: { 
            products: [], 
            entities: [], 
            users: [],
            lotes: [],
            certificados: [],
         },
    liveTimeFormatted: '',
    entitiesFilter: { search: '', type: 'Todos', docType: 'Todos' },
    displayCurrency: 'PEN',
    exchangeRate: 3.75,
    selectedReportId: null,
    reportSearchQuery: '',
    reportsFilter: {
        dateStart: '',
        dateEnd: '',
        client: '',
        seller: '',
        docType: 'Todos',
        supplier: '',
        category: 'Todos',
        product: '',
        stockBajo: false
    }
};

// Expose MOCK_DB and SEED_DB globally for troubleshooting/console reset
window.MOCK_DB = MOCK_DB;
window.resetStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('boletaCounter');
    localStorage.removeItem('facturaCounter');
    localStorage.removeItem('proformaCounter');
    localStorage.removeItem('ocCounter');
    location.reload();
};
