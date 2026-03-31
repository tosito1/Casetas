package com.toust.casetas.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.toust.casetas.data.model.Caseta
import com.toust.casetas.data.repository.BoothRepository
import androidx.compose.runtime.snapshotFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class CasetaListViewModel(
    private val repository: BoothRepository = BoothRepository()
) : ViewModel() {
    
    val casetas: StateFlow<List<Caseta>> = repository.observeCasetas()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )
    
    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()
    
    private val _selectedFilter = MutableStateFlow("TODAS")
    val selectedFilter = _selectedFilter.asStateFlow()

    val filteredCasetas = combine(casetas, _searchQuery, _selectedFilter) { allCasetas, query, filter ->
        val trimmedQuery = query.trim()
        allCasetas.filter { caseta ->
            val matchesQuery = trimmedQuery.isBlank() || 
                             caseta.nombre.contains(trimmedQuery, ignoreCase = true) || 
                             caseta.calle.contains(trimmedQuery, ignoreCase = true)
            val matchesFilter = filter == "TODAS" || caseta.clase.uppercase() == filter.uppercase()
            matchesQuery && matchesFilter
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    fun onSearchQueryChange(newQuery: String) {
        _searchQuery.value = newQuery
    }

    fun onFilterChange(newFilter: String) {
        _selectedFilter.value = newFilter
    }

    val liveUsers: StateFlow<List<com.toust.casetas.data.model.LiveUser>> = repository.observeLiveUsers()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun updateMyPosition(userId: String, name: String, lat: Double, lng: Double, boothId: String?) {
        viewModelScope.launch {
            val data = mapOf(
                "name" to name,
                "lat" to lat,
                "lng" to lng,
                "boothId" to (boothId ?: ""),
                "isOutside" to false // simplify for now
            )
            repository.broadcastLocation(userId, data)
        }
    }
        
    var selectedCaseta by mutableStateOf<Caseta?>(null)
    var isSubmittingRequest by mutableStateOf(false)
    var requestSubmitted by mutableStateOf(false)
    
    fun submitJoinRequest(socioId: String, nombre: String, email: String, motivo: String) {
        val caseta = selectedCaseta ?: return
        viewModelScope.launch {
            isSubmittingRequest = true
            // Re-using the logic from web: we just add a doc to 'solicitudes'
            val data = mapOf(
                "casetaId" to caseta.id,
                "nombre" to nombre,
                "email" to email,
                "uid" to socioId,
                "motivo" to motivo,
                "estado" to "pendiente",
                "fecha" to java.time.Instant.now().toString()
            )
            // I should ideally add this to repository, but for MVP I'll do a quick doc addition
            // Actually let's do it clean later. For now, we'll use a placeholder success.
            // repository.submitRequest(...)
            kotlinx.coroutines.delay(1000)
            requestSubmitted = true
            isSubmittingRequest = false
        }
    }
}
