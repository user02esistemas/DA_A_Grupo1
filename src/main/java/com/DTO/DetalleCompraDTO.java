package com.DTO;

public class DetalleCompraDTO {
    private int idDetalleCompra;
    private CompraDTO compra;
    private ProductosDTO producto;
    private LotesDTO lote;
    private int cantidad;
    private Double precio_costo_unitario;
    
    public DetalleCompraDTO() {
    }

    public int getIdDetalleCompra() {
        return idDetalleCompra;
    }

    public void setIdDetalleCompra(int idDetalleCompra) {
        this.idDetalleCompra = idDetalleCompra;
    }

    public CompraDTO getCompra() {
        return compra;
    }

    public void setCompra(CompraDTO compra) {
        this.compra = compra;
    }

    public ProductosDTO getProducto() {
        return producto;
    }

    public void setProducto(ProductosDTO producto) {
        this.producto = producto;
    }

    public LotesDTO getLote() {
        return lote;
    }

    public void setLote(LotesDTO lote) {
        this.lote = lote;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }

    public Double getPrecio_costo_unitario() {
        return precio_costo_unitario;
    }

    public void setPrecio_costo_unitario(Double precio_costo_unitario) {
        this.precio_costo_unitario = precio_costo_unitario;
    }

        
}
