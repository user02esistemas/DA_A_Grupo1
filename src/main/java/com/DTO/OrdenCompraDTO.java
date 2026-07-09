package com.DTO;

import java.sql.Date;
import java.util.List;

public class OrdenCompraDTO {
    private Integer idOrden;
    private EntidadesDTO proveedor;
    private UsuariosDTO usuario;
    private Date fecha;
    private Date fechaEntrega;
    private EstadosSistemaDTO estado;
    private Double totalEstimado;

    List<DetalleOrdenDTO> detalles;

    public OrdenCompraDTO() {
    }

    

    public EntidadesDTO getProveedor() {
        return proveedor;
    }

    public void setProveedor(EntidadesDTO proveedor) {
        this.proveedor = proveedor;
    }


    public Date getFecha() {
        return fecha;
    }

    public void setFecha(Date fecha) {
        this.fecha = fecha;
    }

    public Date getFechaEntrega() {
        return fechaEntrega;
    }

    public void setFechaEntrega(Date fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }

    public EstadosSistemaDTO getEstado() {
        return estado;
    }

    public void setEstado(EstadosSistemaDTO estado) {
        this.estado = estado;
    }

    public Double getTotalEstimado() {
        return totalEstimado;
    }

    public void setTotalEstimado(Double totalEstimado) {
        this.totalEstimado = totalEstimado;
    }

    public List<DetalleOrdenDTO> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<DetalleOrdenDTO> detalles) {
        this.detalles = detalles;
    }



    public Integer getIdOrden() {
        return idOrden;
    }



    public void setIdOrden(Integer idOrden) {
        this.idOrden = idOrden;
    }



    public UsuariosDTO getUsuario() {
        return usuario;
    }



    public void setUsuario(UsuariosDTO usuario) {
        this.usuario = usuario;
    }

    
}
