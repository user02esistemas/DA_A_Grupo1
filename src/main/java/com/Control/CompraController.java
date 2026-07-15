package com.Control;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;


import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.DTO.*;
import com.DAO.*;
import java.util.*;

@WebServlet("/CompraController")
public class CompraController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private OrdenDAO ordenDAO = new OrdenDAO();
    private CompraDAO compraDAO = new CompraDAO();
    private Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String accion  = request.getParameter("action");

        if(accion == null || accion.trim().isEmpty()){
            accion = "listarOrden";
        }

        PrintWriter out = null;
        try {
            out = response.getWriter();


            switch (accion) {
                case "listarOrdenes":
                    List<OrdenCompraDTO> listTotalOrdenes = ordenDAO.listarTodasLasOrdenes();
                    out.print(gson.toJson(listTotalOrdenes));
                    break;
                
                case "ordenesPendientes":
                    List<OrdenCompraDTO> listaOrdPendientes = ordenDAO.listarOrdenesPendientes();
                    out.print(gson.toJson(listaOrdPendientes));
                    break;
                    
                case "listarOrden":
                    String idParametro = request.getParameter("idOrden");

                    if (idParametro == null || idParametro.trim().isEmpty()) {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.print("{\"error\":\"Falta el parámetro idOrden\"}");
                        return;
                    }

                    int idOrden = Integer.parseInt(idParametro);
                    OrdenCompraDTO orden = ordenDAO.listarOrden(idOrden);

                    if (orden == null) {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"error\":\"Orden no encontrada\"}");
                        return;
                    }

                    out.print(gson.toJson(orden));
                    break;

                case "listarCompras":          
                    List<CompraDTO> listaTotalCompras = compraDAO.listarTodasCompras();
                    out.print(gson.toJson(listaTotalCompras));
                    break;
                
                case "obtenerCompra":
                    String idCompraParametro = request.getParameter("idCompra");

                    if (idCompraParametro == null || idCompraParametro.trim().isEmpty()) {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.print("{\"error\":\"Falta el parámetro idCompra\"}");
                        return;
                    }

                     int idCompra = Integer.parseInt(idCompraParametro);
                     CompraDTO compra = compraDAO.obtenerCompra(idCompra);

                    if(compra == null){
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"error\":\"Compra no encontrada\"}");
                        return;
                    }
                    out.print(gson.toJson(compra));
                    break;
                    
                default:
                    break;
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            if (out == null) { 
                out = response.getWriter(); 
            }
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage() != null ? e.getMessage() : "Error interno en el doGet de Compras");
            out.print(gson.toJson(errorResponse));
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String action = request.getParameter("action");
        
        if(action == null || action.trim().isEmpty()){
            action = "insertarCompra";
        }

        PrintWriter out = null;

        try {
            out = response.getWriter();
            BufferedReader reader = request.getReader();

            switch (action) {
                case "insertarOrden":

                    Gson customGson = new GsonBuilder()
                    .setDateFormat("yyyy-MM-dd")
                    .create();

                    OrdenCompraDTO orden = customGson.fromJson(reader, OrdenCompraDTO.class);

                    
                    double totalCalculado = 0.0;
                    
                    if(orden.getDetalles() != null){
                        for(DetalleOrdenDTO detalle : orden.getDetalles()){
                            double subTotalDetalle = detalle.getCantidadPedida() * detalle.getPrecioUnitarioPactado();

                            totalCalculado += subTotalDetalle;
                        }
                    }

                    if(Math.abs(orden.getTotalEstimado() - totalCalculado) > 0.01 ){
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.print("{\"success\": false, \"error\": \"Validación fallida: El total de la orden no coincide con la suma de sus detalles.\"}");
                        return;
                    }

                    boolean ordenInsertada = ordenDAO.insertarOrden(orden);

                    if(ordenInsertada){
                        response.setStatus(HttpServletResponse.SC_OK);
                        out.print("{\"success\": true, \"message\": \"Orden de comopra registrada con éxito en Solda-Master\"}");
                    }else{
                         response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        out.print("{\"success\": false, \"error\": \"Error interno al insertar orden de compra en SQL Server\"}");
                    }
                    
                    break;
                
                case "insertarCompra":
                    CompraDTO compra = gson.fromJson(reader,CompraDTO.class);
                    
                    double totalCalculadoCompra =  0.0;
                    if(compra.getDetallesCom() != null){
                        for(DetalleCompraDTO detalleCom : compra.getDetallesCom()){
                            double subTotal = detalleCom.getPrecio_costo_unitario() * detalleCom.getCantidad();

                            totalCalculadoCompra += subTotal;
                        }
                    }

                    if(Math.abs(compra.getMontoTotal() - totalCalculadoCompra) > 0.01 ){
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.print("{\"success\": false, \"error\": \"Validación fallida: El total de la factura de compra no coincide con la suma de sus detalles.\"}");
                        return;
                    }
                    
                    boolean compraInsertada = compraDAO.insertarCompra(compra);   
                    
                    if(compraInsertada){
                        response.setStatus(HttpServletResponse.SC_OK);
                        out.print("{\"success\": true, \"message\": \"Compra registrada con éxito en Solda-Master\"}");
                    }else{
                         response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        out.print("{\"success\": false, \"error\": \"Error interno al insertar compra en SQL Server\"}");
                    }
                    
                    break;

                
                case "rechazarOrden":
                    String idParametroO = request.getParameter("idOrden");

                    if (idParametroO == null || idParametroO.trim().isEmpty()) {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.print("{\"success\": false, \"error\":\"Falta el parámetro idOrden para rechazar\"}");
                        return;
                    }

                    int idOrdenE = Integer.parseInt(idParametroO);
                    int idEstadoApl = Integer.parseInt(request.getParameter("idEstado"));
                    boolean ordenRechazada = ordenDAO.actualizarEstadoOrden(idOrdenE,idEstadoApl);

                    if (!ordenRechazada) {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"success\": false, \"error\":\"Orden no encontrada\"}");
                        return;
                    }

                    out.print("{\"success\": true}");
                    break;

                default:
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"success\": false, \"error\": \"Acción POST no válida en Compras\"}");
                    break;
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
