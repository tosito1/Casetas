package com.toust.casetas.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.toust.casetas.data.model.Socio
import com.toust.casetas.data.model.Cuota
import com.toust.casetas.data.model.EventItem
import com.toust.casetas.data.repository.BoothRepository
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

class SociosViewModel(
    private val boothId: String,
    private val repository: BoothRepository = BoothRepository()
) : ViewModel() {
    var socios by mutableStateOf<List<Socio>>(emptyList())
    var debts by mutableStateOf<Map<String, Double>>(emptyMap())
    var isLoading by mutableStateOf(true)

    init {
        viewModelScope.launch {
            combine(
                repository.observeSocios(boothId),
                repository.observeCuotas(boothId),
                repository.observeEventData(boothId, "feria", "consumos")
            ) { members: List<Socio>, fees: List<Cuota>, consumptions: List<EventItem> ->
                members to (fees to consumptions)
            }.collect { (members, pair) ->
                val (fees, consumptions) = pair
                socios = members.sortedBy { s -> !s.approved }
                
                val newDebts = mutableMapOf<String, Double>()
                members.forEach { socio ->
                    var totalDebt = 0.0
                    
                    // 1. Pending Fees
                    fees.forEach { cuota ->
                        val userPago = cuota.pagos?.get(socio.uid)
                        if (userPago == null || !userPago.pagado) {
                            totalDebt += cuota.monto
                        }
                    }
                    
                    // 2. Consumptions
                    consumptions.forEach { item ->
                        if (item.targetSocioId == socio.uid) {
                            totalDebt += item.d_precio
                        }
                    }
                    
                    newDebts[socio.uid] = totalDebt
                }
                debts = newDebts
                isLoading = false
            }
        }
    }

    fun approveSocio(socioId: String) {
        viewModelScope.launch {
            repository.updateSocio(socioId, mapOf("approved" to true))
        }
    }

    fun toggleSolvency(socioId: String, isSolvent: Boolean) {
        viewModelScope.launch {
            repository.updateSocio(socioId, mapOf("cuotaAlDia" to isSolvent))
        }
    }

    fun removeSocio(socioId: String) {
        viewModelScope.launch {
            val updates = mutableMapOf<String, Any?>(
                "casetaId" to null,
                "approved" to false,
                "rol" to "Socio",
                "nombreCaseta" to ""
            )
            repository.updateSocio(socioId, updates as Map<String, Any>)
        }
    }
}
