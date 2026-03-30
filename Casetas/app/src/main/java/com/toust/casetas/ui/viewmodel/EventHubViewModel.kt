package com.toust.casetas.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.toust.casetas.data.model.EventItem
import com.toust.casetas.data.repository.BoothRepository
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

class EventHubViewModel(
    private val boothId: String,
    private val eventId: String, // "feria" or "sanjuan"
    val currentSocioId: String,
    private val repository: BoothRepository = BoothRepository()
) : ViewModel() {
    var activeTab by mutableStateOf("consumos")
    var albaranes by mutableStateOf<List<EventItem>>(emptyList())
    var consumos by mutableStateOf<List<EventItem>>(emptyList())
    var gastos by mutableStateOf<List<EventItem>>(emptyList())
    var comidas by mutableStateOf<List<EventItem>>(emptyList())
    var tareas by mutableStateOf<List<EventItem>>(emptyList())
    
    var personalDebt by mutableStateOf(0.0)
    var isLoading by mutableStateOf(true)
    var stockMap by mutableStateOf<Map<String, Int>>(emptyMap())

    init {
        viewModelScope.launch {
            combine(
                repository.observeEventItems(boothId, eventId, "albaran"),
                repository.observeEventItems(boothId, eventId, "consumos"),
                repository.observeEventItems(boothId, eventId, "gastos"),
                repository.observeEventItems(boothId, eventId, "comidas"),
                repository.observeEventItems(boothId, eventId, "tareas")
            ) { a, c, g, com, t ->
                DataState(a, c, g, com, t)
            }.collect { state ->
                albaranes = state.albaran
                consumos = state.consumos
                gastos = state.gastos
                comidas = state.comidas
                tareas = state.tareas
                
                // Calculate stock: Sum(Albaranes) - Sum(Consumos) grouped by product/article
                // Web logic: albaranes contain 'cantidadRecibida', consumos contain 'cantidad'
                val calculatedStock = mutableMapOf<String, Int>()
                
                state.albaran.filter { it.articulo.isNotBlank() }.forEach { 
                    val key = it.articulo
                    val current = calculatedStock.getOrDefault(key, 0)
                    calculatedStock[key] = current + it.d_cantidadRecibida.toInt()
                }
                
                state.consumos.forEach { consumo ->
                    val key = if (consumo.articulo.isNotBlank()) {
                        consumo.articulo
                    } else {
                        // Fallback: look up article name from albaranes list if articulo was blank
                        state.albaran.find { it.id == consumo.productoId }?.articulo ?: ""
                    }
                    
                    if (key.isNotBlank()) {
                        val current = calculatedStock.getOrDefault(key, 0)
                        calculatedStock[key] = current - consumo.d_cantidad.toInt()
                    }
                }
                
                stockMap = calculatedStock.filter { it.value != 0 || state.albaran.any { a -> a.articulo == it.key } }

                // Calculate personal debt for this specific event
                personalDebt = state.consumos
                    .filter { it.targetSocioId == currentSocioId }
                    .sumOf { it.d_precio }
                
                isLoading = false
            }
        }
    }

    private data class DataState(
        val albaran: List<EventItem>,
        val consumos: List<EventItem>,
        val gastos: List<EventItem>,
        val comidas: List<EventItem>,
        val tareas: List<EventItem>
    )

    fun addConsumoRapido(product: EventItem, socioNombre: String) {
        viewModelScope.launch {
            val data = mapOf(
                "targetSocioId" to currentSocioId,
                "targetSocioNombre" to socioNombre,
                "productoId" to product.id,
                "articulo" to product.articulo,
                "concepto" to product.articulo,
                "tipo" to product.tipo,
                "precioUnidad" to product.d_precioUnidad,
                "cantidad" to 1.0,
                "precio" to product.d_precioUnidad,
                "creadoPor" to "App Autoservicio",
                "fecha" to java.time.Instant.now().toString()
            )
            repository.addEventItem(boothId, eventId, "consumos", data)
        }
    }

    fun toggleTarea(tarea: EventItem) {
        viewModelScope.launch {
            repository.updateEventItem(boothId, eventId, "tareas", tarea.id, mapOf("completada" to !tarea.completada))
        }
    }

    fun updateComidaGuests(comida: EventItem, delta: Int) {
        viewModelScope.launch {
            val asistentes = (comida.asistentes ?: emptyMap()).toMutableMap()
            val myInfo = asistentes[currentSocioId] as? Map<String, Any> ?: return@launch
            val currentGuests = (myInfo["invitados"] as? Number)?.toInt() ?: 0
            val newGuests = (currentGuests + delta).coerceAtLeast(0)
            
            val updatedInfo = myInfo.toMutableMap()
            updatedInfo["invitados"] = newGuests
            asistentes[currentSocioId] = updatedInfo
            
            repository.updateEventItem(boothId, eventId, "comidas", comida.id, mapOf("asistentes" to asistentes))
        }
    }

    fun toggleComidaAttendance(comida: EventItem, socioNombre: String) {
        viewModelScope.launch {
            val updatedAsistentes = (comida.asistentes ?: emptyMap()).toMutableMap()
            if (updatedAsistentes.containsKey(currentSocioId)) {
                updatedAsistentes.remove(currentSocioId)
            } else {
                updatedAsistentes[currentSocioId] = mapOf("nombre" to socioNombre, "invitados" to 0)
            }
            repository.updateEventItem(boothId, eventId, "comidas", comida.id, mapOf("asistentes" to updatedAsistentes))
        }
    }

    fun deleteItem(subType: String, itemId: String) {
        viewModelScope.launch {
            repository.deleteEventItem(boothId, eventId, subType, itemId)
        }
    }

    fun addAdminItem(subType: String, data: Map<String, Any>) {
        viewModelScope.launch {
            repository.addEventItem(boothId, eventId, subType, data)
        }
    }
}
