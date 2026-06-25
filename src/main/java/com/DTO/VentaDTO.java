package com.DTO;
import java.util.Date;
import java.util.List;
public class VentaDTO {
    private Integer idVenta;
    private EntidadesDTO cliente;
    private EntidadesDTO usuario;
    private Integer id_venta_referencia;
    private String serie_correlativa;
    private String tipo_comprobante;
    private Date fecha_emision;
    private EstadosSistemaDTO estado;
    private Double total;
    private Double subTotal;
    private Double descuento_global;
    private List<PagoDTO> pagos;
    private List<DetalleVentaDTO> detalle;
    private List<CuotaDTO> cuotas;

    public VentaDTO() {
    }

    public Integer getIdVenta() {
        return idVenta;
    }

    public void setIdVenta(Integer idVenta) {
        this.idVenta = idVenta;
    }

    public EntidadesDTO getCliente() {
        return cliente;
    }

    public void setCliente(EntidadesDTO cliente) {
        this.cliente = cliente;
    }

    public EntidadesDTO getUsuario() {
        return usuario;
    }

    public void setUsuario(EntidadesDTO usuario) {
        this.usuario = usuario;
    }

    public Integer getId_venta_referencia() {
        return id_venta_referencia;
    }

    public void setId_venta_referencia(Integer id_venta_referencia) {
        this.id_venta_referencia = id_venta_referencia;
    }

    public String getSerie_correlativa() {
        return serie_correlativa;
    }

    public void setSerie_correlativa(String serie_correlativa) {
        this.serie_correlativa = serie_correlativa;
    }

    public String getTipo_comprobante() {
        return tipo_comprobante;
    }

    public void setTipo_comprobante(String tipo_comprobante) {
        this.tipo_comprobante = tipo_comprobante;
    }

    public Date getFecha_emision() {
        return fecha_emision;
    }

    public void setFecha_emision(Date fecha_emision) {
        this.fecha_emision = fecha_emision;
    }

    public EstadosSistemaDTO getEstado() {
        return estado;
    }

    public void setEstado(EstadosSistemaDTO estado) {
        this.estado = estado;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public List<DetalleVentaDTO> getDetalle() {
        return detalle;
    }

    public void setDetalle(List<DetalleVentaDTO> detalle) {
        this.detalle = detalle;
    }

    
    public List<CuotaDTO> getCuotas() {
        return cuotas;
    }

    public void setCuotas(List<CuotaDTO> cuotas) {
        this.cuotas = cuotas;
    }

    public Double getSubTotal() {
        return subTotal;
    }

    public void setSubTotal(Double subTotal) {
        this.subTotal = subTotal;
    }

    public Double getDescuento_global() {
        return descuento_global;
    }

    public void setDescuento_global(Double descuento_global) {
        this.descuento_global = descuento_global;
    }

    public List<PagoDTO> getPagos() {
        return pagos;
    }

    public void setPagos(List<PagoDTO> pagos) {
        this.pagos = pagos;
    }

    
    
}
