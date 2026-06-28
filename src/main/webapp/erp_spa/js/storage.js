
    const STORAGE_KEY = 'DELGADO_ERP_MOCK_DB';

    let MOCK_DB = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!MOCK_DB) {
        MOCK_DB = JSON.parse(JSON.stringify(SEED_DB));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DB));
    }

    function saveDB() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DB));
    }


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
            try {
                const response = await fetch('InventarioController?action=listarProductos');
                if(!response.ok) throw new Error(`Error en el servidor: ${response.status}`);
                return await response.json();
            } catch (e) {
                console.error('Error fetching products:', e);
                return [];
            }
        },
        
        async saveProduct(producto, lote) {
            try {
                const response = await fetch('InventarioController?action=insertar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ producto: producto, lote: lote })
                });

                if (!response.ok) throw new Error(`Error en el servidor: ${response.status}`);
                
                state.caches.products = await this.getProducts(); // Refresh
                return await response.json();
            } catch (e) {
                console.error('Error saving product:', e);
                throw e;
            }
        },
        
        async deleteProduct(id) {
            await delay(100);
            MOCK_DB.products = MOCK_DB.products.filter(p => p.id !== id);
            saveDB();
        },
        
        async getLotes(productId) {
            try {
                const response = await fetch(`InventarioController?action=listarLotesPrd&idProducto=${encodeURIComponent(productId)}`);
                if (!response.ok) throw new Error(`Error: ${response.status}`);
                return await response.json();
            } catch (e) {
                console.error('Error al obtener lotes:', e);
                return [];
            }
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
                console.error('Error fetching users:', e);
                return[];
            }
            
        },

        async getPaymentMethods(){
            try {
                const response = await fetch('VentaController?action=listarMetodos');

                if(!response.ok){
                    throw new Error(`Error en el servidor: ${response.status}`);
                }

                return await response.json();
            } catch (e) {
                console.error('Error fetching method:', e);
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
        
        async saveSale(venta) {
            try {
                const response = await fetch('VentaController?action=insertar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ venta: venta })
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Error al procesar la venta');
                }
                return await response.json();
            } catch (e) {
                console.error('Error saving sale:', e);
                throw e;
            }
        },
        
        async getPurchases() {
            await delay(50);
            return JSON.parse(JSON.stringify(MOCK_DB.purchases));
        },
        
        async savePurchase(compra) {
            try {
                const response = await fetch('CompraController?action=insertarCompra', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(compra)
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Error al procesar la compra');
                }
                
                return await response.json();
            } catch (e) {
                console.error('Error saving purchase:', e);
                throw e;
            }
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

        async getSales() {
            await delay(50);
            return JSON.parse(JSON.stringify(MOCK_DB.sales));
        },

        async getMovements(productId) {
            if (!productId) {
                console.error("Kardex Error: No se recibió un ID de producto válido.");
                return [];
            }
            
            try {
                // Usamos la URL completa y verificamos los parámetros
                const url = `InventarioController?action=kardex&idProducto=${encodeURIComponent(productId)}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    console.error("Respuesta del servidor no fue ok:", response.status);
                    throw new Error(`Error en el servidor: ${response.status}`);
                }
                
                return await response.json();
            } catch (e) {
                console.error('Error al obtener Kardex:', e);
                return [];
            }
        },

        async getRecentMovements() {
            try {
                const response = await fetch('InventarioController?action=movimientosRecientes');
                if (!response.ok) throw new Error(`Error: ${response.status}`);
                return await response.json();
            } catch (e) {
                console.error('Error al obtener movimientos recientes:', e);
                return [];
            }
        },

        async getSalesCredt() {
            try {
                const response = await fetch('VentaController?action=listarPagos');

                if(!response.ok){
                    throw new Error(`Error en el servidor: ${response.status}`);
                }
                return await response.json();
                
            } catch (e) {
                console.error('Error fetching entities:', e);
                return[];
            }
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
