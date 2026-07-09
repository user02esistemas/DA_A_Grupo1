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

import java.util.List;
import java.io.*;

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

        if(action ==null){
            action = "insertar";
        }

        try(PrintWriter out = response.getWriter()){

            BufferedReader reader = request.getReader();

            EntidadesDTO entidad = gson.fromJson(reader, EntidadesDTO.class);

            switch (action) {
                case "insertar":
                    boolean insertado = entidadesDAO.insertarEntidad(entidad);
                    
                    if (insertado) {
                    response.setStatus(HttpServletResponse.SC_OK); // Estado 200
                    out.print("{\"success\": true, \"message\": \"Entidad registrada con éxito en SQL Server\"}");
                    } else {
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); // Estado 500
                        out.print("{\"success\": false, \"error\": \"Error interno en la base de datos al insertar\"}");
                    }
                    break;
            
                case "actualizar":
                    response.setStatus(HttpServletResponse.SC_NOT_IMPLEMENTED); // Estado 501
                    out.print("{\"success\": false, \"error\": \"La función de actualización aún no está implementada\"}");
                    break;
                default:
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST); // Estado 400
                    out.print("{\"success\": false, \"error\": \"Acción POST no válida\"}");
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

