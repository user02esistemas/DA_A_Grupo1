package com.Control;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.DAO.EntidadesDAO;
import com.DAO.TipoEntidadesDAO;
import com.DTO.EntidadesDTO;
import com.DTO.TipoEntidadesDTO;
import com.google.gson.Gson;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

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
                        break;
                    }
                    String errorValidacion = validarEntidad(entidad);
                    if (errorValidacion != null) {
                        resultResponse.put("success", false);
                        resultResponse.put("error", errorValidacion);
                        out.print(gson.toJson(resultResponse));
                        break;
                    }

                    boolean insertado = entidadesDAO.insertarEntidad(entidad);



                    if (insertado) {
                        resultResponse.put("success", true);
                        resultResponse.put("message", "Entidad registrada con éxito");
                    } else {
                        response.setStatus(HttpServletResponse.SC_CONFLICT);
                        resultResponse.put("success", false);
                        resultResponse.put("error", "Error interno al insertar la entidad");
                    }
                    break;
            
                case "actualizar":
                    if (entidad == null) {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        resultResponse.put("success", false);
                        resultResponse.put("error", "Datos de entidad vacíos o no válidos.");
                        break;
                    }
                    String errorValidacionUpd = validarEntidad(entidad);
                    if (errorValidacionUpd != null) {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        resultResponse.put("success", false);
                        resultResponse.put("error", errorValidacionUpd);
                        break;
                    }

                    boolean actualizado = entidadesDAO.actualizarEntidad(entidad);
                    if (actualizado) {
                        resultResponse.put("success", true);
                        resultResponse.put("message", "Entidad actualizada con éxito");
                    } else {
                        response.setStatus(HttpServletResponse.SC_CONFLICT);
                        resultResponse.put("success", false);
                        resultResponse.put("error", "Ya existe una entidad registrada con ese número de documento.");
                    }
                    break;

                case "eliminar":
                    if (entidad == null || entidad.getIdEntidad() == null || entidad.getIdEntidad() <= 0) {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        resultResponse.put("success", false);
                        resultResponse.put("error", "ID de entidad no válido para inhabilitar");
                        break;
                    }

                    boolean eliminado = entidadesDAO.eliminarEntidad(entidad.getIdEntidad());
                    if (eliminado) {
                        resultResponse.put("success", true);
                        resultResponse.put("message", "Entidad inhabilitada/eliminada con éxito");
                    } else {
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        resultResponse.put("success", false);
                        resultResponse.put("error", "Error al inhabilitar la entidad en base de datos");
                    }
                    break;

                default:
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    resultResponse.put("success", false);
                    resultResponse.put("error", "Acción POST no válida: " + action);
                    break;
            }
            
        out.print(gson.toJson(resultResponse));

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
    
    private String validarEntidad(EntidadesDTO entidad) {
        if (entidad.getNumeroDocumento() != null && !entidad.getNumeroDocumento().trim().isEmpty()) {
            String doc = entidad.getNumeroDocumento().trim();
            if (!doc.matches("\\d+")) {
                return "El número de documento solo debe contener dígitos.";
            }
            if ("DNI".equals(entidad.getTipoDocumento()) && doc.length() != 8) {
                return "El DNI debe tener exactamente 8 dígitos.";
            }
            if ("RUC".equals(entidad.getTipoDocumento()) && doc.length() != 11) {
                return "El RUC debe tener exactamente 11 dígitos.";
            }
        }

        if (entidad.getTelefono() != null && !entidad.getTelefono().trim().isEmpty()) {
            if (!entidad.getTelefono().trim().matches("\\d{9}")) {
                return "El teléfono debe tener exactamente 9 dígitos numéricos.";
            }
        }

        if (entidad.getEmail() != null && !entidad.getEmail().trim().isEmpty()) {
            if (!entidad.getEmail().trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                return "El correo electrónico no tiene un formato válido.";
            }
        }

        return null;
    }
}

