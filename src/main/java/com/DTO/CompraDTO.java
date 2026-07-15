package com.DTO;
import java.util.*;

public class CompraDTO {
    private Integer idCompra;
    private OrdenCompraDTO orden;
    private UsuariosDTO usuario;
    private EntidadesDTO proveedor;
    private String tipoComprobante;
    private String serieCorrelativa;
    private Date fechaCompra;
    private Double montoTotal;
    private List<DetalleCompraDTO> detallesCom;
    
    public CompraDTO() {
    }

    public Integer getIdCompra() {
        return idCompra;
    }

    public void setIdCompra(Integer idCompra) {
        this.idCompra = idCompra;
    }

    public OrdenCompraDTO getOrden() {
        return orden;
    }

    public void setOrden(OrdenCompraDTO orden) {
        this.orden = orden;
    }


    public EntidadesDTO getProveedor() {
        return proveedor;
    }

    public void setProveedor(EntidadesDTO proveedor) {
        this.proveedor = proveedor;
    }

    public String getTipoComprobante() {
        return tipoComprobante;
    }

    public void setTipoComprobante(String tipoComprobante) {
        this.tipoComprobante = tipoComprobante;
    }

    public String getSerieCorrelativa() {
        return serieCorrelativa;
    }

    public void setSerieCorrelativa(String serieCorrelativa) {
        this.serieCorrelativa = serieCorrelativa;
    }

    public Date getFechaCompra() {
        return fechaCompra;
    }

    public void setFechaCompra(Date fechaCompra) {
        this.fechaCompra = fechaCompra;
    }

    public Double getMontoTotal() {
        return montoTotal;
    }

    public void setMontoTotal(Double montoTotal) {
        this.montoTotal = montoTotal;
    }

    public List<DetalleCompraDTO> getDetallesCom() {
        return detallesCom;
    }

    public void setDetallesCom(List<DetalleCompraDTO> detallesCom) {
        this.detallesCom = detallesCom;
    }


    public UsuariosDTO getUsuario() {
        return usuario;
    }

    public void setUsuario(UsuariosDTO usuario) {
        this.usuario = usuario;
    }

    
}
