package com.DAO;

import com.DTO.*;
import java.util.List;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;


public class NotaDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");
    private VentaDAO ventaDAO = new VentaDAO();
    private ProductosDAO prod = new ProductosDAO();

    @SuppressWarnings("unchecked")
    public boolean insertarNota(NotaDTO nota){
        EntityManager em = emf.createEntityManager();
        String sql = """
                INSERT INTO notas_credito (
                                            id_venta,
                                            serie_correlativa,
                                            fecha_emision,
                                            motivo,
                                            monto_total)
                OUTPUT INSERTED.id_nota
                VALUES(?1,?2,GETDATE(),?3,?4)
                """;

            try {
                
                em.getTransaction().begin();
                int idVenta = nota.getVenta().getIdVenta();

                double pendiente = calcularDeuda(em, idVenta);
                double montoNota = nota.getMonto_total();
                double saldoNotaPorDistribuir = montoNota;
                
                Number idGenerado = (Number) em.createNativeQuery(sql)
                    .setParameter(1, nota.getVenta().getIdVenta())
                    .setParameter(2, nota.getSerie_correlativa())
                    .setParameter(3, nota.getMotivo())
                    .setParameter(4, nota.getMonto_total())
                    .getSingleResult();

                int idNota = idGenerado.intValue();
                nota.setId_nota(idNota);

                int pagoAfectado = registrarMovimientoCajaNegativo(em, nota);
                if (pagoAfectado == -1) {
                    throw new Exception("Error al afectar el flujo de caja de la venta.");
                }

                String sqlContarCuotas = "SELECT COUNT(*) FROM cuotas WHERE id_venta = ?1";
                long cantidadCuotas = ((Number) em.createNativeQuery(sqlContarCuotas)
                                        .setParameter(1, idVenta).getSingleResult()).longValue();

                if (cantidadCuotas > 0) {
                    
                    PagoDTO pagoNota = new PagoDTO();
                    pagoNota.setIdPago(pagoAfectado);
                    pagoNota.setVenta(nota.getVenta());

                    
                    double montoAmortizar = Math.min(montoNota, pendiente);
                    pagoNota.setMonto_total(montoAmortizar);

                    distribuirAbonoEnCuotasCompartido(em, pagoNota);
                }

                if(nota.getDetalle() != null && !nota.getDetalle().isEmpty()){

                    for(DetalleNotaDTO detalle : nota.getDetalle()){

                        if(detalle.getNota() == null){
                            detalle.setNota(new NotaDTO());
                        }

                        detalle.getNota().setId_nota(idNota);
                        boolean insertado = insertarDetalle(em, detalle);

                        if(!insertado){
                            throw new Exception("Error al insertar un detalle de nota");
                        }

                        MovimientosDTO movimiento = new MovimientosDTO();
                        movimiento.setIdProducto(detalle.getProducto().getId_producto());

                        Integer idLote = (detalle.getLote() != null) ? detalle.getLote().getId_lote() : null;
                        movimiento.setIdLote(idLote); 

                        movimiento.setCantidad(detalle.getCantidad());
                        movimiento.setIdTipoMovimiento(1);
                        movimiento.setReferencia("Nota Credito " + nota.getSerie_correlativa() + " (Referencia " + nota.getVenta().getSerie_correlativa() + " )");

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

    public Double calcularDeuda(EntityManager em, int idVenta){
        Double deuda = 0.0;
        try {
            String sqlDeudaTotal = """
                    SELECT 
                        CAST(V.total - COALESCE((SELECT SUM(P.monto_total) FROM pagos P WHERE P.id_venta = V.id_venta), 0) AS float)
                    FROM ventas V
                    WHERE V.id_venta = ?1
                    """;
            deuda = (Double) em.createNativeQuery(sqlDeudaTotal)
                    .setParameter(1, idVenta)
                    .getSingleResult();

        } catch (Exception e) {
            e.printStackTrace();
            return deuda;
        }

        return deuda;
    }
    
    @SuppressWarnings("unchecked")
    public void distribuirAbonoEnCuotasCompartido(EntityManager em, PagoDTO pago) {
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

        // CORRECCIÓN: Ahora lee directamente del DTO asignado
        double saldoAbonar = pago.getMonto_total(); 

        for(Object[] fila: cuotasPendientes){
            if(saldoAbonar <= 0) break;

            int id_cuota = ((Number)fila[0]).intValue();
            double montoCuotaTotal = ((Number)fila[3]).doubleValue();
            double yaPagado = ventaDAO.montoPagadoCuota(em, id_cuota);

            double saldoPendienteCuota = montoCuotaTotal - yaPagado;
            if(saldoPendienteCuota <= 0) continue;

            double aplicarMonto = Math.min(saldoPendienteCuota, saldoAbonar);
            saldoAbonar -= aplicarMonto;

            DetallePagoDTO detalle = new DetallePagoDTO();
            CuotaDTO cuota = new CuotaDTO();
            cuota.setIdCuota(id_cuota);
            detalle.setPago(pago);
            detalle.setCuota(cuota);
            detalle.setMonto(aplicarMonto);

            ventaDAO.insertarDetallePago(em, detalle);
            ventaDAO.actualizarEstadoCuotaDinamico(em, detalle);
        }
    }

    public int registrarMovimientoCajaNegativo(EntityManager em, NotaDTO nota) {
        Number idpago = null;
        try {
            String sqlPago = """
                    INSERT INTO pagos (id_venta, id_metodo_pago, monto_total, fecha, referencia_pago)
                    OUTPUT INSERTED.id_pago
                    VALUES (?1, ?2, ?3, GETDATE(), ?4)
                    """;
            
            double montoNegativo = -1 * Math.abs(nota.getMonto_total());
            
                idpago = (Number)em.createNativeQuery(sqlPago)
              .setParameter(1, nota.getVenta().getIdVenta())
              .setParameter(2, 1) 
              .setParameter(3, montoNegativo)
              .setParameter(4, "Nota de Crédito Ref: " + nota.getSerie_correlativa())
              .getSingleResult();
              
            return idpago.intValue();

        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    public boolean insertarDetalle(EntityManager em, DetalleNotaDTO detalle){
        try {

            String sql = """
                    INSERT INTO detalle_nota_credito (
                                                        id_nota,
                                                        id_producto,
                                                        cantidad,
                                                        precio_unitario,
                                                        subtotal,
                                                        id_lote)
                    VALUES (?1,?2,?3,?4,?5,?6)
                    """;
            Integer idLote = (detalle.getLote() != null) ? detalle.getLote().getId_lote() : null;

            em.createNativeQuery(sql)
                .setParameter(1, detalle.getNota().getId_nota())
                .setParameter(2, detalle.getProducto().getId_producto())
                .setParameter(3, detalle.getCantidad())
                .setParameter(4, detalle.getPrecio_unitario())
                .setParameter(5, detalle.getSubtotal())
                .setParameter(6, idLote)
                .executeUpdate();

            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }

    }



}
