package com.DAO;

import java.util.*;

import com.DTO.CertificadosDTO;
import com.DTO.LotesDTO;


import jakarta.persistence.*;


public class LotesDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");

    public int insertarLotes(LotesDTO lote){
        EntityManager em = emf.createEntityManager();
        String sql = """
                INSERT INTO lotes (id_producto,
                                    id_certificado,
                                    numero_lote,
                                    stock_lote)
                OUTPUT INSERTED.id_lote
                VALUES  (?1,?2,?3,?4)
                """;

        try {

            em.getTransaction().begin();
            Integer idCertificado = null;
            if(lote.getCerti() != null){
                idCertificado = lote.getCerti().getId_certifiado();
            }

            Number idLote = (Number)em.createNativeQuery(sql)
                .setParameter(1, lote.getProducto().getId_producto())
                .setParameter(2, idCertificado)
                .setParameter(3, lote.getNumero_lote())
                .setParameter(4, lote.getStock_lote())
                .getSingleResult();

            em.getTransaction().commit();
            return idLote.intValue();
            
        } catch (Exception e) {
             e.printStackTrace();
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            return -1;
            
        } finally {
            em.close();
        }
    }

    @SuppressWarnings("unchecked")
    public List<LotesDTO> mostarMLotesDTOs(int idProducto){
        EntityManager em = emf.createEntityManager();
        List<LotesDTO> listaLotes = new ArrayList<>();

        String sql = """
                SELECT 
                    L.id_lote,
                    L.numero_lote, 
                    L.fecha_entrada,
                    L.stock_lote,
                    C.archivo_url 
                    FROM 
                    productos AS P
                    INNER JOIN lotes AS L ON P.id_producto = L.id_producto
                    LEFT JOIN certificados AS C ON L.id_certificado = C.id_certificado
                    WHERE P.id_producto = ?1
                """;

        try {
            
            List<Object[]> resultado = em.createNativeQuery(sql)
                .setParameter(1, idProducto)
                .getResultList();

            for(Object[] fila : resultado){
                LotesDTO lote = new LotesDTO();
                lote.setId_lote(((Number)fila[0]).intValue());
                lote.setNumero_lote((String)fila[1]);

                lote.setFecha_entrada((java.util.Date) fila[2]);
                lote.setStock_lote(((Number) fila[3]).intValue());
                
                String archivoUrl = (String)fila[4];
                if (archivoUrl != null && !archivoUrl.trim().isEmpty()) {
                    CertificadosDTO certi = new CertificadosDTO();
                    certi.setArchivo_url(archivoUrl);
                    lote.setCerti(certi);
                }

                listaLotes.add(lote);
            }


        } catch (Exception e) {
           e.printStackTrace();
        } finally {
            em.close();
        }
        
        return listaLotes;
    }

}
