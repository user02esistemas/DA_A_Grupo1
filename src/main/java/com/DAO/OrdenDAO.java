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
                VALUES(?1,?2,GETDATE(),?3,?4,?5)
                """;
        try {
            em.getTransaction().begin();

            Date fechaEntrega = new Date(orden.getFechaEntrega().getTime());
            
            Number idGenerado = (Number) em.createNativeQuery(sql)
                .setParameter(1, orden.getProveedor().getIdEntidad())
                .setParameter(2, orden.getUsuario().getIdUsuario())
                .setParameter(3, fechaEntrega)
                .setParameter(4, 3)
                .setParameter(5, orden.getTotalEstimado())
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

    public boolean actualizarEstadoOrden(int idOrden, int idEstado){
        EntityManager em = emf.createEntityManager();

        String sql = """
                UPDATE ordenes_compra SET id_estado_orden = ?1
                WHERE id_orden = ?2
                """; 

        try {
            em.getTransaction().begin();

            em.createNativeQuery(sql)
                .setParameter(1, idEstado)
                .setParameter(2, idOrden)
                .executeUpdate();
            
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
    public OrdenCompraDTO listarOrden(int idOrden){
       EntityManager em = emf.createEntityManager();

        OrdenCompraDTO orden = null;

        String sqlCabecera = """
                SELECT 
                    O.id_orden,
                    O.fecha_entrega,
                    O.total_estimado,
                    ESTADO.nombre,
                    O.id_proveedor,
                    E.nombre_razon_social
                FROM ordenes_compra AS O
                INNER JOIN entidades AS E ON O.id_proveedor = E.id_entidad
                INNER JOIN estados_sistema AS ESTADO ON O.id_estado_orden = ESTADO.id_estado
                WHERE O.id_orden = ?1
                """;

        String sqlDetalles = """
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
            Query queryCabecera = em.createNativeQuery(sqlCabecera).setParameter(1, idOrden);

            List<Object[]> resultadoCabecera = queryCabecera.getResultList();

            if (resultadoCabecera.isEmpty()) {
                return null;
            }

            Object[] fila = resultadoCabecera.get(0);

            orden = new OrdenCompraDTO();
            orden.setIdOrden(((Number) fila[0]).intValue());
            orden.setFecha(new java.sql.Date(((java.util.Date) fila[1]).getTime()));
            orden.setTotalEstimado(((Number) fila[2]).doubleValue());

            EstadosSistemaDTO estado = new EstadosSistemaDTO();
            estado.setNombreEstado((String) fila[3]);
            orden.setEstado(estado);

            EntidadesDTO entidad = new EntidadesDTO();
            entidad.setIdEntidad(((Number) fila[4]).intValue());
            entidad.setNombre_RazonSocial((String) fila[5]);
            orden.setProveedor(entidad);

            List<DetalleOrdenDTO> detalles = new ArrayList<>();
            Query queryDetalles = em.createNativeQuery(sqlDetalles).setParameter(1, idOrden);
            List<Object[]> resultadoDetalles = queryDetalles.getResultList();

            for (Object[] filaDet : resultadoDetalles) {
                DetalleOrdenDTO detalleO = new DetalleOrdenDTO();
                detalleO.setIdDetalleOrden(((Number) filaDet[0]).intValue());
                detalleO.setCantidadPedida(((Number) filaDet[4]).intValue());
                detalleO.setPrecioUnitarioPactado(((Number) filaDet[5]).doubleValue());

                ProductosDTO prod = new ProductosDTO();
                prod.setId_producto(((Number) filaDet[1]).intValue());
                prod.setNombre_descripcion((String) filaDet[2]);
                prod.setManeja_lote((Boolean) filaDet[3]);
                detalleO.setProducto(prod);

                detalles.add(detalleO);
            }

            orden.setDetalles(detalles);
  
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
                    O.fecha_pedido,
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
                orden.setFecha(new java.sql.Date(((java.util.Date) fila[1]).getTime()));
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
