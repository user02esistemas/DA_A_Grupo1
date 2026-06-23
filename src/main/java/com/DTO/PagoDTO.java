package com.DTO;

import java.util.Date;
import java.util.List;

public class PagoDTO {
    private Integer idPago;
    private VentaDTO venta;
    private MetodosPagoDTO metodo;
    private Double monto_total;
    private Date fecha;
    private String referencia;

    private List<DetallePagoDTO> detalle;
    
    public PagoDTO() {
    }

    public Integer getIdPago() {
        return idPago;
    }

    public void setIdPago(Integer idPago) {
        this.idPago = idPago;
    }

    public VentaDTO getVenta() {
        return venta;
    }

    public void setVenta(VentaDTO venta) {
        this.venta = venta;
    }

    public MetodosPagoDTO getMetodo() {
        return metodo;
    }

    public void setMetodo(MetodosPagoDTO metodo) {
        this.metodo = metodo;
    }

    public Double getMonto_total() {
        return monto_total;
    }

    public void setMonto_total(Double monto_total) {
        this.monto_total = monto_total;
    }

    public Date getFecha() {
        return fecha;
    }

    public void setFecha(Date fecha) {
        this.fecha = fecha;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public List<DetallePagoDTO> getDetalle() {
        return detalle;
    }

    public void setDetalle(List<DetallePagoDTO> detalle) {
        this.detalle = detalle;
    }

    

    
}
