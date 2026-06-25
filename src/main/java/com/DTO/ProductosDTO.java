package com.DTO;

public class ProductosDTO {
    private int id_producto;
    private String codigo_barras;
    private String nombre_descripcion;
    private Double precio_venta;
    private Double precio_mayorista;
    private Double precio_distribuidor;
    private int stock;
    private int stock_minimo;
    private boolean maneja_lote;
    private String  imagen_url;
    private String codigo_unico;
    private EstadosSistemaDTO estado;
    private UnidadesDTO unidad;
    private CategoriasDTO categoria;
    private LotesDTO lote;

    public ProductosDTO() {
    }

    public int getId_producto() {
        return id_producto;
    }

    public void setId_producto(int id_producto) {
        this.id_producto = id_producto;
    }

    public String getCodigo_barras() {
        return codigo_barras;
    }

    public void setCodigo_barras(String codigo_barras) {
        this.codigo_barras = codigo_barras;
    }

    public String getNombre_descripcion() {
        return nombre_descripcion;
    }

    public void setNombre_descripcion(String nombre_descripcion) {
        this.nombre_descripcion = nombre_descripcion;
    }

    public Double getPrecio_venta() {
        return precio_venta;
    }

    public void setPrecio_venta(Double precio_venta) {
        this.precio_venta = precio_venta;
    }

    public Double getPrecio_mayorista() {
        return precio_mayorista;
    }

    public void setPrecio_mayorista(Double precio_mayorista) {
        this.precio_mayorista = precio_mayorista;
    }

    public Double getPrecio_distribuidor() {
        return precio_distribuidor;
    }

    public void setPrecio_distribuidor(Double precio_distribuidor) {
        this.precio_distribuidor = precio_distribuidor;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public int getStock_minimo() {
        return stock_minimo;
    }

    public void setStock_minimo(int stock_minimo) {
        this.stock_minimo = stock_minimo;
    }

    public boolean isManeja_lote() {
        return maneja_lote;
    }

    public void setManeja_lote(boolean maneja_lote) {
        this.maneja_lote = maneja_lote;
    }

    public String getImagen_url() {
        return imagen_url;
    }

    public void setImagen_url(String imagen_url) {
        this.imagen_url = imagen_url;
    }

    public String getCodigo_unico() {
        return codigo_unico;
    }

    public void setCodigo_unico(String codigo_unico) {
        this.codigo_unico = codigo_unico;
    }

    public EstadosSistemaDTO getEstado() {
        return estado;
    }

    public void setEstado(EstadosSistemaDTO estado) {
        this.estado = estado;
    }

    public UnidadesDTO getUnidad() {
        return unidad;
    }

    public void setUnidad(UnidadesDTO unidad) {
        this.unidad = unidad;
    }

    public CategoriasDTO getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriasDTO categoria) {
        this.categoria = categoria;
    }

    public LotesDTO getLote() {
        return lote;
    }

    public void setLote(LotesDTO lote) {
        this.lote = lote;
    }

    
    
}
