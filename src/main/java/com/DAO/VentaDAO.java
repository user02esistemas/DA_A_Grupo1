package com.DAO;

import java.sql.Date;
import java.util.ArrayList;
import java.util.List;

import com.DTO.CuotaDTO;
import com.DTO.DetallePagoDTO;
import com.DTO.DetalleVentaDTO;
import com.DTO.MovimientosDTO;
import com.DTO.PagoDTO;
import com.DTO.MetodosPagoDTO;
import com.DTO.VentaDTO;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import jakarta.persistence.Query;

public class VentaDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");

    private ProductosDAO prod = new ProductosDAO();

    public boolean insertarVenta(VentaDTO venta, PagoDTO pagoInicial){
        EntityManager em = emf.createEntityManager();
        String sql = """
                INSERT INTO ventas (
                                    id_cliente,
                                    id_usuario,
                                    id_venta_origen,
                                    serie_correlativa,
                                    tipo_comprobante,
                                    fecha_emision,
                                    id_estado_venta,
                                    subtotal,
                                    descuento_global,
                                    total)
                    OUTPUT INSERTED.id_venta
                    VALUES (?1,?2,?3,?4,?5,GETDATE(),?6,?7,?8,?9)  
                
                """;
        try {

            em.getTransaction().begin();
            Integer idVentaReferencia = null;
            
            if(venta.getId_venta_referencia() != null){
                idVentaReferencia = venta.getId_venta_referencia();
            }

            Number idGenerado = (Number) em.createNativeQuery(sql)
                .setParameter(1, venta.getCliente().getIdEntidad())
                .setParameter(2, venta.getUsuario().getIdEntidad())
                .setParameter(3, idVentaReferencia)
                .setParameter(4, venta.getSerie_correlativa())
                .setParameter(5, venta.getTipo_comprobante())
                .setParameter(6, 6)
                .setParameter(7, venta.getSubTotal())
                .setParameter(8, venta.getDescuento_global())
                .setParameter(9, venta.getTotal())
                .getSingleResult();
            
            int idVenta = idGenerado.intValue();
            venta.setIdVenta(idVenta);

            if(venta.getDetalle() != null && !venta.getDetalle().isEmpty()){
                for(DetalleVentaDTO detalle : venta.getDetalle()){
                    if(detalle.getVenta() == null){
                        detalle.setVenta(new VentaDTO());
                    }

                    detalle.getVenta().setIdVenta(idVenta);
                    boolean insertado = insertarDetalle(em, detalle);
                    
                    if(!insertado){
                        throw new Exception("Error al insertar un producto en la venta");
                    }

                    MovimientosDTO movimiento = new MovimientosDTO();
                    movimiento.setIdProducto(detalle.getProducto().getId_producto());
                    movimiento.setIdLote(detalle.getLote().getId_lote());
                    movimiento.setCantidad(detalle.getCantidad());
                    movimiento.setIdTipoMovimiento(2);
                    movimiento.setReferencia(" Venta " + venta.getTipo_comprobante() + " " + venta.getSerie_correlativa());
                    
                    boolean stockActualizado = prod.procesarMovimiento(em, movimiento);
                    if(!stockActualizado){
                        throw new Exception("Error al actualizar un stock del producto");
                    }

                    prod.movimientoInventario(em, movimiento);
                    
                }
            }

            if (pagoInicial != null && pagoInicial.getMonto_total() > 0) {
                if (pagoInicial.getVenta() == null) {
                    pagoInicial.setVenta(new VentaDTO());
                }

                pagoInicial.getVenta().setIdVenta(idVenta);
                
                int idPago = insertarPagoInmediato(em, pagoInicial);

                if (idPago == -1) {
                    throw new Exception("Error al registrar el pago inicial de la venta.");
                }
            }

            if(venta.getCuotas() != null && !venta.getCuotas().isEmpty()){
                    for(CuotaDTO cuota : venta.getCuotas()){
                        if(cuota.getVenta() == null){
                            cuota.setVenta(new VentaDTO());
                        }

                        cuota.getVenta().setIdVenta(idVenta);
                        boolean generarCuota = insertarCuota(em, cuota);
                        if(!generarCuota){
                            throw new Exception("Error al generar el cronograma de cuotas de la venta.");
                        }
                    }

            }

            actualizarEstadoVenta(em, venta);

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

    public boolean actualizarEstadoVenta(EntityManager em, VentaDTO venta){
        try {
            String sqlCheckVenta = """
                    SELECT 
                        CASE 
                            WHEN V.total <= COALESCE((SELECT SUM(P.monto_total) FROM pagos P WHERE P.id_venta = V.id_venta), 0) 
                            THEN 1 
                            ELSE 0 
                        END AS esta_pagada
                    FROM ventas V
                    WHERE V.id_venta = ?1
                    """;

            Number estaPagada = (Number) em.createNativeQuery(sqlCheckVenta)
                    .setParameter(1, venta.getIdVenta())
                    .getSingleResult();

            if (estaPagada.intValue() == 1) {
                em.createNativeQuery("UPDATE ventas SET id_estado_venta = 8 WHERE id_venta = ?1")
                  .setParameter(1, venta.getIdVenta())
                  .executeUpdate();
            }

            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }


    public boolean insertarDetalle(EntityManager em, DetalleVentaDTO detalle){
         try {
             String sql = """
                             INSERT INTO detalle_ventas(
                                                     id_venta,
                                                         id_producto,
                                                     id_lote,
                                                       cantidad,
                                                     precio_unitario,
                                                     descuento_producto,
                                                     sub_total)
                            VALUES (?1,?2,?3,?4,?5,?6,?7)
                     """;
             em.createNativeQuery(sql)
                 .setParameter(1, detalle.getVenta().getIdVenta())
                 .setParameter(2, detalle.getProducto().getId_producto())
                 .setParameter(3, detalle.getLote().getId_lote())
                 .setParameter(4, detalle.getCantidad())
                 .setParameter(5, detalle.getPrecio_unitario())
                 .setParameter(6, detalle.getDescuento_prod())
                 .setParameter(7, detalle.getSub_total())
                 .executeUpdate();
                 ;
             return true;
         } catch (Exception e) {
            e.printStackTrace();
            return false;
         }
    }
    
    public boolean insertarCuota(EntityManager em, CuotaDTO cuota){
        try {
            
            String sql = """
                    INSERT INTO cuotas (
                                        id_venta,
                                        numero_cuota,
                                        fecha_vencimiento,
                                        monto,
                                        id_estado_cuota)
                    VALUES (?1,?2,?3,?4,?5)
                    """;
            Date fechaVencimiento = new Date(cuota.getFechaVencimiento().getTime());
            em.createNativeQuery(sql)
                .setParameter(1, cuota.getVenta().getIdVenta())
                .setParameter(2, cuota.getNumeroCuota())
                .setParameter(3, fechaVencimiento)
                .setParameter(4, cuota.getMonto())
                .setParameter(5, 9)
                .executeUpdate();        

            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    public List<MetodosPagoDTO> listarMetodosDPago(){
        EntityManager em = emf.createEntityManager();
        List<MetodosPagoDTO> listaMDPago = new ArrayList<>();
        String sql = """
                SELECT id_metodo_pago,
                        nombre
                FROM  metodos_pago
                """;
        try {
            Query query = em.createNativeQuery(sql);
            List<Object[]> results = query.getResultList();

            for(Object[] fila : results){
                MetodosPagoDTO metodo = new MetodosPagoDTO();
                metodo.setIdMetodoPago(((Number) fila[0]).intValue());
                metodo.setNombre((String)fila[1]);
                listaMDPago.add(metodo);
            }


        } catch (Exception e) {
             e.printStackTrace();
        } finally {
            em.close();
        }

        return listaMDPago;
    }

    public int insertarPagoInmediato(EntityManager em, PagoDTO pago){
        try {
            String sql = """
                    INSERT INTO pagos (
                                        id_venta,
                                        id_metodo_pago,
                                        monto_total,
                                        fecha,
                                        referencia_pago)
                    OUTPUT INSERTED.id_pago
                    VALUES (?1,?2,?3,GETDATE(),?4)
                    """;
            Number idPago = (Number) em.createNativeQuery(sql)
                .setParameter(1, pago.getVenta().getIdVenta())
                .setParameter(2, pago.getMetodo().getIdMetodoPago())
                .setParameter(3, pago.getMonto_total())
                .setParameter(4, pago.getReferencia())
                .getSingleResult();

            return idPago.intValue();
            
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }


    @SuppressWarnings("unchecked")
    public boolean procesarAbono(PagoDTO pago){
        EntityManager em = emf.createEntityManager();
        try {
            
            em.getTransaction().begin();
            
            int idPago = insertarPagoInmediato(em, pago);

            if(idPago == -1){
                throw new Exception("Error al registrar pago maestro.");
            }

            pago.setIdPago(idPago);

            int idVenta = pago.getVenta().getIdVenta();
            

            String sqlCuotas = """
                    SELECT id_cuota, numero_cuota, fecha_vencimiento, monto, id_estado_cuota 
                    FROM cuotas 
                    WHERE id_venta = ?1 AND id_estado_cuota <> 10
                    ORDER BY fecha_vencimiento ASC
                    """;
            List<Object[]> cuotasPendientes = em.createNativeQuery(sqlCuotas)
                    .setParameter(1, idVenta)
                    .getResultList();

            double saldoAbonar = pago.getMonto_total();
            

            for(Object[] fila: cuotasPendientes){
                if(saldoAbonar <= 0) break;

                int id_cuota = ((Number)fila[0]).intValue();
                double montoCuotaTotal = ((Number)fila[3]).doubleValue();
                double yaPagado = montoPagadoCuota(em, id_cuota);

                double saldoPendienteCuota = montoCuotaTotal - yaPagado;

                if(saldoPendienteCuota <= 0) continue;

                double aplicarMonto = Math.min(saldoPendienteCuota, saldoAbonar);

                saldoAbonar -= aplicarMonto;

                

                DetallePagoDTO detalle = new DetallePagoDTO();
                CuotaDTO cuota = new CuotaDTO();
                cuota.setIdCuota(id_cuota);
                detalle.setCuota(cuota);
                detalle.setMonto(aplicarMonto);

                detalle.setPago(pago);

                boolean cuotaPagada = insertarDetallePago(em, detalle);
                if(!cuotaPagada){
                    throw new Exception("Error al registrar pago de cuaota.");
                }

                boolean cuotaActualizada = actualizarEstadoCuotaDinamico(em, detalle);
                if(!cuotaActualizada){
                    throw new Exception("Error al actualizar estado cuota.");
                }        
            }

            actualizarEstadoVenta(em, pago.getVenta());

            em.getTransaction().commit();
            return true;
        } catch (Exception e) {
           e.printStackTrace();
            if (em.getTransaction().isActive()){
                em.getTransaction().rollback();
            }
            return false;
        } finally {
            em.close();
        }
    }

    public double montoPagadoCuota(EntityManager em, int id_cuota){
        Number yaPagado = null;
        try {
            String sqlYaPagado = "SELECT COALESCE(SUM(monto), 0) FROM detalle_pagos WHERE id_cuota = ?1";
            
            yaPagado = (Number) em.createNativeQuery(sqlYaPagado)
                        .setParameter(1, id_cuota)
                        .getSingleResult();
            
            
        } catch (Exception e) {
             e.printStackTrace();
             return 0.0;
        }
        
        return yaPagado.doubleValue();
    }

    public boolean actualizarEstadoCuotaDinamico(EntityManager em, DetallePagoDTO detalle) {
        try {
            String sql = """
                    UPDATE cuotas 
                    SET id_estado_cuota = CASE 
                        WHEN (SELECT COALESCE(SUM(dp.monto), 0) FROM detalle_pagos dp WHERE dp.id_cuota = ?1) >= cuotas.monto 
                        THEN 10 
                        ELSE 9 
                    END
                    WHERE id_cuota = ?1
                    """;
            
            em.createNativeQuery(sql)
                .setParameter(1, detalle.getCuota().getIdCuota())
                .executeUpdate();
            
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean insertarDetallePago(EntityManager em, DetallePagoDTO detalle){
        try {

            String sql = """
                    INSERT INTO detalle_pagos (
                                                id_pago,
                                                id_cuota,
                                                monto)
                    VALUES (?1,?2,?3)
                    """;
            em.createNativeQuery(sql)
                .setParameter(1, detalle.getPago().getIdPago())
                .setParameter(2, detalle.getCuota().getIdCuota())
                .setParameter(3, detalle.getMonto())
                .executeUpdate();
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    

}
