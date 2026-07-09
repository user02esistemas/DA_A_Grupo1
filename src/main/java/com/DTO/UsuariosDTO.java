package com.DTO;

public class UsuariosDTO {
    private Integer idUsuario;
    private String usuario;
    private String paswordHash;
    private Integer idEntidad;
    private Integer idRol;
    private Integer idEstado;
    private String nombreEntidad;
    private String nombreRol;
    private String nombreEstado;

    public UsuariosDTO(){

    }

    public Integer getIdUsuario(){
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario){
        this.idUsuario = idUsuario;
    }

    public String getUsuario(){
        return usuario;
    }

    public void setUsuario(String usuario){
        this.usuario = usuario;
    }

    public String getPaswordHash(){
        return paswordHash;
    }

    public void setPaswordHash(String paswordHash){
        this.paswordHash = paswordHash;
    }

    public Integer getIdEntidad(){
        return idEntidad;
    }

    public void setIdEntidad(Integer idEntidad){
        this.idEntidad = idEntidad;
    }

    public Integer getIdRol(){
        return idRol;
    }

    public void setIdRol(Integer idRol){
        this.idRol = idRol;
    }

    public Integer getIdEstado(){
        return idEstado;
    }

    public void setIdEstado(Integer idEstado){
        this.idEstado = idEstado;
    }

    public String getNombreEntidad(){
        return nombreEntidad;
    }

    public void setNombreEntidad(String nombreEntidad){
        this.nombreEntidad = nombreEntidad;
    }

    public String getNombreRol(){
        return nombreRol;
    }

    public void setNombreRol(String nombreRol){
        this.nombreRol = nombreRol;
    }

    public String getNombreEstado(){
        return nombreEstado;
    }

    public void setNombreEstado(String nombreEstado){
        this.nombreEstado = nombreEstado;
    }       


    
}
