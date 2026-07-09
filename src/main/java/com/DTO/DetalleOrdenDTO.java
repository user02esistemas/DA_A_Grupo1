package com.DTO;

public class DetalleOrdenDTO {
    private int idDetalleOrden;
    private OrdenCompraDTO orden;
    private ProductosDTO producto;
    private int cantidadPedida;
    private Double precioUnitarioPactado;
    
    public DetalleOrdenDTO() {
    }

    public int getIdDetalleOrden() {
        return idDetalleOrden;
    }

    public void setIdDetalleOrden(int idDetalleOrden) {
        this.idDetalleOrden = idDetalleOrden;
    }

    public OrdenCompraDTO getOrden() {
        return orden;
    }

    public void setOrden(OrdenCompraDTO orden) {
        this.orden = orden;
    }

    public ProductosDTO getProducto() {
        return producto;
    }

    public void setProducto(ProductosDTO producto) {
        this.producto = producto;
    }

    public Double getPrecioUnitarioPactado() {
        return precioUnitarioPactado;
    }

    public void setPrecioUnitarioPactado(Double precioUnitarioPactado) {
        this.precioUnitarioPactado = precioUnitarioPactado;
    }

    public int getCantidadPedida() {
        return cantidadPedida;
    }

    public void setCantidadPedida(int cantidadPedida) {
        this.cantidadPedida = cantidadPedida;
    }

    
}
