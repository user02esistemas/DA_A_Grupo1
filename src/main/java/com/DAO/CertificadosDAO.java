package com.DAO;

import java.util.*;
import com.DTO.CertificadosDTO;

import jakarta.persistence.*;

public class CertificadosDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");

    public int insertarCertificado(CertificadosDTO certi){
        EntityManager em = emf.createEntityManager();
        String sql = """
                INSERT INTO certificados (numero,
                                        fecha_emision,
                                        archivo_url)
                OUTPUT INSERTED.id_certificado
                VALUES (?1,?2,?3)
                """;
        
        try {

            em.getTransaction().begin();

            Number idGenerado = (Number) em.createNativeQuery(sql)
                .setParameter(1, certi.getNumeroCertificado())
                .setParameter(2, certi.getFecha_emision())
                .setParameter(3, certi.getArchivo_url())
                .getSingleResult();

            em.getTransaction().commit();

            return  idGenerado.intValue();
             
        } catch (Exception e) {
            e.printStackTrace();
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            return -1;
        }finally {
            em.close();
        }  
    }

    @SuppressWarnings("unchecked")
    public List<CertificadosDTO> mostrarCertificados(){
        EntityManager em = emf.createEntityManager();
        List<CertificadosDTO> listaCerti = new ArrayList<>();

        String sql = """
                 SELECT id_certificado, 
                        numero, 
                        fecha_emision, 
                        archivo_url 
                 FROM certificados  
                """;
        try {

            Query query = em.createNativeQuery(sql);
            List<Object[]> resultado = query.getResultList();
            for(Object[] fila : resultado){
                CertificadosDTO certi = new CertificadosDTO();
                certi.setId_certificado(((Number)fila[0]).intValue());
                certi.setNumeroCertificado((String)fila[1]);
                certi.setFecha_emision((Date)fila[2]);
                certi.setArchivo_url((String)fila[3]);
                listaCerti.add(certi);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }

        return listaCerti;
    }
/* 
    public CertificadosDTO buscarCertificado(String numero, Date fecha){
        EntityManager em  = emf.createEntityManager();
        String sql = """
                    SELECT id_certificado, numero, fecha_emision, archivo_url 
                 FROM certificados 
                 WHERE numero = ?1 AND fecha_emision = ?2  
                """;
        try {
            
            Object[] resultado = (Object[]) em.createNativeQuery(sql)
                .setParameter(1, numero)
                .setParameter(2, fecha)
                .getSingleResult();

            CertificadosDTO certi = new CertificadosDTO();
            certi.setId_certificado((Integer) resultado[0]);
            certi.setNumeroCertificado((String) resultado[1]);
            certi.setFecha_emision((Date) resultado[2]);
            certi.setArchivo_url((String) resultado[3]);

            return certi;

        } catch (NoResultException e) {
            return null;
        }catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            em.close();
        }
        
    }
 */

}
