package com.DAO;
import com.DTO.*;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import java.util.*;

import jakarta.persistence.Query;

public class CompraDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");
    
    private ProductosDAO prod = new ProductosDAO();
    private LotesDAO loteDAO = new LotesDAO();
    private OrdenDAO ordenDAO = new OrdenDAO();

    public boolean insertarCompra(CompraDTO compra){
        EntityManager em  = emf.createEntityManager();

        String sql = """
                    INSERT INTO compras (
                                            id_orden,
                                            id_usuario,
                                            id_proveedor,
                                            tipo_comprobante,
                                            serie_correlativa,
                                            fecha_compra,
                                            monto_total)
                    OUTPUT INSERTED.id_compra
                    VALUES(?1,?2,?3,?4,?5,GETDATE(),?6)
                """;
        try {

            em.getTransaction().begin();
            Integer idOrden = null;

            if(compra.getOrden() != null && compra.getOrden().getIdOrden() != null){
                idOrden = compra.getOrden().getIdOrden();
                boolean ordenAprobada = ordenDAO.actualizarEstadoOrden(idOrden, 23);
                if(!ordenAprobada){
                    throw new Exception("Error al aprobar orden de compra");
                }
            }

            Number idGenerado = (Number) em.createNativeQuery(sql)
                    .setParameter(1, idOrden)
                    .setParameter(2, compra.getUsuario().getIdUsuario())
                    .setParameter(3, compra.getProveedor().getIdEntidad())
                    .setParameter(4, compra.getTipoComprobante())
                    .setParameter(5, compra.getSerieCorrelativa())
                    .setParameter(6, compra.getMontoTotal())
                    .getSingleResult();
                    
            int idCompra = idGenerado.intValue();

            if(compra.getDetallesCom() != null && !compra.getDetallesCom().isEmpty()){
                for(DetalleCompraDTO detalle : compra.getDetallesCom()){
                    if(detalle.getCompra() == null){
                        detalle.setCompra(new CompraDTO());
                    }

                    detalle.getCompra().setIdCompra(idCompra);

                    if(detalle.getLote().getNumero_lote()!= null && !detalle.getLote().getNumero_lote().trim().isEmpty()){
                        LotesDTO loteInsertar = new LotesDTO();
                        loteInsertar.setProducto(detalle.getProducto());
                        loteInsertar.setNumero_lote(detalle.getLote().getNumero_lote());
                        loteInsertar.setStock_lote(detalle.getCantidad());
                        
                        int insertarLote = loteDAO.insertarLotes(loteInsertar);

                        if(insertarLote == -1){
                            throw new Exception("Error al insertar un lote de la compra");
                        }

                        detalle.getLote().setId_lote(insertarLote);
                    }else{
                        detalle.getLote().setId_lote(null);
                    }
                

                    boolean insertado = insertarDetalleCompra(em, detalle);

                    if(!insertado){
                        throw new Exception("Error al insertar un producto en la orden");
                    }

                    MovimientosDTO movimiento = new MovimientosDTO();
                    movimiento.setIdProducto(detalle.getProducto().getId_producto());
                    
                    Integer idLote = (detalle.getLote() != null) ? detalle.getLote().getId_lote() : null;
                    movimiento.setIdLote(idLote);
                    movimiento.setCantidad(detalle.getCantidad());
                    movimiento.setIdTipoMovimiento(1);
                    movimiento.setReferencia(" Compra " + compra.getTipoComprobante() + " " + compra.getSerieCorrelativa());

                    boolean stockActualizado = prod.procesarMovimiento(em, movimiento);
                    if(!stockActualizado){
                        throw new Exception("Error al actualizar un stock del producto");
                    }
                    prod.movimientoInventario(em, movimiento);

                }
            }

            em.getTransaction().commit();
            return true;
            
        } catch (Exception e) {
            e.printStackTrace();
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            return false;
        }finally {
            em.close();
        }  
    }
    

    public boolean insertarDetalleCompra(EntityManager em, DetalleCompraDTO detalle){
        try {
            
            String sql = """
                        INSERT INTO detalle_compras (
                                                        id_compra,
                                                        id_producto,
                                                        id_lote,
                                                        cantidad,
                                                        precio_costo_unitario)
                        VALUES(?1,?2,?3,?4,?5)
                    """;
            Integer idLote = (detalle.getLote() != null) ? detalle.getLote().getId_lote() : null;
            em.createNativeQuery(sql)
                .setParameter(1, detalle.getCompra().getIdCompra())
                .setParameter(2, detalle.getProducto().getId_producto())
                .setParameter(3, idLote)
                .setParameter(4, detalle.getCantidad())
                .setParameter(5, detalle.getPrecio_costo_unitario())
                .executeUpdate();
            
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

     @SuppressWarnings("unchecked")
    public List<CompraDTO> listarTodasCompras(){
        EntityManager em = emf.createEntityManager();
        List<CompraDTO> listaCompras = new ArrayList<>();

        String sql = """
                SELECT 
                C.id_compra,
                C.serie_correlativa,
                E.nombre_razon_social,
                C.fecha_compra,
                C.monto_total
                FROM compras AS C
                INNER JOIN entidades AS E ON C.id_proveedor = E.id_entidad
                """;
        
        try {
            Query query = em.createNativeQuery(sql);
            List<Object[]> results = query.getResultList();

            for(Object[] fila: results){
                CompraDTO compra = new CompraDTO();
                compra.setIdCompra(((Number)fila[0]).intValue());
                compra.setSerieCorrelativa((String)fila[1]);
                
                EntidadesDTO proveedor = new EntidadesDTO();
                proveedor.setNombre_RazonSocial((String)fila[2]);
                compra.setProveedor(proveedor);

                compra.setFechaCompra(new java.sql.Date(((java.util.Date) fila[3]).getTime()));
                compra.setMontoTotal(((Number)fila[4]).doubleValue());

                listaCompras.add(compra);
            }

        } catch (Exception e) {
             e.printStackTrace();
        } finally {
            em.close();
        }

        return listaCompras;
    }

    @SuppressWarnings("unchecked")
    public CompraDTO obtenerCompra(int idCompra){
        EntityManager em = emf.createEntityManager();

        CompraDTO compra = null;

        String sqlCabecera = """
                 SELECT 
                    C.id_compra,
                    C.serie_correlativa,
                    E.nombre_razon_social,
                    C.fecha_compra,
                    C.monto_total
                FROM compras AS C
                INNER JOIN entidades AS E ON C.id_proveedor = E.id_entidad
                WHERE C.id_compra = ?1
                """;
        
        String sqlDetalles = """
                SELECT
                    DC.id_detalle_compra,
                    DC.cantidad,
                    DC.precio_costo_unitario,
                    P.nombre_descripcion,
                    P.maneja_lote,
                    L.numero_lote
                FROM detalle_compras AS DC
                INNER JOIN productos AS P ON DC.id_producto = P.id_producto
                LEFT JOIN lotes AS L ON DC.id_lote = L.id_lote
                WHERE DC.id_compra = ?1
                """;

        try {
            Query queryCabecera = em.createNativeQuery(sqlCabecera)
                .setParameter(1, idCompra);
            
            List<Object[]> resultadoCabecera = queryCabecera.getResultList();

            if (resultadoCabecera.isEmpty()) {
                return null;
            }

            Object[] fila = resultadoCabecera.get(0);

            compra = new CompraDTO();
            compra.setIdCompra(((Number)fila[0]).intValue());
            compra.setSerieCorrelativa((String)fila[1]);
            
            EntidadesDTO proveedor = new EntidadesDTO();
            proveedor.setNombre_RazonSocial((String)fila[2]);
            compra.setProveedor(proveedor);

            compra.setFechaCompra(new java.sql.Date(((java.util.Date) fila[3]).getTime()));
            compra.setMontoTotal(((Number)fila[4]).doubleValue());

            List<DetalleCompraDTO> detalles = new ArrayList<>();
            Query queryDetalles = em.createNativeQuery(sqlDetalles)
                .setParameter(1, idCompra);
            List<Object[]> resultadoDetalles = queryDetalles.getResultList();

            for(Object[] filaDet: resultadoDetalles){
                DetalleCompraDTO detalleC = new DetalleCompraDTO();
                detalleC.setIdDetalleCompra(((Number)filaDet[0]).intValue());
                detalleC.setCantidad(((Number)filaDet[1]).intValue());
                detalleC.setPrecio_costo_unitario(((Number)filaDet[2]).doubleValue());
                
                ProductosDTO producto = new ProductosDTO();
                producto.setNombre_descripcion((String)filaDet[3]);
                Object filaLote = filaDet[4]; 
                boolean manejaLoteVal = false;

                if (filaLote instanceof Boolean) {
                    manejaLoteVal = (Boolean) filaLote;
                } else if (filaLote instanceof Number) {
                    manejaLoteVal = ((Number) filaLote).intValue() != 0;
                }

                producto.setManeja_lote(manejaLoteVal);

                detalleC.setProducto(producto);

                LotesDTO lote = new LotesDTO();
                lote.setNumero_lote((String)filaDet[5]);
                detalleC.setLote(lote);

                detalles.add(detalleC);
            }

            compra.setDetallesCom(detalles);

        } catch (Exception e) {
           e.printStackTrace();
        } finally {
            em.close();
        }

        return compra;
    }



}
