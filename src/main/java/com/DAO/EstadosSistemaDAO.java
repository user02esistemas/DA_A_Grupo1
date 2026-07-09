package com.DAO;

import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import java.util.List;
import com.DTO.EstadosSistemaDTO;
import jakarta.persistence.EntityManager;
import java.util.ArrayList;
import jakarta.persistence.Query;



public class EstadosSistemaDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");

    @SuppressWarnings("unchecked")
    public List<EstadosSistemaDTO> listarEstados(String codigo){
        EntityManager em = emf.createEntityManager();
        List<EstadosSistemaDTO> estadosSistemaList = new ArrayList<>();

        String sql = """
                    SELECT id_estado,
                        tipo_codigo,
                        nombre
                    FROM estados_sistema
                    WHERE tipo_codigo = ?1
                """;
        try {
            Query query = em.createNativeQuery(sql);
            query.setParameter(1, codigo);

            List<Object[]> results = query.getResultList();

            for(Object[] fila: results){
                EstadosSistemaDTO estadoSistema = new EstadosSistemaDTO();
                estadoSistema.setIdEstado(((Number) fila[0]).intValue());
                estadoSistema.setCodigoEstado((String) fila[1]);
                estadoSistema.setNombreEstado((String) fila[2]);
                estadosSistemaList.add(estadoSistema);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }
        return estadosSistemaList;   
    }
}