package com.toust.casetas.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.toust.casetas.data.model.Notificacion
import com.toust.casetas.data.repository.BoothRepository
import kotlinx.coroutines.launch

class NotificacionesViewModel(
    private val boothId: String,
    private val repository: BoothRepository = BoothRepository()
) : ViewModel() {
    var notifications by mutableStateOf<List<Notificacion>>(emptyList())
    var isLoading by mutableStateOf(true)

    init {
        viewModelScope.launch {
            repository.observeNotificaciones(boothId).collect {
                notifications = it.sortedByDescending { n -> n.fecha }
                isLoading = false
            }
        }
    }
}
