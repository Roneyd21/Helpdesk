
document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-ES', options);
    
    // Incident type selection
    const incidentBtns = document.querySelectorAll('.incident-btn');
    incidentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            incidentBtns.forEach(b => b.classList.remove('selected', 'border-blue-400'));
            this.classList.add('selected', 'border-blue-400');
            
            // Get the incident title
            const incidentTitle = this.querySelector('h3').textContent;
            
            // Update preview
            document.querySelector('.ticket-preview h2').textContent = incidentTitle;
            document.getElementById('preview-incidence').textContent = incidentTitle;
            
            // Set the hidden input value
            document.getElementById('incidencia').value = incidentTitle;
        });
    });
    
    // Update preview when name or department changes
    document.getElementById('name').addEventListener('input', function() {
        document.getElementById('preview-name').textContent = this.value || 'Prueba Usuario';
    });
    
    document.getElementById('department').addEventListener('change', function() {
        document.getElementById('preview-department').textContent = this.value || 'Presidencia';
    });
    
    // Modificación del evento submit
    document.getElementById('ticketForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 1. Obtener valores y validar
        const nombreape = document.getElementById('name').value;
        const correo = document.getElementById('email').value;
        const departamento = document.getElementById('department').value;
        const incidencia = document.getElementById('incidencia').value;
        const descri = document.getElementById('desc').value;

        if (!nombreape || !correo || !departamento || !incidencia) {
            Swal.fire({
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Por favor, complete todos los campos requeridos',
                confirmButtonText: 'Aceptar'
            });
            return;
        }

        // 2. Preparar FormData para enviar archivos
        const formData = new FormData();
        formData.append('nombreape', nombreape);
        formData.append('correo', correo);
        formData.append('departamento', departamento);
        formData.append('incidencia', incidencia);
        formData.append('descri', descri);

        if (fotoSeleccionada) {
            formData.append('foto', fotoSeleccionada);
        }

        // 3. Estado visual de carga
        const submitBtn = document.getElementById('enviar');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Enviando...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/agre/ticket', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    title: "Éxito",
                    text: data.message,
                    icon: "success",
                    confirmButtonText: "Aceptar"
                }).then(() => {
                    limpiar(); // Llama a la función limpiar actualizada
                });

                // Envío de correo en segundo plano
                fetch(`/enviar/correo?correo=${encodeURIComponent(correo)}`)
                    .catch(err => console.error("Error correo:", err));
            } else {
                throw new Error(data.error || "Error en el servidor");
            }
        } catch (error) {
            Swal.fire("Error", error.message, "error");
        } finally {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});


let fotoSeleccionada = null; // Variable global

function abrirModalFoto() {
    Swal.fire({
        title: 'Cargar Evidencia',
        html: `
            <div class="text-center">
                <p class="text-lg text-yellow-600 mb-2">⏳ Esta opción aún no está disponible</p>
                <p class="text-sm text-gray-500">Estamos trabajando en esta nueva opción para ti</p>
                <p class="text-xs text-gray-400 mt-3">Pronto podrás cargar tus fotos de evidencia</p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Entendido',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: '¡Gracias!',
                text: 'Te notificaremos cuando esta función esté disponible',
                icon: 'info',
                timer: 2000,
                showConfirmButton: false
            });
        }
    });
}
// function abrirModalFoto() {
//     Swal.fire({
//         title: 'Cargar Evidencia',
//         html: `
//             <input type="file" id="swal-input-file" class="swal2-file" accept="image/*">
//             <p class="text-sm text-gray-500 mt-2">Formatos: JPG, PNG. Máx 5MB</p>
//         `,
//         showCancelButton: true,
//         confirmButtonText: 'Guardar Foto',
//         preConfirm: () => {
//             const file = document.getElementById('swal-input-file').files[0];
//             if (!file) {
//                 Swal.showValidationMessage('Debes seleccionar un archivo');
//             }
//             return file;
//         }
//     }).then((result) => {
//         if (result.isConfirmed) {
//             fotoSeleccionada = result.value;
//             document.getElementById('foto-status').textContent = "¡Foto Cargada!";
//             document.getElementById('btn-foto').classList.replace('bg-gray-100', 'bg-green-100');
//             document.getElementById('btn-foto').classList.add('text-green-700');
//         }
//     });
// }

function limpiar() {
    document.getElementById("ticketForm").reset();
    fotoSeleccionada = null; // Resetear la foto
    
    // Resetear el botón de foto a su estado original
    const btnFoto = document.getElementById('btn-foto');
    document.getElementById('foto-status').textContent = "Anexar Evidencia (Foto)";
    btnFoto.className = "w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center transition";
    
    // Resetear estilos de los botones de incidencia
    document.querySelectorAll('.incident-btn').forEach(b => b.classList.remove('selected', 'border-blue-400'));
    document.getElementById('preview-incidence').textContent = 'Incidencia';
    document.getElementById('preview-name').textContent = 'Prueba Usuario';
    document.getElementById('preview-department').textContent = 'Presidencia';
}