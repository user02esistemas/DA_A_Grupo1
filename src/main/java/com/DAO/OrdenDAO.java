package com.DAO;

import java.sql.Date;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Query;

import com.DTO.*;


import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;

public class OrdenDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");

    public boolean insertarOrden(OrdenCompraDTO orden){
        EntityManager em = emf.createEntityManager();

        String sql = """
                INSERT INTO ordenes_compra (
                                            id_proveedor,
                                            id_usuario,
                                            fecha_pedido,
                                            fecha_entrega,
                                            id_estado_orden,
                                            total_estimado)
                OUTPUT INSERTED.id_orden
                VALUES(?1,?2,?3,?4,?5,?6)
                """;
        try {
            em.getTransaction().begin();

            Date fechaPedido = new Date(orden.getFecha().getTime());
            Date fechaEntrega = new Date(orden.getFechaEntrega().getTime());
            
            Number idGenerado = (Number) em.createNativeQuery(sql)
                .setParameter(1, orden.getProveedor().getIdEntidad())
                .setParameter(2, orden.getUsuario().getIdEntidad())
                .setParameter(3, fechaPedido)
                .setParameter(4, fechaEntrega)
                .setParameter(5, 3)
                .setParameter(6, orden.getTotalEstimado())
                .getSingleResult();

            int idOrden = idGenerado.intValue();

            if(orden.getDetalles() != null && !orden.getDetalles().isEmpty()){
                for(DetalleOrdenDTO detalle : orden.getDetalles()){

                    if (detalle.getOrden() == null) {
                        detalle.setOrden(new OrdenCompraDTO());
                    }

                    detalle.getOrden().setIdOrden(idOrden);
                    boolean insertado = insertarDetalleOrden(em, detalle);
                    if(!insertado){
                        throw new Exception("Error al insertar un producto en la orden");
                    }
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
        } finally {
            em.close();
        }

    }   

    public boolean insertarDetalleOrden(EntityManager em,DetalleOrdenDTO detalle){
        try {
            
            String sql = """
                    INSERT INTO detalle_orden (
                                                id_orden,
                                                id_producto,
                                                cantidad_pedida,
                                                precio_unitario_pactado)
                    VALUES(?1,?2,?3,?4)
                    """;
            em.createNativeQuery(sql)
                .setParameter(1, detalle.getOrden().getIdOrden())
                .setParameter(2, detalle.getProducto().getId_producto())
                .setParameter(3, detalle.getCantidadPedida())
                .setParameter(4, detalle.getPrecioUnitarioPactado())
                .executeUpdate();
            
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    public List<OrdenCompraDTO> listarOrdenesPendientes(){
       EntityManager em = emf.createEntityManager();
       List<OrdenCompraDTO> lista = new ArrayList<>();
       String sql = """
               SELECT 
                    O.id_orden,
                    E.nombre_razon_social
                FROM ordenes_compra AS O
                INNER JOIN entidades AS E ON O.id_proveedor = E.id_entidad
                WHERE O.id_estado_orden = 3
               """; 
        try {
            Query query = em.createNativeQuery(sql);
            List<Object[]> resultado = query.getResultList();

            for(Object[] fila: resultado){
                OrdenCompraDTO orden = new OrdenCompraDTO();
                EntidadesDTO entidad = new EntidadesDTO();

                orden.setIdOrden(((Number)fila[0]).intValue());
                entidad.setNombre_RazonSocial((String)fila[1]);
                orden.setProveedor(entidad);

                lista.add(orden);
            }
  
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }

        return lista;
    }
    
    @SuppressWarnings("unchecked")
    public OrdenCompraDTO listarOrden(OrdenCompraDTO orden){
       EntityManager em = emf.createEntityManager();

       List<DetalleOrdenDTO> detalles = orden.getDetalles();
        if (detalles == null) {
            detalles = new ArrayList<>();
            orden.setDetalles(detalles);
        }

       String sql = """
                SELECT 
                    DO.id_detalle_orden,
                    DO.id_producto,
                    P.nombre_descripcion,
                    P.maneja_lote,
                    DO.cantidad_pedida,
                    DO.precio_unitario_pactado
                FROM detalle_orden AS DO
                INNER JOIN productos AS P ON DO.id_producto = P.id_producto
                WHERE DO.id_orden = ?1
               """; 
        try {
            Query query = em.createNativeQuery(sql)
                .setParameter(1, orden.getIdOrden());
            List<Object[]> resultado = query.getResultList();

            for(Object[] fila: resultado){
                DetalleOrdenDTO detalleO = new DetalleOrdenDTO();
                detalleO.setIdDetalleOrden(((Number)fila[0]).intValue());
                detalleO.setCantidadPedida(((Number)fila[4]).intValue());
                detalleO.setPrecioUnitarioPactado(((Number)fila[5]).doubleValue());

                ProductosDTO prod = new ProductosDTO();
                prod.setId_producto(((Number)fila[1]).intValue());
                prod.setNombre_descripcion((String)fila[2]);
                prod.setManeja_lote((Boolean)fila[3]);

                detalleO.setProducto(prod);

                detalles.add(detalleO);
            }
  
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }

        return orden;
    }
    
    @SuppressWarnings("unchecked")
    public List<OrdenCompraDTO> listarTodasLasOrdenes() {
        EntityManager em = emf.createEntityManager();
        List<OrdenCompraDTO> lista = new ArrayList<>();
        String sql = """
                SELECT 
                    O.id_orden,
                    O.fecha,
                    O.total_estimado,
                    ESTADO.nombre,
                    E.nombre_razon_social
                FROM ordenes_compra AS O
                INNER JOIN entidades AS E ON O.id_proveedor = E.id_entidad
                INNER JOIN estados_sistema AS ESTADO ON O.id_estado_orden = ESTADO.id_estado
                """; 
        try {
            Query query = em.createNativeQuery(sql);
            List<Object[]> resultado = query.getResultList();

            for (Object[] fila : resultado) {
                OrdenCompraDTO orden = new OrdenCompraDTO();
                EntidadesDTO entidad = new EntidadesDTO();

                orden.setIdOrden(((Number) fila[0]).intValue());
                orden.setFecha((Date) fila[1]);
                orden.setTotalEstimado(((Number) fila[2]).doubleValue());
                EstadosSistemaDTO estado = new EstadosSistemaDTO();
                estado.setNombreEstado((String)fila[3]);
                orden.setEstado(estado);

                entidad.setNombre_RazonSocial((String) fila[4]);
                orden.setProveedor(entidad);

                lista.add(orden);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }

        return lista;
    }

}
