
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

// ========== NUEVO: Switch Tecnología / Compras Nacionales ==========
const modoTecno = document.getElementById('modoTecnologia');
const modoCompras = document.getElementById('modoCompras');
const incidenciasDiv = document.getElementById('incidenciasContainer');
const requerimientosDiv = document.getElementById('requerimientosContainer');

// Función para cambiar de modo
function cambiarModo(modo) {
    if (modo === 'tecnologia') {
        incidenciasDiv.classList.remove('hidden');
        requerimientosDiv.classList.add('hidden');
        modoTecno.classList.add('bg-blue-500', 'text-white', 'shadow-sm');
        modoTecno.classList.remove('text-gray-600', 'hover:text-gray-800');
        modoCompras.classList.remove('bg-blue-500', 'text-white', 'shadow-sm');
        modoCompras.classList.add('text-gray-600', 'hover:text-gray-800');
        
        // Limpiar selección de requerimientos
        document.querySelectorAll('.requerimiento-btn').forEach(btn => {
            btn.classList.remove('selected', 'border-blue-400');
        });
        // Si no hay ninguna incidencia seleccionada, resetear preview
        if (!document.querySelector('.incident-btn.selected')) {
            document.getElementById('preview-incidence').textContent = 'Incidencia';
            document.getElementById('incidencia').value = '';
        } else {
            // Si ya había una incidencia seleccionada, actualizar preview
            const selectedInc = document.querySelector('.incident-btn.selected');
            if (selectedInc) {
                const title = selectedInc.querySelector('h3').textContent;
                document.getElementById('preview-incidence').textContent = title;
                document.getElementById('incidencia').value = title;
            }
        }
    } 
    else if (modo === 'compras') {
        incidenciasDiv.classList.add('hidden');
        requerimientosDiv.classList.remove('hidden');
        modoCompras.classList.add('bg-blue-500', 'text-white', 'shadow-sm');
        modoCompras.classList.remove('text-gray-600', 'hover:text-gray-800');
        modoTecno.classList.remove('bg-blue-500', 'text-white', 'shadow-sm');
        modoTecno.classList.add('text-gray-600', 'hover:text-gray-800');
        
        // Limpiar selección de incidencias
        document.querySelectorAll('.incident-btn').forEach(btn => {
            btn.classList.remove('selected', 'border-blue-400');
        });
        // Si no hay ningún requerimiento seleccionado, resetear preview
        if (!document.querySelector('.requerimiento-btn.selected')) {
            document.getElementById('preview-incidence').textContent = 'Requerimiento';
            document.getElementById('incidencia').value = '';
        } else {
            const selectedReq = document.querySelector('.requerimiento-btn.selected');
            if (selectedReq) {
                const title = selectedReq.querySelector('h3').textContent;
                document.getElementById('preview-incidence').textContent = title;
                document.getElementById('incidencia').value = title;
            }
        }
    }
}

// Eventos para los botones del switch
// modoTecno.addEventListener('click', () => cambiarModo('tecnologia'));
// modoCompras.addEventListener('click', () => cambiarModo('compras'));

// Lógica para los nuevos botones de requerimientos (igual que las incidencias)
const requerimientoBtns = document.querySelectorAll('.requerimiento-btn');
requerimientoBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        // Quitar selección de otros requerimientos
        requerimientoBtns.forEach(b => b.classList.remove('selected', 'border-blue-400'));
        this.classList.add('selected', 'border-blue-400');
        
        const reqTitle = this.querySelector('h3').textContent;
        // Actualizar preview y hidden input
        document.getElementById('preview-incidence').textContent = reqTitle;
        document.getElementById('incidencia').value = reqTitle;
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

// ========== MODIFICAR función limpiar (para resetear el switch y contenedores) ==========
window.limpiar = function() {
    document.getElementById("ticketForm").reset();
    fotoSeleccionada = null;
    
    // Resetear botón de foto
    const btnFoto = document.getElementById('btn-foto');
    document.getElementById('foto-status').textContent = "Anexar Evidencia (Foto)";
    btnFoto.className = "w-full py-3 px-4 bg-white border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 group";
    
    // Resetear incidencias y requerimientos seleccionados
    document.querySelectorAll('.incident-btn').forEach(b => b.classList.remove('selected', 'border-blue-400'));
    document.querySelectorAll('.requerimiento-btn').forEach(b => b.classList.remove('selected', 'border-blue-400'));
    
    // Resetear el switch a modo Tecnología (por defecto)
    cambiarModo('tecnologia');
    
    // Resetear preview
    document.getElementById('preview-incidence').textContent = 'Incidencia';
    document.getElementById('preview-name').textContent = 'Prueba Usuario';
    document.getElementById('preview-department').textContent = 'Presidencia';
    document.getElementById('incidencia').value = '';
    
    // Opcional: resetear campos de texto manualmente (el .reset() ya lo hace, pero el preview se actualiza con eventos)
    document.getElementById('preview-name').textContent = document.getElementById('name').value || 'Prueba Usuario';
    document.getElementById('preview-department').textContent = document.getElementById('department').value || 'Presidencia';
};