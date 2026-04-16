async function changeStatus(ticketId) {
    // 1. Buscamos la descripción antes de mostrar el modal
    let descripcion = "Cargando...";

    try {
        const response = await fetch(`/get-description/${ticketId}`);
        const data = await response.json();
        descripcion = data.description;
    } catch (error) {
        descripcion = "Error al cargar descripción";
    }

    Swal.fire({
        title: "Modificar Estatus",
        html: `<div style="text-align: left; background: #f3f4f6; pading: 10px; border-radius: 8px; margin-bottom: 10px;">
                <strong>Descripción del Usuario:</strong> <br><br> ${descripcion}
               </div>`,
        input: "select",
        inputOptions: {
            "En Proceso": "En Proceso",
            "Finalizado": "Finalizado"
        },
        inputPlaceholder: "Selecciona una opción",
        showCancelButton: true,
        confirmButtonText: "Actualizar",
        cancelButtonText: "Cancelar",
        preConfirm: (status) => {
            if (!status) {
                Swal.showValidationMessage("Debes seleccionar un estado");
                return false;
            }

            if (status === "En Proceso") {
                return Swal.fire({
                    title: "Selecciona un técnico",
                    input: "select",
                    inputOptions: {
                        "Cesar Serrano": "Cesar Serrano",
                        "Andres Mayora": "Andres Mayora",
                        "Yoscar Rodriguez": "Yoscar Rodriguez",
                        "Rances Romero": "Rances Romero",
                        "Luis Valenzuela": "Luis Valenzuela",
                        "Ricardo Vidal": "Ricardo Vidal",
                        "Simon Vargas": "Simon Vargas",
                        "Jesus Luces": "Jesus Luces"
                    },
                    inputPlaceholder: "Selecciona un técnico",
                    showCancelButton: true,
                    confirmButtonText: "Seleccionar",
                    cancelButtonText: "Cancelar",
                    preConfirm: (technician) => {
                        if (!technician) {
                            Swal.showValidationMessage("Debes seleccionar un técnico");
                        }
                        return technician;
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        return fetch(`/update-status/${ticketId}`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ status: status, technician: result.value })
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    let statusElement = document.getElementById(`status-${ticketId}`);

                                    // Cambiar el texto y la clase del estado según la selección
                                    if (status === "En Proceso") {
                                        statusElement.className = "ticket-status status-open";
                                        statusElement.textContent = "En Proceso";
                                    } else if (status === "Finalizado") {
                                        statusElement.className = "ticket-status status-completed";
                                        statusElement.textContent = "Finalizado";
                                    }

                                    Swal.fire("¡Actualizado!", "Tu Ticket se ha sido modificado.", "success")
                                        .then(() => location.reload()); // Refresca la página

                                } else {
                                    Swal.fire("Error", "No se pudo actualizar el estado.", "error");
                                }
                            })
                            .catch(() => Swal.fire("Error", "No se pudo conectar con el servidor.", "error"));
                    }
                });
            }

            if (status === "Finalizado") {
                return fetch(`/update-status/${ticketId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ status: status })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire("¡Actualizado!", "Tu ticket ha finalizado.", "success")
                                .then(() => location.reload()); // Refresca la página
                        } else {
                            Swal.fire("Error", "No se pudo actualizar el estado.", "error");
                        }
                    })
                    .catch(() => Swal.fire("Error", "No se pudo conectar con el servidor.", "error"));
            }
        }
    });
}

/*
// Toggle submenu
const submenus = document.querySelectorAll('.has-submenu');
submenus.forEach(menu => {
    menu.addEventListener('click', function(e) {
        e.preventDefault();
        const submenu = this.nextElementSibling;
        const icon = this.querySelector('.toggle-submenu');
        
        if (submenu.style.maxHeight) {
            submenu.style.maxHeight = null;
            icon.style.transform = 'rotate(0deg)';
        } else {
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
            icon.style.transform = 'rotate(90deg)';
        }
    });
});

// Toggle sidebar on mobile
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');

menuToggle.addEventListener('click', function() {
    sidebar.classList.toggle('active');
});
*/