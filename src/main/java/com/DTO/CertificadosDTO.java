package com.DTO;
import java.util.Date;

public class CertificadosDTO {
    private Integer id_certificado;
    private String numeroCertificado;
    private Date fecha_emision;
    private String archivo_url;

    public CertificadosDTO(){

    }

    public Integer getId_certifiado(){
        return id_certificado;
    }

    public void setId_certificado(Integer id_certificado){
        this.id_certificado = id_certificado;
    }

    public String getNumeroCertificado(){
        return numeroCertificado;
    }

    public void setNumeroCertificado(String numeroCertificado){
        this.numeroCertificado = numeroCertificado;
    }

    public Date getFecha_emision(){
        return fecha_emision;
    }

    public void setFecha_emision(Date fecha_emison){
        this.fecha_emision = fecha_emison;
    }

    public String getArchivo_url(){
        return archivo_url;
    }

    public void setArchivo_url(String archivo_url){
        this.archivo_url = archivo_url;
    }
    

}
