<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delgado EIRL - ERP & POS Industrial</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    },
                    colors: {
                        primary: {
                            50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
                            400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
                            800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
                        }
                    }
                }
            }
        }
    </script>

    <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.css" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link href="https://cdn.jsdelivr.net/npm/tom-select@2.2.2/dist/css/tom-select.default.min.css" rel="stylesheet">
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/animations/scale.css"/>

    <link rel="stylesheet" href="<%= request.getContextPath() %>/erp_spa/css/styles.css">
    <link rel="stylesheet" href="<%= request.getContextPath() %>/erp_spa/css/dashboard.css">
    <link rel="stylesheet" href="<%= request.getContextPath() %>/erp_spa/css/pos.css">
    <link rel="stylesheet" href="<%= request.getContextPath() %>/erp_spa/css/entities.css">
</head>

<body class="bg-[#0F172A] text-[#F8FAFC] font-sans antialiased overflow-hidden">

    <div id="app" class="h-screen w-full flex overflow-hidden"></div>
    <div id="modal-container"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/es.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/tom-select@2.2.2/dist/js/tom-select.complete.min.js"></script>
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script src="https://unpkg.com/@popperjs/core@2"></script>
    <script src="https://unpkg.com/tippy.js@6"></script>

    <script src="<%= request.getContextPath() %>/erp_spa/js/storage.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/js/utils.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/js/router.js"></script>


    <script src="<%= request.getContextPath() %>/erp_spa/components/modal.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/components/sidebar.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/components/header.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/components/tables.js"></script>

    <script src="<%= request.getContextPath() %>/erp_spa/pages/dashboard.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/pages/pos.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/pages/sales.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/pages/purchases.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/pages/entities.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/pages/inventory.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/pages/reports.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/pages/accounting.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/pages/installments.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/pages/movements.js"></script>
    <script src="<%= request.getContextPath() %>/erp_spa/pages/admin.js"></script>

    <script src="<%= request.getContextPath() %>/erp_spa/js/app.js"></script>
</body>

</html>