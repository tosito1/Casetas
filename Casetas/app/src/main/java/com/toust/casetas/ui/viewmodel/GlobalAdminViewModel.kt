package com.toust.casetas.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.toust.casetas.data.model.Caseta
import com.toust.casetas.data.model.Socio
import com.toust.casetas.data.repository.BoothRepository
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class GlobalAdminViewModel(
    private val repository: BoothRepository = BoothRepository()
) : ViewModel() {
    var casetas by mutableStateOf<List<Caseta>>(emptyList())
    var allSocios by mutableStateOf<List<Socio>>(emptyList())
    var isLoading by mutableStateOf(true)

    init {
        viewModelScope.launch {
            repository.observeCasetas().collectLatest {
                casetas = it
                checkLoading()
            }
        }
        viewModelScope.launch {
            repository.observeAllSocios().collectLatest {
                allSocios = it
                checkLoading()
            }
        }
    }

    private fun checkLoading() {
        if (casetas.isNotEmpty() || allSocios.isNotEmpty()) {
            isLoading = false
        }
    }

    fun deleteBooth(id: String) {
        viewModelScope.launch {
            repository.deleteCaseta(id)
        }
    }

    fun saveBooth(id: String?, name: String, street: String, number: String) {
        viewModelScope.launch {
            repository.saveCaseta(id, mapOf(
                "nombre" to name,
                "calle" to street,
                "numero" to number
            ))
        }
    }
}
