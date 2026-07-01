package com.DAO;
import java.util.ArrayList;
import java.util.List;

import com.DTO.EntidadesDTO;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import jakarta.persistence.Query;

public class EntidadesDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");

    public boolean insertarEntidad(EntidadesDTO entidad){
        EntityManager em = emf.createEntityManager();
        String sql = "INSERT INTO entidades (id_tipo_entidad, tipo_documento, numero_documento, nombre_razon_social, email, "+
                                             " direccion, telefono, id_estado) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)";

        try{
            em.getTransaction().begin();
            em.createNativeQuery(sql)
                .setParameter(1, entidad.getIdTipoEntidad())
                .setParameter(2, entidad.getTipoDocumento())
                .setParameter(3, entidad.getNumeroDocumento())
                .setParameter(4, entidad.getNombre_RazonSocial())
                .setParameter(5, entidad.getEmail())
                .setParameter(6, entidad.getDireccion())
                .setParameter(7, entidad.getTelefono())
                .setParameter(8, 12)
                .executeUpdate();
            em.getTransaction().commit();
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            return false;
            
        } finally {
            em.close();
        }
    }

    @SuppressWarnings("unchecked")

    public List<EntidadesDTO> listarEntidades(){
        EntityManager em = emf.createEntityManager();
        List<EntidadesDTO> entidadesList = new ArrayList<>();

        String sql = """
            SELECT Ten.nombre AS TIPO,
                En.id_entidad,
                En.tipo_documento,
                En.numero_documento,
                En.nombre_razon_social,
                En.direccion,
                En.email,
                En.telefono,
                Est.nombre AS ESTADO
            FROM entidades AS En
            INNER JOIN estados_sistema AS Est
                ON En.id_estado = Est.id_estado
            INNER JOIN tipos_entidad AS Ten
                ON En.id_tipo_entidad = Ten.id_tipo_entidad
            """;

        try{
            Query query = em.createNativeQuery(sql);
            List<Object[]> results = query.getResultList();
            for(Object[] fila: results){
                EntidadesDTO entidad = new EntidadesDTO();
                entidad.setNombreTipoEntidad((String) fila[0]);
                entidad.setIdEntidad(((Number) fila[1]).intValue());
                entidad.setTipoDocumento((String) fila[2]);
                entidad.setNumeroDocumento((String) fila[3]);
                entidad.setNombre_RazonSocial((String) fila[4]);
                entidad.setDireccion((String) fila[5]);
                entidad.setEmail((String) fila[6]);
                entidad.setTelefono((String) fila[7]);
                entidad.setNombreEstado((String) fila[8]);
                entidadesList.add(entidad);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }
        return entidadesList;
    }

    public boolean actualizarEntidad(EntidadesDTO entidad) {
        EntityManager em = emf.createEntityManager();
        String sql = """
                    UPDATE entidades 
                    SET id_tipo_entidad = ?1, 
                        tipo_documento = ?2, 
                        numero_documento = ?3, 
                        nombre_razon_social = ?4, 
                        email = ?5, 
                        direccion = ?6, 
                        telefono = ?7, 
                        id_estado = ?8
                    WHERE id_entidad = ?9
                    """;
        try {
            em.getTransaction().begin();
            em.createNativeQuery(sql)
                .setParameter(1, entidad.getIdTipoEntidad())
                .setParameter(2, entidad.getTipoDocumento())
                .setParameter(3, entidad.getNumeroDocumento())
                .setParameter(4, entidad.getNombre_RazonSocial())
                .setParameter(5, entidad.getEmail())
                .setParameter(6, entidad.getDireccion())
                .setParameter(7, entidad.getTelefono())
                .setParameter(8, entidad.getIdEstado()) // Mapeado desde el DTO correspondiente
                .setParameter(9, entidad.getIdEntidad())
                .executeUpdate();
            em.getTransaction().commit();
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            return false;
        } finally {
            em.close();
        }
    }

    public boolean eliminarEntidad(int idEntidad) {
        EntityManager em = emf.createEntityManager();
        String sql = """
                    DELETE FROM entidades 
                    WHERE id_entidad = ?1
                    """;
        try {
            em.getTransaction().begin();
            em.createNativeQuery(sql)
                .setParameter(1, idEntidad)
                .executeUpdate();
            em.getTransaction().commit();
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            return false;
        } finally {
            em.close();
        }
    }

}
