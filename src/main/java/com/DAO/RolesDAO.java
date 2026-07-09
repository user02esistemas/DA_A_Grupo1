package com.DAO;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import java.util.List;
import java.util.ArrayList;
import com.DTO.RolesDTO;
import jakarta.persistence.Query;

public class RolesDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");

    @SuppressWarnings("unchecked")

    public List<RolesDTO> listarRoles(){
        EntityManager em = emf.createEntityManager();
        List<RolesDTO> rolesList = new ArrayList<>();

        String sql = "SELECT * FROM roles";
        try {
            Query query = em.createNativeQuery(sql);
            List<Object[]> resultado = query.getResultList();
            
            for(Object[] fila: resultado){
                RolesDTO role = new RolesDTO();
                role.setIdRol(((Number) fila[0]).intValue());
                role.setNombreRol((String) fila[1]);

                rolesList.add(role);
            }
            

        } catch (Exception e) {
            e.printStackTrace();
        }finally{
            em.close();
        }
        return rolesList;
    }

}
