package com.Control;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.*;

import com.DAO.*;
import com.DTO.*;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

@WebServlet("/InventarioController")
public class InventarioController extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private ProductosDAO prodDAO = new ProductosDAO();
    private Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String accion = request.getParameter("action");

        if(accion == null || accion.trim().isEmpty()){
            accion = "listarProductos";
        }

        PrintWriter out = null;
        try {
            out = response.getWriter();
            switch (accion) {
                case "listarProductos":
                    List<ProductosDTO> listaPrd = prodDAO.mostrarProductos(); 
                    out.print(gson.toJson(listaPrd));
                    break;
                
                case "listarCategorias":
                    List<CategoriasDTO> listaCat = prodDAO.mostrarCategorias();
                    out.print(gson.toJson(listaCat));
                    break;

                case "listarMedidas":
                    List<UnidadesDTO> listaMedidas = prodDAO.mostrarMedidas();
                    out.print(gson.toJson(listaMedidas));
                    break;
                    
                case "kardex":
                    String idProdParam = request.getParameter("idProducto");
                    // Log para ver qué llega desde el navegador
                    System.out.println("DEBUG - ID recibido en Java: " + idProdParam); 

                    if (idProdParam != null && !idProdParam.isEmpty() && !idProdParam.equals("undefined")) {
                        try {
                            int idPro = Integer.parseInt(idProdParam);
                            List<MovimientosDTO> kardex = prodDAO.mostrarKardex(idPro);
                            out.print(gson.toJson(kardex));
                        } catch (NumberFormatException e) {
                            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                            out.print("{\"error\":\"ID debe ser numérico\"}");
                        }
                    } else {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.print("{\"error\":\"ID Producto faltante\"}");
                    }
                    break;

                default:
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"error\":\"Acción GET no válida\"}");
                    break;
            }
        } catch (Exception e) {
            response.setStatus(
                HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

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
        PrintWriter out = null;
        try {
            out = response.getWriter();

            if(action.equals("insertar")){
                BufferedReader reader = request.getReader();

                JsonObject jsonObject = gson.fromJson(reader, JsonObject.class);

                ProductosDTO producto = gson.fromJson(jsonObject.get("producto"), ProductosDTO.class);
                LotesDTO lote = null;

                if(jsonObject.has("lote") && !jsonObject.get("lote").isJsonNull()){
                    lote = gson.fromJson(jsonObject.get("lote"),LotesDTO.class);
                }

                boolean insertado = prodDAO.insertarProducto(producto, lote)    ;

                if(insertado){
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.print("{\"success\": true, \"message\": \"Producto e inventario registrados con éxito en Solda-Master\"}");
                }else{
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"success\": false, \"error\": \"Error interno al insertar el producto en SQL Server\"}");
                }
            }else{
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"error\": \"Acción POST no válida\"}");
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); // Estado 500
            try {
                if (out == null) { 
                    out = response.getWriter(); 
                }
                
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("error", e.getMessage() != null ? e.getMessage() : "Error en doPost de Productos");
                out.print(gson.toJson(err));
                
            } catch (IOException ioEx) {
                ioEx.printStackTrace();
            }
        }

    }
}


