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
import java.util.*;
import com.google.gson.Gson;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;

@WebServlet("/VentaController")
public class VentaController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    VentaDAO ventaDAO = new VentaDAO();
    Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd HH:mm:ss").create();


    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
       response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String action = request.getParameter("action");

        if(action == null || action.trim().isEmpty()){
            action = "listarMetodos";
        }  
        PrintWriter out = response.getWriter();

        try {

            switch (action) {
                case "listarMetodos":
                    List<MetodosPagoDTO> listaMetodosPagoDTOs = ventaDAO.listarMetodosDPago();
                    out.print(gson.toJson(listaMetodosPagoDTOs));
                    break;
                case "listarPagos":
                    List<VentaDTO> listaPagos = ventaDAO.listarPagos();
                    out.print(gson.toJson(listaPagos));
                    break;

                case "listarVentas":
                    List<VentaDTO> listaVentas = ventaDAO.listarTodasLasVentas();
                    out.print(gson.toJson(listaVentas));
                    break;

                case "listarCuotas":
                    List<CuotaDTO> listaCuotas = ventaDAO.listarTodasLasCuotas();
                    out.print(gson.toJson(listaCuotas));
                    break;

                
                case "listaCronograma" :
                    String idVenta = request.getParameter("idVenta");
                    if(idVenta != null && !idVenta.isEmpty() && !idVenta.equals("undefined")){
                        try {
                            int idVnt = Integer.parseInt(idVenta);
                            List<CuotaDTO> listaCronograma = ventaDAO.obtenerCronogramaPorVenta(idVnt);
                            out.print(gson.toJson(listaCronograma));
                        } catch (NumberFormatException e) {
                            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                            out.print("{\"error\":\"ID debe ser numérico\"}");
                        }
                    }else {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.print("{\"error\":\"ID venta faltante\"}");
                    }
                    break;

                default:
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"error\":\"Acción GET no válida\"}");
                    break;
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            if (out == null) { 
                out = response.getWriter(); 
            }
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage() != null ? e.getMessage() : "Error interno en el doGet de ventas");
            out.print(gson.toJson(errorResponse));
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String action = request.getParameter("action");

        if(action == null || action.trim().isEmpty()){
            action = "insertar";
        }   
        PrintWriter out = response.getWriter();
        try {
            switch (action) {
                case "insertar":
                    BufferedReader reader = request.getReader();
                    JsonObject jsonInput = gson.fromJson(reader, JsonObject.class); 

                    VentaDTO venta = gson.fromJson(jsonInput.get("venta"), VentaDTO.class);

                    double totalCalculado = 0.0;

                    if(venta.getDetalle() != null){
                        for(DetalleVentaDTO detalle : venta.getDetalle()){
                            
                            int cantidad = (detalle.getCantidad() != null) ? detalle.getCantidad() : 0;
                            double precioUnitario = (detalle.getPrecio_unitario() != null) ? detalle.getPrecio_unitario() : 0.0;
                            double descuentoProd = (detalle.getDescuento_prod() != null) ? detalle.getDescuento_prod() : 0.0;

                            double subTotalPd = (cantidad * precioUnitario);
                            
                            subTotalPd -= (subTotalPd * descuentoProd);

                            totalCalculado += subTotalPd;
                        }
                    }

                    double descuentoGlobal = (venta.getDescuento_global() != null) ? venta.getDescuento_global() : 0.0;
                    totalCalculado -= totalCalculado * descuentoGlobal;

                    double igvCalculado = totalCalculado * 0.18;
                    totalCalculado = totalCalculado + igvCalculado;

                    double totalVenta = (venta.getTotal() != null) ? venta.getTotal() : 0.0;

                    if(Math.abs(totalVenta - totalCalculado) > 0.05){
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.print("{\"success\": false, \"error\": \"Validación fallida: El total de la venta no coincide con la suma de sus detalles.\"}");
                        return;
                    }

                    double totalPagadoAcumulado = 0.0;
                    if (venta.getPagos() != null) {
                        for (PagoDTO pago : venta.getPagos()) {
                            totalPagadoAcumulado += (pago.getMonto_total() != null) ? pago.getMonto_total() : 0.0;
                        }
                    }

                    if (venta.getCuotas() != null && !venta.getCuotas().isEmpty()) {
                        double sumaCuotas = 0.0;
                        for (CuotaDTO cuota : venta.getCuotas()) {
                            sumaCuotas += (cuota.getMonto() != null) ? cuota.getMonto() : 0.0;
                        }

                        
                        double saldoAFinanciar = totalCalculado - totalPagadoAcumulado;

                        
                        if (Math.abs(sumaCuotas - saldoAFinanciar) > 0.05) {
                            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                            out.print("{\"success\": false, \"error\": \"Validación de Crédito fallida: La suma de las cuotas (" + sumaCuotas + ") no coincide con el saldo financiado restante (" + saldoAFinanciar + ").\"}");
                            return;
                        }
                    }

                    boolean exito = ventaDAO.insertarVenta(venta);
                    
                    if(exito){
                        response.setStatus(HttpServletResponse.SC_OK);
                        out.print("{\"success\": true, \"message\": \"Venta y flujo financiero procesados con éxito en Solda-Master.\"}");
                    } else {
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        out.print("{\"success\": false, \"error\": \"Error interno en el servidor al guardar la transacción en SQL Server.\"}");
                    }

                    break;
                
                case "procesarAbono":
                    BufferedReader readerAbono = request.getReader();
                    PagoDTO pagoAbono = gson.fromJson(readerAbono, PagoDTO.class);

                    if (pagoAbono == null || pagoAbono.getMonto_total() == null || pagoAbono.getMonto_total() <= 0) {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.print("{\"success\": false, \"error\": \"El monto ingresado debe ser mayor a cero.\"}");
                        return;
                    }

                    int idVentaAbono = pagoAbono.getVenta().getIdVenta();
                    double montoAbonar = pagoAbono.getMonto_total();
                    double saldoRealEnBD = ventaDAO.obtenerSaldoPendienteVenta(idVentaAbono);
                    if (montoAbonar > (saldoRealEnBD + 0.05)) {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.print("{\"success\": false, \"error\": \"Validación denegada: El monto ingresado (S/ " + montoAbonar 
                                + ") supera el saldo pendiente real de la venta (S/ " + saldoRealEnBD + ").\"}");
                        return;
                    }

                    boolean abonoExitoso = ventaDAO.procesarAbono(pagoAbono);

                    if (abonoExitoso) {
                        response.setStatus(HttpServletResponse.SC_OK);
                        out.print("{\"success\": true, \"message\": \"¡Excelente! Abono validado, procesado y distribuido correctamente.\"}");
                    } else {
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        out.print("{\"success\": false, \"error\": \"Ocurrió un error en el servidor al intentar registrar el abono en SQL Server.\"}");
                    }

                    break;
                default:
                    break;
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