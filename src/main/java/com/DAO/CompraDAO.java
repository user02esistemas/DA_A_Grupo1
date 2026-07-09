package com.DAO;
import com.DTO.*;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import jakarta.persistence.Query;

public class CompraDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");
    
    private ProductosDAO prod = new ProductosDAO();

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

            if(compra.getOrden() != null){
                idOrden = compra.getOrden().getIdOrden();
            }

            Number idGenerado = (Number) em.createNativeQuery(sql)
                    .setParameter(1, idOrden)
                    .setParameter(2, compra.getUsuario().getIdEntidad())
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

    // Lista todas las compras ya recibidas en almacén, con el proveedor
    // incluido. Se usa en el Dashboard, Reportes e Historial de Compras.
    @SuppressWarnings("unchecked")
    public List<CompraDTO> listarTodasLasCompras(){
        EntityManager em = emf.createEntityManager();
        List<CompraDTO> lista = new ArrayList<>();

        String sql = """
                    SELECT
                        C.id_compra,
                        C.serie_correlativa,
                        C.tipo_comprobante,
                        C.fecha_compra,
                        C.monto_total,
                        E.id_entidad,
                        E.nombre_razon_social
                    FROM compras C
                    INNER JOIN entidades E ON C.id_proveedor = E.id_entidad
                    ORDER BY C.id_compra DESC
                """;
        try {
            List<Object[]> filas = em.createNativeQuery(sql).getResultList();

            for (Object[] fila : filas) {
                CompraDTO compra = new CompraDTO();
                compra.setIdCompra(((Number) fila[0]).intValue());
                compra.setSerieCorrelativa((String) fila[1]);
                compra.setTipoComprobante((String) fila[2]);
                compra.setFechaCompra((java.util.Date) fila[3]);
                compra.setMontoTotal(((Number) fila[4]).doubleValue());

                EntidadesDTO proveedor = new EntidadesDTO();
                proveedor.setIdEntidad(((Number) fila[5]).intValue());
                proveedor.setNombre_RazonSocial((String) fila[6]);
                compra.setProveedor(proveedor);

                lista.add(compra);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }
        return lista;
    }


}
