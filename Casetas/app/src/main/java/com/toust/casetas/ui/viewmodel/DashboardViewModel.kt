package com.toust.casetas.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.toust.casetas.data.model.Socio
import com.toust.casetas.data.repository.AuthRepository
import com.toust.casetas.data.repository.BoothRepository
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

import androidx.lifecycle.AndroidViewModel
import com.toust.casetas.util.LocationTracker

class DashboardViewModel(
    application: android.app.Application
) : AndroidViewModel(application) {
    private val authRepository: AuthRepository = AuthRepository()
    private val boothRepository: BoothRepository = BoothRepository()
    private val locationTracker = LocationTracker(application)

    var selectedTab by mutableIntStateOf(0)
    var socio by mutableStateOf<Socio?>(null)
    var showMap by mutableStateOf(false)
    var isTracking by mutableStateOf(true)

    init {
        viewModelScope.launch {
            authRepository.observeProfile().collect { profile ->
                socio = profile
                
                FirebaseMessaging.getInstance().subscribeToTopic("all")
                profile?.casetaId?.let { 
                    if (it.isNotBlank()) FirebaseMessaging.getInstance().subscribeToTopic(it)
                }
            }
        }

        // --- REAL-TIME GPS TRACKING ---
        viewModelScope.launch {
            locationTracker.getLocationUpdates().collect { loc ->
                val currentSocio = socio ?: return@collect
                if (!isTracking) return@collect
                
                // BroadCast to Radar (RTDB)
                val data = mapOf(
                    "name" to currentSocio.nombre,
                    "lat" to loc.latitude,
                    "lng" to loc.longitude,
                    "boothId" to (currentSocio.casetaId ?: ""),
                    "isOutside" to false // simplify: checking bounds can be done later
                )
                boothRepository.broadcastLocation(currentSocio.uid, data)
            }
        }
    }

    fun logout(onFinished: () -> Unit) {
        authRepository.signOut()
        onFinished()
    }
}
