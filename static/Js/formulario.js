document.addEventListener("DOMContentLoaded", function () {
/*
    // -------------------- Fecha y hora actuales --------------------
    function mostrarFecha() {
        const now = new Date();
        const fecha = now.toLocaleDateString();
        const hora = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        document.getElementById("fecha-actual").textContent = `Fecha: ${fecha}`;
    }

    mostrarFecha();
*/
    // -------------------- Formulario de Tickets --------------------
    document.getElementById("enviar").addEventListener("click", async () => {
        // API para almacenar los datos en la base de datos
        try {
            const nombreape = document.getElementById("name").value;
            const correo = document.getElementById("email").value;
            const departamento = document.getElementById("department").value; 
            const incidencia = document.getElementById("incidencia").value; 

            if (!nombreape || !correo || !departamento || !incidencia) {
                Swal.showValidationMessage("Por favor, complete todos los campos.");
                return false;
            }
            
            const response = await fetch(`/agre/ticket?nombreape=${encodeURIComponent(nombreape)}&correo=${encodeURIComponent(correo)}&departamento=${encodeURIComponent(departamento)}&incidencia=${encodeURIComponent(incidencia)}`);

            // Manejar la respuesta del servidor
            if (response.ok) {
                Swal.fire({
                    title: "Éxito",
                    text: "Ticket generado con éxito.",
                    icon: "success",
                    confirmButtonText: "Aceptar"
                }).then(() => {
                    location.reload();
                });
                // Llamar a la API para enviar el correo en segundo plano sin mostrar alerta
                fetch(`/enviar/correo?correo=${encodeURIComponent(correo)}`)
                    .catch(error => console.error("Error al enviar el correo:", error));
            } else {
                Swal.fire("Error", "No se pudo registrar el Ticket.", "error");
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message || "Ocurrió un error inesperado.",
                confirmButtonText: "Aceptar",
            });
        }
    });
});

function limpiar() {
    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("department").value = "";
    document.getElementById("incidencia").value = ""; 
};