package com.toust.casetas.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.toust.casetas.data.model.*
import com.toust.casetas.data.repository.BoothRepository
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class CuotasViewModel(
    private val boothId: String,
    private val currentSocioId: String,
    private val repository: BoothRepository = BoothRepository()
) : ViewModel() {
    var activeTab by mutableIntStateOf(0) // 0: Mis Pagos, 1: Caja General
    
    var cuotas by mutableStateOf<List<Cuota>>(emptyList())
    var movimientos by mutableStateOf<List<Movimiento>>(emptyList())
    
    var totalFeesDebt by mutableStateOf(0.0)
    var currentBalance by mutableStateOf(0.0)
    
    init {
        viewModelScope.launch {
            combine(
                repository.observeCuotas(boothId),
                repository.observeMovimientos(boothId)
            ) { q, m ->
                Pair(q, m)
            }.collect { (q, m) ->
                cuotas = q
                movimientos = m
                calculateTotals(q, m)
            }
        }
    }

    private fun calculateTotals(q: List<Cuota>, m: List<Movimiento>) {
        // Calculate Global Balance
        currentBalance = m.fold(0.0) { acc, mov ->
            if (mov.tipo == "ingreso") acc + mov.d_dinero else acc - mov.d_dinero
        }

        // Calculate User specific debt
        val myPendingFees = q.filter { fee ->
            val isAssigned = fee.asignados == "todos" || 
                (fee.asignados is List<*> && (fee.asignados as List<*>).contains(currentSocioId))
            val isPaid = fee.pagos?.get(currentSocioId)?.pagado == true
            isAssigned && !isPaid
        }

        totalFeesDebt = myPendingFees.sumOf { fee ->
            val isLate = isDateExpired(fee.deadline)
            if (isLate) fee.d_dineroBase + fee.d_dineroRecargo else fee.d_dineroBase
        }
    }

    private fun isDateExpired(deadline: String): Boolean {
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val date = sdf.parse(deadline)
            date?.before(Date()) ?: false
        } catch (e: Exception) {
            false
        }
    }
}

