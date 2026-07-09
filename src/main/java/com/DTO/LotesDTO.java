package com.DTO;
import java.util.Date;

public class LotesDTO {
    private Integer id_lote;
    private String numero_lote;
    private Date fecha_entrada;
    private Integer stock_lote;
    private ProductosDTO producto;
    private CertificadosDTO certi;

    public LotesDTO() {
    }

    public Integer getId_lote() {
        return id_lote;
    }

    public void setId_lote(Integer id_lote) {
        this.id_lote = id_lote;
    }

    public String getNumero_lote() {
        return numero_lote;
    }

    public void setNumero_lote(String numero_lote) {
        this.numero_lote = numero_lote;
    }

    public Date getFecha_entrada() {
        return fecha_entrada;
    }

    public void setFecha_entrada(Date fecha_entrada) {
        this.fecha_entrada = fecha_entrada;
    }

    public Integer getStock_lote() {
        return stock_lote;
    }

    public void setStock_lote(Integer stock_lote) {
        this.stock_lote = stock_lote;
    }

    public ProductosDTO getProducto() {
        return producto;
    }

    public void setProducto(ProductosDTO producto) {
        this.producto = producto;
    }

    public CertificadosDTO getCerti() {
        return certi;
    }

    public void setCerti(CertificadosDTO certi) {
        this.certi = certi;
    }

    
    
    
    
}
