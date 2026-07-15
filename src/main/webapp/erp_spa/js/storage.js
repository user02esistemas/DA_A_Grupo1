    const STORAGE_KEY = 'DELGADO_ERP_MOCK_DB';

    let MOCK_DB = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!MOCK_DB) {
        MOCK_DB = {};
    }

    if (!MOCK_DB.exchangeRates) {
        MOCK_DB.exchangeRates = [
            { id: 1, from: 'USD', to: 'PEN', rate: 3.75, date: '2026-06-01', status: 'Activo' }
        ];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DB));

    function saveDB() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DB));
    }


    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // 4. API Service Layer
    const api = {

        getUsuarioId() {
            if (state.user?.idUsuario) return state.user.idUsuario;
            if (state.user?.id) return state.user.id;
            try {
                const sesionStorage = JSON.parse(localStorage.getItem('usuario_sesion') || 'null');
                if (sesionStorage?.idUsuario) return sesionStorage.idUsuario;
                if (sesionStorage?.id) return sesionStorage.id;
            } catch (_) {}
            return null;
        },

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
            
        },
        
        async uploadCertificateToLote(loteId, fileName) {
            
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
            try {
                
                const response = await fetch('CompraController?action=listarCompras');

                if(!response.ok){
                    throw new Error(`Error en el servidor: ${response.status}`);
                }

                return await response.json();


            } catch (error) {
                console.error('Error fetching compras:', error)
                return[];
            }
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

        async getPurchaseById(idCompra) {
            try {
                const response = await fetch(`CompraController?action=obtenerCompra&idCompra=${idCompra}`);
                if (!response.ok) {
                    throw new Error(`Error en el servidor: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('Error fetching compra por id:', error);
                return null;
            }
        },

        async getPendingPurchaseOrders(){
            try {
                
                const response = await fetch('CompraController?action=ordenesPendientes');

                if(!response.ok){
                    throw new Error(`Error en el servidor: ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                console.error('Error fetching ordenes pendientes', error);
                return[]
            }
        },

        async getPurchaseOrderById(idOrden){
            try {
                const response = await fetch(`CompraController?action=listarOrden&idOrden=${idOrden}`);
                if (!response.ok) {
                    throw new Error(`Error en el servidor: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('Error fetching orden por id:', error);
                return null;
            }
        },

        async rejectPurchaseOrder (idOrden, idEstado){
            const response = await fetch(`CompraController?action=rechazarOrden&idOrden=${idOrden}&idEstado=${idEstado}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`Error en el servidor: ${response.status}`);
            }

            return await response.json();
        },

        async getPurchaseOrders() {
            try {
                const response = await fetch('CompraController?action=listarOrdenes');

                if(!response.ok){
                    throw new Error(`Error en el servidor: ${response.status}`);
                }

                return await response.json();

            } catch (error) {
                console.error('Error fetching ordenes de compra:', error);
                return[];
            }
        },
   
        async savePurchaseOrder(oc) {
           try {
                const response = await fetch(`CompraController?action=insertarOrden`,{
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(oc)
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Error al procesar la orden de compra');
                }
           } catch (error) {
            console.error('Error saving purchase:', error);
            throw error;
           }
        },

        async getInstallments() {
           return [];
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
            
        },

        async getSales() {
            return [];
        },

        async getMovements(productId) {            
            try {
                
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

window.MOCK_DB = MOCK_DB;
window.saveDB = saveDB;

    
