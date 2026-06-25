package com.DAO;

import java.util.ArrayList;
import java.util.List;

import com.DTO.ProductosDTO;
import com.DTO.CategoriasDTO;
import com.DTO.UnidadesDTO;
import com.DTO.CertificadosDTO;
import com.DTO.LotesDTO;
import com.DTO.MovimientosDTO;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.NoResultException;
import jakarta.persistence.Persistence;
import jakarta.persistence.Query;

public class ProductosDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");

    public boolean insertarProducto(ProductosDTO prod, LotesDTO lote){
        EntityManager em = emf.createEntityManager();

        String sql = """
                INSERT INTO productos(id_categoria,
                                    id_unidad_medida,
                                    id_estado,
                                    codigo_barras,
                                    nombre_descripcion,
                                    precio_venta,
                                    precio_mayorista,
                                    precio_distribuidor,
                                    stock,
                                    stock_minimo,
                                    maneja_lote,
                                    imagen_url,
                                    codigo_unico)
                OUTPUT INSERTED.id_producto
                VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)
                """;

        try {

            em.getTransaction().begin();
            
            int idCate = obtenerCrearCategoria(em, prod.getCategoria());
            int idUni = obtenerCrearMedida(em, prod.getUnidad());

            Number idGenerado = (Number) em.createNativeQuery(sql)
                .setParameter(1, idCate)
                .setParameter(2, idUni)
                .setParameter(3, 19)
                .setParameter(4, prod.getCodigo_barras())
                .setParameter(5, prod.getNombre_descripcion())
                .setParameter(6, prod.getPrecio_venta())
                .setParameter(7, prod.getPrecio_mayorista())
                .setParameter(8, prod.getPrecio_distribuidor())
                .setParameter(9, 0)
                .setParameter(10, prod.getStock_minimo())
                .setParameter(11, prod.isManeja_lote() )
                .setParameter(12, prod.getImagen_url())
                .setParameter(13, prod.getCodigo_unico())
                .getSingleResult();
            
            int idProd =idGenerado.intValue();
            Integer idLote = null;

            if (prod.isManeja_lote() && lote != null) {
                Integer idCertificado = null;
                if (lote.getCerti() != null) {
                    int idResultado = obtenerOCrearCertificado(em, lote.getCerti());
                    if (idResultado > 0) idCertificado = idResultado;
                }

                String sqlLote = """
                        INSERT INTO lotes (id_producto, id_certificado, numero_lote, fecha_entrada, stock_lote)
                        OUTPUT INSERTED.id_lote
                        VALUES (?1, ?2, ?3, ?4, ?5)
                        """;

                Number idL = (Number) em.createNativeQuery(sqlLote)
                        .setParameter(1, idProd)
                        .setParameter(2, idCertificado)
                        .setParameter(3, lote.getNumero_lote())
                        .setParameter(4, new java.sql.Date(System.currentTimeMillis())) // Fecha actual
                        .setParameter(5, lote.getStock_lote())
                        .getSingleResult();
                
                idLote = idL.intValue();
            }

            if(prod.getStock() > 0){
                MovimientosDTO mov = new MovimientosDTO();
                mov.setIdProducto(idProd);
                mov.setIdLote(idLote);
                mov.setCantidad(prod.getStock());
                mov.setIdTipoMovimiento(1);
                mov.setReferencia("Saldo inicial");
                procesarMovimiento(em, mov);
                movimientoInventario(em, mov);

            }

            em.getTransaction().commit();
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            return false;
        }finally {
            em.close();
        }  
    }

    @SuppressWarnings("unchecked")

    public List<ProductosDTO> mostrarProductos(){
        EntityManager em = emf.createEntityManager();
        List<ProductosDTO> prodList = new ArrayList<>();

        String sql = """
                SELECT P.id_producto,
                    P.codigo_barras,
                    P.codigo_unico,
                    P.nombre_descripcion,
                    C.nombre,
                    P.precio_venta,
                    P.stock,
                    M.nombre,
                    P.maneja_lote
                FROM productos AS P
                INNER JOIN medidas AS M ON P.id_unidad_medida = M.id_medida
                INNER JOIN categorias AS C ON P.id_categoria = C.id_categoria
                """;
        try {
            Query query = em.createNativeQuery(sql);
            List<Object[]> result = query.getResultList();

            for(Object[] fila: result){
                ProductosDTO prod = new ProductosDTO();

                prod.setId_producto(((Number) fila[0]).intValue());
                prod.setCodigo_barras((String) fila[1]);
                prod.setCodigo_unico((String) fila[2]);
                prod.setNombre_descripcion((String) fila[3]);

                CategoriasDTO cate = new CategoriasDTO();
                cate.setNombreCategoria((String)fila[4]);
                prod.setCategoria(cate);

                prod.setPrecio_venta(((Number) fila[5]).doubleValue());
                prod.setStock(((Number)fila[6]).intValue());

                UnidadesDTO unidad = new UnidadesDTO();
                unidad.setNombre((String)fila[7]);
                prod.setUnidad(unidad);

                prod.setManeja_lote((Boolean) fila[8]);

                prodList.add(prod);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }
        return prodList;
    }

    public boolean movimientoInventario(EntityManager em, MovimientosDTO movimiento){
        try {
            
            String sql = """
                        INSERT INTO movimientos_inventario (
                                                            id_producto,
                                                            id_lote,
                                                            id_tipo_movimiento,
                                                            cantidad,
                                                            fecha,
                                                            referencia)
                        VALUES (?1,?2,?3,?4, GETDATE(),?5)
                    """;
                    
            em.createNativeQuery(sql)
            .setParameter(1, movimiento.getIdProducto())
            .setParameter(2, movimiento.getIdLote())
            .setParameter(3, movimiento.getIdTipoMovimiento())
            .setParameter(4, movimiento.getCantidad())
            .setParameter(5, movimiento.getReferencia())
            .executeUpdate();
            
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

public int obtenerOCrearCertificado(EntityManager em, CertificadosDTO certi) {
    
    if (certi == null || certi.getNumeroCertificado() == null || certi.getNumeroCertificado().trim().isEmpty()) {
        return -1; 
    }

    try {
        
        String sqlSelect = """
                SELECT id_certificado FROM certificados
                WHERE numero = ?1 AND fecha_emision = ?2
                """;
        
        java.sql.Date fechaEmision = new java.sql.Date(certi.getFecha_emision().getTime());

        try {
            Number idEncontrado = (Number) em.createNativeQuery(sqlSelect)
                    .setParameter(1, certi.getNumeroCertificado().trim())
                    .setParameter(2, fechaEmision)
                    .getSingleResult();
            
           
            return idEncontrado.intValue();
            
        } catch (NoResultException e) {
            
            String sqlInsert = """
                    INSERT INTO certificados (numero, fecha_emision, archivo_url)
                    OUTPUT INSERTED.id_certificado
                    VALUES (?1, ?2, ?3)
                    """;

            Number idGenerado = (Number) em.createNativeQuery(sqlInsert)
                    .setParameter(1, certi.getNumeroCertificado().trim())
                    .setParameter(2, fechaEmision)
                    .setParameter(3, certi.getArchivo_url())
                    .getSingleResult();
            
            return idGenerado.intValue();
        }

    } catch (Exception e) {
        e.printStackTrace();
        return -1;
    }
}

    public int obtenerCrearCategoria(EntityManager em ,CategoriasDTO categoria){
        try {
            String sqlSelect = """
                        SELECT id_categoria FROM categorias
                        WHERE nombre = ?1
                
            """;

            Number id = (Number) em.createNativeQuery(sqlSelect)
                        .setParameter(1, categoria.getNombreCategoria())
                        .getSingleResult();
            
            return id.intValue();

        } catch (NoResultException e) {
            String sqlInsert = """
                INSERT INTO categorias (nombre,
                                        descripcion,
                                        id_estado)
                OUTPUT INSERTED.id_categoria
                VALUES (?1,?2,?3)
                """;
            Number idAg = (Number) em.createNativeQuery(sqlInsert)
                .setParameter(1, categoria.getNombreCategoria())
                .setParameter(2, categoria.getDescripcion())
                .setParameter(3, 1)
                .getSingleResult();
            return idAg.intValue();
        } 
    }

    public int obtenerCrearMedida(EntityManager em, UnidadesDTO medida){
        try {
            
            String sqlSelect = """
                        SELECT id_medida FROM medidas
                        WHERE nombre = ?1
                    """;
            Number id  = (Number) em.createNativeQuery(sqlSelect)
                .setParameter(1, medida.getNombre())
                .getSingleResult();
            
            return id.intValue();

        } catch (NoResultException e) {
            String sql = """
                INSERT INTO medidas (nombre,
                                    id_estado)
                OUTPUT INSERTED.id_medida
                VALUES(?1,?2)
                """;

            Number idAg = (Number) em.createNativeQuery(sql)
                .setParameter(1, medida.getNombre())
                .setParameter(2, 1)
                .getSingleResult();

            return idAg.intValue();
        }
        
    
    }

    @SuppressWarnings("unchecked")
    public List<UnidadesDTO> mostrarMedidas(){
        EntityManager em = emf.createEntityManager();
        List<UnidadesDTO> listaUnidades = new ArrayList<>();

        String sql = """
                SELECT id_medida,
                        nombre
                FROM medidas
                WHERE id_estado = 1
                """;

        try {
            
            Query query = em.createNativeQuery(sql);
            List<Object[]> resultado = query.getResultList();
            for(Object[] fila : resultado){

                UnidadesDTO medidas = new UnidadesDTO();
                medidas.setId_medida(((Number)fila[0]).intValue());
                medidas.setNombre((String)fila[1]);

                listaUnidades.add(medidas);
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }

        return listaUnidades;
    }

    @SuppressWarnings("unchecked")
    public List<CategoriasDTO> mostrarCategorias(){
        EntityManager em = emf.createEntityManager();
        List<CategoriasDTO> listaCategorias = new ArrayList<>();

        String sql = """
                SELECT id_categoria,
                        nombre
                FROM categorias
                WHERE id_estado = 1
                """;

        try {
            
            Query query = em.createNativeQuery(sql);
            List<Object[]> resultado = query.getResultList();
            for(Object[]fila : resultado){
                CategoriasDTO cat = new CategoriasDTO();
                cat.setId_categoria(((Number)fila[0]).intValue());
                cat.setNombreCategoria((String)fila[1]);
                listaCategorias.add(cat);
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }

        return listaCategorias;
    }

    public boolean procesarMovimiento(EntityManager em, MovimientosDTO movimiento){
        try {

            int factor = 0;

            if(movimiento.getIdTipoMovimiento() == 1 || movimiento.getIdTipoMovimiento() == 3){
                factor = 1;
            }else{
                factor = -1;
            }

            int cantidadModificar = movimiento.getCantidad() * factor;

            String sql1 = """
                    UPDATE productos SET stock = stock + ?1 
                    WHERE id_producto = ?2
                    """;
            em.createNativeQuery(sql1)
                .setParameter(1, cantidadModificar)
                .setParameter(2, movimiento.getIdProducto())
                .executeUpdate();

            if(movimiento.getIdLote() != null && movimiento.getIdLote()>0){
                String sql2 = """
                        UPDATE lotes SET stock_lote = stock_lote + ?1
                        WHERE id_lote = ?2 
                        """;
                em.createNativeQuery(sql2)
                    .setParameter(1, cantidadModificar)
                    .setParameter(2, movimiento.getIdLote())
                    .executeUpdate();
            }
            
            return true;
            
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    public List<MovimientosDTO> mostrarKardex(int idProducto) {
        EntityManager em = emf.createEntityManager();
        List<MovimientosDTO> listaKardex = new ArrayList<>();
        
        String sql = """
                SELECT id_movimiento, id_producto, id_lote, id_tipo_movimiento, cantidad, fecha, referencia
                FROM movimientos_inventario
                WHERE id_producto = ?1
                ORDER BY fecha ASC
                """;
        try {
            List<Object[]> result = em.createNativeQuery(sql)
                                      .setParameter(1, idProducto)
                                      .getResultList();
                                      
            for (Object[] fila : result) {
                MovimientosDTO mov = new MovimientosDTO();
                mov.setIdMovimiento(((Number) fila[0]).intValue());
                mov.setIdProducto(((Number) fila[1]).intValue());
                
                if (fila[2] != null) mov.setIdLote(((Number) fila[2]).intValue());
                
                mov.setIdTipoMovimiento(((Number) fila[3]).intValue());
                mov.setCantidad(((Number) fila[4]).intValue());
                
                // Formateo seguro de fecha
                if (fila[5] != null) {
                    mov.setFecha((java.util.Date) fila[5]); 
                }
                
                mov.setReferencia((String) fila[6]);
                
                listaKardex.add(mov);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }
        return listaKardex;
    }
    

}
