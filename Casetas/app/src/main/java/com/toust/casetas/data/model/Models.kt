package com.toust.casetas.data.model

import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.PropertyName

data class Socio(
    @DocumentId val id: String = "",
    val uid: String = "",
    val email: String = "",
    val nombre: String = "",
    val telefono: String = "",
    val rol: String = "",
    val casetaId: String? = null,
    val nombreCaseta: String = "",
    val approved: Boolean = false,
    val cuotaAlDia: Boolean = true
) {
    val isAdmin: Boolean get() = isGlobalAdmin || rol == "Presidente" || rol == "Tesorero"
    val isGlobalAdmin: Boolean get() = rol.contains("Admin", ignoreCase = true) && rol.contains("Global", ignoreCase = true)
}

data class Caseta(
    @DocumentId val id: String = "",
    val nombre: String = "",
    val calle: String = "",
    val numero: String = "",
    val descripcion: String = "",
    val color: String = "",
    val clase: String = "Familiar",
    val imagen: String? = null,
    val mapX: Float? = null,
    val mapY: Float? = null,
    val latitudReal: Double? = null,
    val longitudReal: Double? = null
)

data class Cuota(
    @DocumentId val id: String = "",
    val concepto: String = "",
    val dineroBase: Any? = 0.0,
    val montoBase: Any? = 0.0, // Legacy support
    val dineroRecargo: Any? = 0.0,
    val montoRecargo: Any? = 0.0, // Legacy support
    val deadline: String = "",
    val asignados: Any? = null, // Can be "todos" or List<String>
    val pagos: Map<String, Pago>? = null,
    val creadoEn: String = ""
) {
    val d_dineroBase: Double get() = toSafeDouble(if (toSafeDouble(dineroBase) > 0) dineroBase else montoBase)
    val d_dineroRecargo: Double get() = toSafeDouble(if (toSafeDouble(dineroRecargo) > 0) dineroRecargo else montoRecargo)
    val monto: Double get() = d_dineroBase
}

data class Pago(
    val pagado: Boolean = false,
    val fechaPago: String = "",
    val montoCobrado: Any? = 0.0
) {
    val d_montoCobrado: Double get() = toSafeDouble(montoCobrado)
}

// Global helper for safe number parsing from Firestore
private fun toSafeDouble(value: Any?): Double {
    return when (value) {
        is Number -> value.toDouble()
        is String -> value.toDoubleOrNull() ?: 0.0
        else -> 0.0
    }
}

data class Movimiento(
    @DocumentId val id: String = "",
    val concepto: String = "",
    val dinero: Any? = 0.0,
    val tipo: String = "", // "ingreso" or "gasto"
    val categoria: String = "Otros",
    val registradoPor: String = "",
    val fecha: String = ""
) {
    val d_dinero: Double get() = toSafeDouble(dinero)
}

data class Notificacion(
    @DocumentId val id: String = "",
    val titulo: String = "",
    val mensaje: String = "",
    val contenido: String = "", // Legacy support
    val fecha: String = "",
    val targetType: String? = null, // "all", "role", "specific"
    val targetValue: Any? = null
) {
    val displayMensaje: String get() = if (mensaje.isNotBlank()) mensaje else contenido
}

data class Votacion(
    @DocumentId val id: String = "",
    val pregunta: String = "",
    val opciones: List<String> = emptyList(),
    val multipleChoice: Boolean = false,
    val fechaInicio: String = "",
    val fechaFin: String = "",
    val activa: Boolean = true,
    val resultados: Map<String, Int> = emptyMap(),
    val votos: Map<String, Any> = emptyMap(),
    val creadoEn: String = ""
) {
    val status: String get() {
        val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm", java.util.Locale.getDefault()).format(java.util.Date())
        return when {
            !activa -> "ELIMINADA"
            fechaInicio.isNotBlank() && now < fechaInicio -> "PROGRAMADA"
            fechaFin.isNotBlank() && now > fechaFin -> "CERRADA"
            else -> "ABIERTA"
        }
    }
}

data class EventItem(
    @DocumentId val id: String = "",
    val concepto: String = "",
    val articulo: String = "",
    val tipo: String = "",
    val cantidad: Any? = 0.0,
    val cantidadRecibida: Any? = 0.0,
    val precioUnidad: Any? = 0.0,
    val precio: Any? = 0.0,
    val proveedor: String = "",
    val targetSocioId: String = "",
    val targetSocioNombre: String = "",
    val responsablesIds: List<String> = emptyList(),
    val responsablesNombres: List<String> = emptyList(),
    val completada: Boolean = false,
    val fecha: String = "",
    val menu: String = "",
    val asistentes: Map<String, Any>? = null,
    val creadoPor: String = "",
    val productoId: String = "",
    val idProducto: String = "",
    val tarea: String = "",
    val importe: Any? = 0.0,
    val precioCubierto: Any? = 0.0
) {
    val d_cantidad: Double get() = toDouble(cantidad)
    val d_cantidadRecibida: Double get() = toDouble(cantidadRecibida)
    val d_precioUnidad: Double get() = toDouble(precioUnidad)
    val d_precio: Double get() = toDouble(if (toDouble(precio) > 0) precio else importe)
    val d_importe: Double get() = toDouble(importe)
    val d_precioCubierto: Double get() = toDouble(precioCubierto)

    val displayConcepto: String get() = when {
        tarea.isNotBlank() -> tarea
        concepto.isNotBlank() -> concepto
        articulo.isNotBlank() -> articulo
        else -> "Sin descripción"
    }

    private fun toDouble(value: Any?): Double {
        return when (value) {
            is Number -> value.toDouble()
            is String -> value.toDoubleOrNull() ?: 0.0
            else -> 0.0
        }
    }
}
data class LiveUser(
    val id: String = "",
    val name: String = "",
    val lat: Double = 0.0,
    val lng: Double = 0.0,
    val boothId: String? = null,
    val isOutside: Boolean = false,
    val lastUpdate: String = ""
)
