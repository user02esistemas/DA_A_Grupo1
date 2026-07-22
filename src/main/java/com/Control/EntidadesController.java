package com.Control;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.DAO.EntidadesDAO;
import com.DTO.EntidadesDTO;
import com.DAO.TipoEntidadesDAO;
import com.DTO.TipoEntidadesDTO;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;

import java.io.*;
import java.util.*;

@WebServlet("/EntidadesController")
public class EntidadesController extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private EntidadesDAO entidadesDAO = new EntidadesDAO();
    private TipoEntidadesDAO tipoEntidadesDAO = new TipoEntidadesDAO();
    private Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        String action = request.getParameter("action");

        if(action == null || action.trim().isEmpty()){
            action = "listar";
        }
        
        
        try (PrintWriter out = response.getWriter()) {
            switch (action) {
                case "listar":
                    List<EntidadesDTO> entidades = entidadesDAO.listarEntidades();
                    out.print(gson.toJson(entidades));
                    break;

                case "listarTipoEnt":
                    List<TipoEntidadesDTO> tipoEntidades = tipoEntidadesDAO.listarTipoEntidades();
                    out.print(gson.toJson(tipoEntidades));
                    break;
                default:
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"error\":\"Acción no válida\"}");
                    break;
            }

        } catch (Exception e) {

           response.setStatus(
                HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

            response.getWriter().print(
                    "{\"error\":\"" + e.getMessage() + "\"}"
            );
        }

    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        String action = request.getParameter("action");
        if (action == null || action.trim().isEmpty()) {
            action = "insertar";
        }

        try(PrintWriter out = response.getWriter()){

            BufferedReader reader = request.getReader();

            EntidadesDTO entidad = gson.fromJson(reader, EntidadesDTO.class);
            Map<String, Object> resultResponse = new HashMap<>();

            switch (action) {
                case "insertar":
                    if (entidad == null) {
                        resultResponse.put("success", false);
                        resultResponse.put("error", "Datos de entidad vacíos o no válidos.");
                        return;
                    }

                    boolean insertado = entidadesDAO.insertarEntidad(entidad);

                    if (insertado) {
                        resultResponse.put("success", true);
                        resultResponse.put("message", "Entidad registrada con éxito");
                    } else {
                        resultResponse.put("success", false);
                        resultResponse.put("error", "Error interno al insertar la entidad");
                    }
                    break;
            
                case "actualizar":
                   if (entidad == null) {
                        resultResponse.put("success", false);
                        resultResponse.put("error", "Datos de entidad vacíos o no válidos.");
                        return;
                    }

                    boolean actualizado = entidadesDAO.actualizarEntidad(entidad);
                    if (actualizado) {
                        resultResponse.put("success", true);
                        resultResponse.put("message", "Entidad actualizada con éxito");
                    } else {
                        resultResponse.put("success", false);
                        resultResponse.put("error", "Error interno al actualizar la entidad");
                    }
                    break;

                case "eliminar":
                    if (entidad == null || entidad.getIdEntidad() <= 0) {
                        resultResponse.put("success", false);
                        resultResponse.put("error", "ID de entidad no válido para inhabilitar");
                        return;
                    }

                    boolean eliminado = entidadesDAO.eliminarEntidad(entidad.getIdEntidad());
                    if (eliminado) {
                        resultResponse.put("success", true);
                        resultResponse.put("message", "Entidad inhabilitada/eliminada con éxito");
                    } else {
                        resultResponse.put("success", false);
                        resultResponse.put("error", "Error al inhabilitar la entidad en base de datos");
                    }
                    break;

                default:
                    resultResponse.put("success", false);
                    resultResponse.put("error", "Acción POST no válida: " + action);
                    break;
            }

        }catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); // Estado 500
            try {
                response.getWriter().print("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
            } catch (IOException ioEx) {
                ioEx.printStackTrace();
            }
        }
    
    }
}

