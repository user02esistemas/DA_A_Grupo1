package com.Control;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import com.DAO.CertificadosDAO;
import com.DAO.EntidadesDAO;
import com.DAO.LotesDAO;
import com.DAO.ProductosDAO;
import com.DAO.UsuariosDAO;
import com.google.gson.Gson;

@WebServlet("/MaestroController")
public class MaestroController extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private CertificadosDAO certiDAO = new CertificadosDAO();
    private ProductosDAO prodDAO = new ProductosDAO();
    private EntidadesDAO entiDAO = new EntidadesDAO();
    private UsuariosDAO usuDAO = new UsuariosDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
       Map<String, Object> dataMaster = new HashMap<>();
        dataMaster.put("listar", entiDAO.listarEntidades());
        dataMaster.put("listarUsu", usuDAO.listarUsuarios());
        dataMaster.put("listarProd", prodDAO.mostrarProductos());
        dataMaster.put("listarCerti", certiDAO.mostrarCertificados());

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(new Gson().toJson(dataMaster));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    }
}