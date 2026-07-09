package com.DAO;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import java.util.List;
import com.DTO.TipoEntidadesDTO;
import jakarta.persistence.EntityManager;
import java.util.ArrayList;
import jakarta.persistence.Query;

public class TipoEntidadesDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");

    @SuppressWarnings("unchecked")
    public List<TipoEntidadesDTO> listarTipoEntidades() {
        EntityManager em = emf.createEntityManager();
        List<TipoEntidadesDTO> tipoEntidadesList = new ArrayList<>();

        String sql = """
                    SELECT id_tipo_entidad,
                        nombre
                    FROM tipos_entidad
                """;
        try {
            Query query = em.createNativeQuery(sql);
            List<Object[]> results = query.getResultList();
            
            for(Object[] fila: results){
                TipoEntidadesDTO tipoEntidades = new TipoEntidadesDTO();
                tipoEntidades.setIdTipoEntidad(((Number) fila[0]).intValue());
                tipoEntidades.setNombreTipoEntidad((String) fila[1]);
                tipoEntidadesList.add(tipoEntidades);
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }
        return tipoEntidadesList;
    }
}
