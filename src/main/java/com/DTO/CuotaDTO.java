package com.DTO;

import java.util.Date;

public class CuotaDTO {
    private Integer idCuota;
    private VentaDTO venta;
    private int numeroCuota;
    private Date fechaVencimiento;
    private Double monto;
    private EstadosSistemaDTO estado;
    
    public CuotaDTO() {
    }

    public Integer getIdCuota() {
        return idCuota;
    }

    public void setIdCuota(Integer idCuota) {
        this.idCuota = idCuota;
    }

    public VentaDTO getVenta() {
        return venta;
    }

    public void setVenta(VentaDTO venta) {
        this.venta = venta;
    }

    public int getNumeroCuota() {
        return numeroCuota;
    }

    public void setNumeroCuota(int numeroCuota) {
        this.numeroCuota = numeroCuota;
    }

    public Date getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setFechaVencimiento(Date fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public Double getMonto() {
        return monto;
    }

    public void setMonto(Double monto) {
        this.monto = monto;
    }

    public EstadosSistemaDTO getEstado() {
        return estado;
    }

    public void setEstado(EstadosSistemaDTO estado) {
        this.estado = estado;
    }

    
    
}
