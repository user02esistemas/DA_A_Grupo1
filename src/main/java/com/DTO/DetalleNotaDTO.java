package com.DTO;

public class DetalleNotaDTO {
    private int detalle_nota;
    private NotaDTO nota;
    private ProductosDTO producto;
    private int cantidad;
    private Double precio_unitario;
    private Double subtotal;
    private LotesDTO lote;
    
    public DetalleNotaDTO() {
    }

    public int getDetalle_nota() {
        return detalle_nota;
    }

    public void setDetalle_nota(int detalle_nota) {
        this.detalle_nota = detalle_nota;
    }

    public NotaDTO getNota() {
        return nota;
    }

    public void setNota(NotaDTO nota) {
        this.nota = nota;
    }

    public ProductosDTO getProducto() {
        return producto;
    }

    public void setProducto(ProductosDTO producto) {
        this.producto = producto;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }

    public Double getPrecio_unitario() {
        return precio_unitario;
    }

    public void setPrecio_unitario(Double precio_unitario) {
        this.precio_unitario = precio_unitario;
    }

    public Double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }

    public LotesDTO getLote() {
        return lote;
    }

    public void setLote(LotesDTO lote) {
        this.lote = lote;
    }

}
