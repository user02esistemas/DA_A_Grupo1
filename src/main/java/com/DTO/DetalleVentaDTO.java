package com.DTO;

public class DetalleVentaDTO {
    private Integer idDetalleVenta;
    private VentaDTO venta;
    private LotesDTO lote;
    private ProductosDTO producto;
    private Integer cantidad;
    private Double precio_unitario;
    private Double descuento_prod;
    private Double sub_total;

    public DetalleVentaDTO() {
    }

    public Integer getIdDetalleVenta() {
        return idDetalleVenta;
    }

    public void setIdDetalleVenta(Integer idDetalleVenta) {
        this.idDetalleVenta = idDetalleVenta;
    }

    public VentaDTO getVenta() {
        return venta;
    }

    public void setVenta(VentaDTO venta) {
        this.venta = venta;
    }

    public LotesDTO getLote() {
        return lote;
    }

    public void setLote(LotesDTO lote) {
        this.lote = lote;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public Double getPrecio_unitario() {
        return precio_unitario;
    }

    public void setPrecio_unitario(Double precio_unitario) {
        this.precio_unitario = precio_unitario;
    }

    public Double getDescuento_prod() {
        return descuento_prod;
    }

    public void setDescuento_prod(Double descuento_prod) {
        this.descuento_prod = descuento_prod;
    }

    public Double getSub_total() {
        return sub_total;
    }

    public void setSub_total(Double sub_total) {
        this.sub_total = sub_total;
    }

    public ProductosDTO getProducto() {
        return producto;
    }

    public void setProducto(ProductosDTO producto) {
        this.producto = producto;
    }

    
    
}
