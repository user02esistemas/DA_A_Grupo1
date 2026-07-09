package com.DTO;

import java.util.Date;
import java.util.List;

public class NotaDTO {
    private int id_nota;
    private VentaDTO venta;
    private String serie_correlativa;
    private Date fecha_emision;
    private String motivo;
    private Double monto_total;
    private List<DetalleNotaDTO> detalle;
    
    public NotaDTO() {
    }

    public int getId_nota() {
        return id_nota;
    }

    public void setId_nota(int id_nota) {
        this.id_nota = id_nota;
    }

    public VentaDTO getVenta() {
        return venta;
    }

    public void setVenta(VentaDTO venta) {
        this.venta = venta;
    }

    public String getSerie_correlativa() {
        return serie_correlativa;
    }

    public void setSerie_correlativa(String serie_correlativa) {
        this.serie_correlativa = serie_correlativa;
    }

    public Date getFecha_emision() {
        return fecha_emision;
    }

    public void setFecha_emision(Date fecha_emision) {
        this.fecha_emision = fecha_emision;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public Double getMonto_total() {
        return monto_total;
    }

    public void setMonto_total(Double monto_total) {
        this.monto_total = monto_total;
    }

    public List<DetalleNotaDTO> getDetalle() {
        return detalle;
    }

    public void setDetalle(List<DetalleNotaDTO> detalle) {
        this.detalle = detalle;
    }

    
    

}
