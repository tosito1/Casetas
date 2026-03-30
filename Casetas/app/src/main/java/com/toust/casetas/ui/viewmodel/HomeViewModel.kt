package com.toust.casetas.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.toust.casetas.data.model.*
import com.toust.casetas.data.repository.BoothRepository
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class HomeViewModel(
    private val boothId: String,
    private val currentSocioId: String,
    private val repository: BoothRepository = BoothRepository()
) : ViewModel() {
    var latestNotif by mutableStateOf<Notificacion?>(null)
    var activePoll by mutableStateOf<Votacion?>(null)
    var pendingFeesCount by mutableStateOf(0)
    var isLoading by mutableStateOf(true)

    init {
        viewModelScope.launch {
            combine(
                repository.observeNotificaciones(boothId),
                repository.observeCuotas(boothId)
                // Note: observeVotaciones would be added here too once implemented in repository
            ) { notifs, cuotas ->
                Triple(notifs, cuotas, null) // Null for polls for now
            }.collect { (notifs, cuotas, _) ->
                latestNotif = notifs.maxByOrNull { it.fecha }
                
                pendingFeesCount = cuotas.count { fee ->
                    val isAssigned = fee.asignados == "todos" || 
                        (fee.asignados is List<*> && fee.asignados.contains(currentSocioId))
                    val isPaid = fee.pagos?.get(currentSocioId)?.pagado == true
                    isAssigned && !isPaid
                }
                
                isLoading = false
            }
        }
    }
    
    fun manualCheckIn(userName: String) {
        viewModelScope.launch {
            val data = mapOf(
                "name" to userName,
                "isOutside" to false,
                "boothId" to boothId,
                "manualCheckIn" to true
            )
            repository.broadcastLocation(currentSocioId, data)
        }
    }
}
