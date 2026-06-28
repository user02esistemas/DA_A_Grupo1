package com.Control;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.DAO.RolesDAO;
import com.DAO.UsuariosDAO;
import com.DTO.RolesDTO;
import com.DTO.UsuariosDTO;
import com.google.gson.Gson;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.io.*;


@WebServlet("/UsuariosController")

public class UsuariosController extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private RolesDAO rolesDAO = new RolesDAO();
    private UsuariosDAO usuDAO = new UsuariosDAO();
    private Gson gson = new Gson();
    

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String accion  = request.getParameter("action");

        if(accion == null || accion.trim().isEmpty()){
            accion = "listarUsu";
        }

        PrintWriter out = null;
        try{
            out = response.getWriter();
            switch (accion) {
                case "listarRoles":
                    List<RolesDTO> roles = rolesDAO.listarRoles();
                    out.print(gson.toJson(roles));
                    break;
                case "listarUsu" :
                    List<UsuariosDTO> usus = usuDAO.listarUsuarios();
                    out.print(gson.toJson(usus));
                    break;
                default:
                    break;
            }
        }catch(Exception e){
            response.setStatus(
                HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

            if(out == null){
                out = response.getWriter();
            }

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage() != null ? e.getMessage() : "Error interno en doGet");
            out.print(gson.toJson(errorResponse));
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String action = request.getParameter("action");

        if(action == null){
            action = "insertar";
        }

        try(PrintWriter out = response.getWriter()){
            BufferedReader reader = request.getReader();

            UsuariosDTO usuario = gson.fromJson(reader, UsuariosDTO.class);

            switch (action) {
                case "insertar":
                    boolean insertado = usuDAO.insertarUsuario(usuario);
                    if(insertado){
                        response.setStatus(HttpServletResponse.SC_OK);
                        out.print("{\"success\": true, \"message\": \"Usuario registrada con éxito en SQL Server\"}");
                    } else{
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); 
                        out.print("{\"success\": false, \"error\": \"Error interno en la base de datos al insertar\"}");
                    }
                    break;
                    
                case "login":
                    UsuariosDTO logeado = usuDAO.confimarCredenciales(usuario.getUsuario(), usuario.getPaswordHash());
                    
                    if(logeado !=null){
                        response.setStatus(HttpServletResponse.SC_OK);

                        out.print(gson.toJson(logeado));
                    }else{
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        out.print("{\"success\": false, \"error\": \"Credenciales incorrectas o usuario inactivo\"}");
                    }
                    break;
                default:
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST); 
                    out.print("{\"success\": false, \"error\": \"Acción POST no válida\"}");
                    break;
            }
        }catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); 
            try {
                response.getWriter().print("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
            } catch (IOException ioEx) {
                ioEx.printStackTrace();
            }
        }

    }
}

