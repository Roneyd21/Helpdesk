document.addEventListener('DOMContentLoaded', () => {
    cargarMetricasIniciales();
    cargarTop5Tecnicos();
    cargarTopsAdicionales();
});

// Helper para crear el círculo con iniciales (AM, CL, etc.)
const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

// 1. Bloque: Métricas del encabezado (/get-ini)
async function cargarMetricasIniciales() {
    try {
        const res = await fetch('/get-ini');
        const data = await res.json();
        
        document.getElementById('stat-total-tickets').textContent = data.tk_mes;
        document.getElementById('stat-total-tickets-inline').textContent = data.tk_mes;
        
        if (data.tecnico_top_mes) {
            const top = data.tecnico_top_mes;
            document.querySelector('.bg-success + .card-info h3').textContent = top.tecnico;
            document.querySelector('.bg-success + .card-info small').textContent = `${top.cantidad_tickets} tickets resueltos`;
        }

        if (data.tiempo_promedio_top) {
            const tiempo = data.tiempo_promedio_top;
            document.querySelector('.bg-warning + .card-info h3').textContent = `${Math.round(tiempo.mejor_tiempo_minutos)} min`;
            document.querySelector('.bg-warning + .card-info small').textContent = `${tiempo.nombre_tecnico} (promedio)`;
        }

        // Reemplaza esa línea dentro de cargarMetricasIniciales():
        if (data.tecnico_top_mes && data.tk_mes > 0) {
            const tasaCalculada = ((data.tecnico_top_mes.cantidad_tickets / data.tk_mes) * 100).toFixed(1);
            document.querySelector('.bg-purple + .card-info h3').textContent = `${tasaCalculada} min`;
            document.querySelector('.bg-purple + .card-info small').textContent = "Tiempo promedio del equipo";
        }
    } catch (error) {
        console.error("Error en get-ini:", error);
    }
}

// 2. Bloque: Tabla Principal y Gráfico (/top5-tecnicos)
async function cargarTop5Tecnicos() {
    try {
        const res = await fetch('/top5-tecnicos');
        const data = await res.json();
        const lista = data.top_5_tecnicos;
        
        const tbody = document.getElementById('tabla-top-tecnicos');
        tbody.innerHTML = '';

        const medallas = ['🥇', '🥈', '🥉', '4', '5'];
        
        lista.forEach((tec, index) => {
            const row = `
                <tr>
                    <td style="font-weight: bold;">${medallas[index] || index + 1}</td>
                    <td>
                        <div style="display: flex; align-items: center;">
                            <div class="avatar-symbol">${getInitials(tec.nombre_tecnico)}</div>
                            <strong>${tec.nombre_tecnico}</strong>
                        </div>
                    </td>
                    <td><span class="badge-efficient" style="background:#dbeafe; color:#1e3a8a;">${tec.tickets_tecnico} tickets</span></td>
                    <td>${Math.round(tec.promedio_minutos)} min</td>
                    <td><span class="status-badge-ok">${tec.promedio_minutos < 70 ? '⚡ Alto rend.' : 'Estable'}</span></td>
                    <td>${tec.porcentaje_del_mes}%</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        // Actualizar el Gráfico con estos mismos datos
        actualizarGrafico(lista);

    } catch (error) {
        console.error("Error en top5-tecnicos:", error);
    }
}

// 3. Bloque: Incidencias, Departamentos y Usuarios (/tops5)
async function cargarTopsAdicionales() {
    try {
        // Obtenemos primero el total general para los cálculos de porcentaje
        const resIni = await fetch('/get-ini');
        const dataIni = await resIni.json();
        const totalMensual = dataIni.tk_mes || 1; // Evitar división por cero

        const resTops = await fetch('/tops5');
        const data = await resTops.json();

        // --- 1. LÓGICA DE INCIDENCIAS (Top 2 concentran el X%) ---
        const listaInci = document.getElementById('lista-incidencias');
        listaInci.innerHTML = '';
        if (data.top5_incidencias.length >= 2) {
            const top2Sum = data.top5_incidencias[0].tickets + data.top5_incidencias[1].tickets;
            const porcentajeInci = ((top2Sum / totalMensual) * 100).toFixed(0);
            
            document.getElementById('resumen-incidencias').innerHTML = 
                `<i class="fas fa-chart-simple"></i> El ${porcentajeInci}% de los tickets se concentra en ${data.top5_incidencias[0].incidencia} y ${data.top5_incidencias[1].incidencia}.`;
        }

        data.top5_incidencias.forEach((item, i) => {
            listaInci.innerHTML += `<li><span class="list-item-rank">${i+1}</span> <span class="list-item-name">${item.incidencia}</span><span class="list-item-value">${item.tickets} tickets</span></li>`;
        });


        // --- 2. LÓGICA DE DEPARTAMENTOS (El primero genera el X%) ---
        const listaDep = document.getElementById('lista-departamentos');
        listaDep.innerHTML = '';
        if (data.top5_departamentos.length > 0) {
            const topDep = data.top5_departamentos[0];
            const porcentajeDep = ((topDep.tickets / totalMensual) * 100).toFixed(0);
            
            document.getElementById('resumen-departamento').textContent = 
                `${topDep.departamento} genera el ${porcentajeDep}% del total de tickets mensuales.`;
        }

        data.top5_departamentos.forEach((item, i) => {
            listaDep.innerHTML += `<li><span class="list-item-rank">${i+1}</span> <span class="list-item-name">${item.departamento}</span><span class="list-item-value">${item.tickets} tickets</span></li>`;
        });


        // --- 3. LÓGICA DE USUARIOS Y RECOMENDACIÓN ---
        const contenedorWorkload = document.getElementById('contenedor-workload');
        contenedorWorkload.innerHTML = '';
        
        // Ordenamos los usuarios por menor carga para la recomendación
        const usuariosOrdenados = [...data.top5_usuarios].sort((a, b) => a.tickets - b.tickets);
        
        if (usuariosOrdenados.length >= 2) {
            document.getElementById('recomendacion-carga').innerHTML = 
                `Priorizar asignaciones a <strong>${usuariosOrdenados[0].nombre}</strong> o <strong>${usuariosOrdenados[1].nombre}</strong> por la gran Cantidad de Tickets.`;
        }

        data.top5_usuarios.forEach(user => {
            const perc = user.porcentaje || 0;
            const anchoVisual = Math.max(perc, 15);
            let color = '#10b981';
            let status = 'Disponible';
            if(perc > 80) { color = '#ef4444'; status = 'Crítica'; }
            else if(perc > 50) { color = '#f59e0b'; status = 'Media'; }

            contenedorWorkload.innerHTML += `
                <div class="workload-item">
                    <div class="flex-between mb-1">
                        <span style="font-weight: 600;">${user.nombre}</span>
                        <span class="status-badge-ok" style="background: ${color}22; color: ${color}; border: none;">${status}</span>
                    </div>
                    <div class="tech-progress"><div class="progress-fill" style="width: ${anchoVisual}%; background: ${color};"></div></div>
                    <div class="flex-between mt-2">
                        <span class="text-small"><strong>${user.tickets}</strong> tickets creados</span>
                        <span class="text-small" style="font-weight: bold;">${perc}% Capacidad</span>
                    </div>
                </div>`;
        });

    } catch (error) {
        console.error("Error cargando tops adicionales:", error);
    }
}

// 5. Función para el Gráfico Polar Area
function actualizarGrafico(lista) {
    const ctx = document.getElementById('ticketsPorTecnicoPolarChart').getContext('2d');
    
    // Destruir gráfico previo si existe para evitar duplicados
    if (window.miGrafico) { window.miGrafico.destroy(); }

    window.miGrafico = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: lista.map(t => t.nombre_tecnico),
            datasets: [{
                data: lista.map(t => t.tickets_tecnico),
                backgroundColor: ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 15, weight: '600' },
                        boxWidth: 15,
                        padding: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const porcentaje = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} tickets (${porcentaje}%)`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10,
                        backdropColor: 'transparent',
                        font: { size: 9 }
                    },
                    grid: { color: '#e2e8f0' },
                    angleLines: { color: '#e2e8f0' }
                }
            },
            layout: {
                padding: { top: 0, bottom: 0, left: 0, right: 0 }
            }
        }
    });
}

// Fecha...
function actualizarFecha() {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const fecha = new Date();
    const mesActual = meses[fecha.getMonth()];
    const anioActual = fecha.getFullYear();
    
    document.getElementById('fecha-actual').innerHTML = 
        `<i class="fas fa-calendar-alt"></i> ${mesActual} ${anioActual} (datos acumulados)`;
}

// Llama a la función al cargar la página
actualizarFecha();