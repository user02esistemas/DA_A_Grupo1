package com.Control;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

import com.DAO.*;
import com.DTO.*;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

@WebServlet("/VentaController")
public class VentaController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    VentaDAO ventaDAO = new VentaDAO();
    Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
       
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String action = request.getParameter("action");

        if(action == null || action.trim().isEmpty()){
            action = "insertar";
        }   
        PrintWriter out = response.getWriter();;
        try {
            

            if(action.equals("insertar")){

                BufferedReader reader = request.getReader();
                JsonObject jsonInput = gson.fromJson(reader, JsonObject.class); 

                VentaDTO venta = gson.fromJson(jsonInput.get("venta"), VentaDTO.class);

                PagoDTO pagoInicial = null;
                if (jsonInput.has("pagoInicial") && !jsonInput.get("pagoInicial").isJsonNull()) {
                    pagoInicial = gson.fromJson(jsonInput.get("pagoInicial"), PagoDTO.class);
                }

                double totalCalculado = 0.0;

                if(venta.getDetalle() != null){
                    for(DetalleVentaDTO detalle : venta.getDetalle()){
                        
                        double subTotalPd = (detalle.getCantidad() * detalle.getPrecio_unitario());
                        
                        subTotalPd -= (subTotalPd * detalle.getDescuento_prod());

                        totalCalculado += subTotalPd;
                    }
                }

                totalCalculado -= totalCalculado * venta.getDescuento_global();

                if(Math.abs(venta.getTotal() - totalCalculado) > 0.01){
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"success\": false, \"error\": \"Validación fallida: El total de la venta no coincide con la suma de sus detalles.\"}");
                    return;
                }

                if(venta.getCuotas() != null){
                    
                }

                boolean exito = ventaDAO.insertarVenta(venta, pagoInicial);
                
                if(exito){
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.print("{\"success\": true, \"message\": \"Venta y flujo financiero procesados con éxito en Solda-Master.\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"success\": false, \"error\": \"Error interno en el servidor al guardar la transacción en SQL Server.\"}");
                }
            }
        } catch (Exception e) {

            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\": false, \"error\": \"Error crítico en el controlador de ventas: " + e.getMessage() + "\"}");
        
        } finally {

            out.flush();
            out.close();
        }
    }
}