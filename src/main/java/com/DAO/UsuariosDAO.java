package com.DAO;

import com.DTO.UsuariosDTO;
import java.util.*;


import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import jakarta.persistence.Query;
import org.mindrot.jbcrypt.BCrypt;

public class UsuariosDAO {
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("SDDGPU");

    public boolean insertarUsuario(UsuariosDTO usu){
        EntityManager em = emf.createEntityManager();

        String sql = """
                    
                    INSERT INTO usuarios ( id_entidad, 
                                            usuario, 
                                            password, 
                                            id_rol, id_estado)
                    VALUES (?1, ?2, ?3, ?4, ?5)
        
                    """;

        try {
            String hashSeguro = BCrypt.hashpw(usu.getPaswordHash(), BCrypt.gensalt());
            
            em.getTransaction().begin();
            em.createNativeQuery(sql)
                .setParameter(1, usu.getIdEntidad())
                .setParameter(2, usu.getUsuario())
                .setParameter(3, hashSeguro)
                .setParameter(4, usu.getIdRol())
                .setParameter(5, 15)
                .executeUpdate();

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

    public UsuariosDTO confimarCredenciales(String username, String contraseña){
        EntityManager em = emf.createEntityManager();
        UsuariosDTO usu = null;
        String sql = """
                SELECT  
                    U.id_usuario,
                    U.id_entidad,
                    U.password,
                    U.usuario,
                    EN.nombre_razon_social,
                    U.id_rol,
                    R.nombre
                FROM usuarios U
                INNER JOIN entidades EN ON U.id_entidad = EN.id_entidad
                INNER JOIN estados_sistema E ON U.id_estado = E.id_estado
                INNER JOIN roles R ON R.id_rol = U.id_rol
                where u.usuario = ?
	            and E.nombre = 'ACTIVO'
                """;

        try {
            em.getTransaction().begin();
            Object[] resultado = (Object[]) em.createNativeQuery(sql)
                .setParameter(1, username)
                .getSingleResult();

            String hash  = ((String) resultado[2]);

            if(BCrypt.checkpw(contraseña, hash)){

                usu = new UsuariosDTO();
                usu.setIdUsuario((Integer)resultado[0]);
                usu.setIdEntidad((Integer)resultado[1]);
                usu.setUsuario((String)resultado[3]);
                usu.setNombreEntidad((String)resultado[4]);
                usu.setIdRol((Integer)resultado[5]);
                usu.setNombreRol((String)resultado[6]);

            }else{
                System.out.println("Login fallido: Contraseña incorrecta para el usuario " + username);
            }
            
            
        } catch (Exception e) {
            e.printStackTrace();
        }finally {
            em.close();
        }
        return usu;         
    }

    @SuppressWarnings("unchecked")

    public List<UsuariosDTO> listarUsuarios(){
        EntityManager em = emf.createEntityManager();
        List<UsuariosDTO> listUsu = new ArrayList<>();

        String sql = """
                SELECT 
                    Us.id_usuario,
                    Ent.nombre_razon_social,
                    Us.usuario,
                    R.nombre AS Rol,
                    Est.nombre AS Estado
                FROM usuarios AS Us
                INNER JOIN entidades AS Ent ON Us.id_entidad = Ent.id_entidad
                INNER JOIN roles AS R ON Us.id_rol = R.id_rol
                INNER JOIN estados_sistema Est ON Us.id_estado = Est.id_estado
                """;

        try{
            Query query = em.createNativeQuery(sql);
            List<Object[]> results = query.getResultList();

            for(Object[] fila : results){
                UsuariosDTO usu = new UsuariosDTO();

                usu.setIdUsuario(((Number) fila[0]).intValue());
                usu.setNombreEntidad((String) fila[1]);
                usu.setUsuario((String)fila[2]);
                usu.setNombreRol((String)fila[3]);
                usu.setNombreEstado((String)fila[4]);
                listUsu.add(usu);
            }
        }catch (Exception e) {
            e.printStackTrace();
        } finally {
            em.close();
        }
        return listUsu;
    }
}
