package com.DTO;

public class DetallePagoDTO {
    private Integer idDetallePago;
    private PagoDTO pago;
    private CuotaDTO cuota;
    private Double monto;
    
    public DetallePagoDTO() {
    }

    public Integer getIdDetallePago() {
        return idDetallePago;
    }

    public void setIdDetallePago(Integer idDetallePago) {
        this.idDetallePago = idDetallePago;
    }

    public PagoDTO getPago() {
        return pago;
    }

    public void setPago(PagoDTO pago) {
        this.pago = pago;
    }

    public CuotaDTO getCuota() {
        return cuota;
    }

    public void setCuota(CuotaDTO cuota) {
        this.cuota = cuota;
    }

    public Double getMonto() {
        return monto;
    }

    public void setMonto(Double monto) {
        this.monto = monto;
    }

    
}
