package com.toust.casetas.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.toust.casetas.data.model.Votacion
import com.toust.casetas.data.repository.BoothRepository
import kotlinx.coroutines.launch

class VotacionesViewModel(
    private val boothId: String,
    private val socioId: String,
    private val repository: BoothRepository = BoothRepository()
) : ViewModel() {
    var polls by mutableStateOf<List<Votacion>>(emptyList())
    var isLoading by mutableStateOf(true)

    init {
        viewModelScope.launch {
            repository.observeVotaciones(boothId).collect {
                polls = it
                isLoading = false
            }
        }
    }

    fun castVote(pollId: String, selectedOptions: List<String>) {
        viewModelScope.launch {
            val poll = polls.find { it.id == pollId } ?: return@launch
            val currentVote = poll.votos[socioId]
            val updatedResults = poll.resultados.toMutableMap()

            // 1. Subtract previous vote if exists
            if (currentVote != null) {
                val previousSelections = if (currentVote is List<*>) currentVote as List<String> else listOf(currentVote.toString())
                previousSelections.forEach { opt ->
                    updatedResults[opt] = (updatedResults[opt] ?: 1) - 1
                }
            }

            // 2. Add new vote
            selectedOptions.forEach { opt ->
                updatedResults[opt] = (updatedResults[opt] ?: 0) + 1
            }

            repository.castVote(boothId, pollId, socioId, selectedOptions, updatedResults)
        }
    }

    fun deletePoll(pollId: String) {
        viewModelScope.launch {
            repository.deleteEventItem(boothId, "", "votaciones", pollId)
        }
    }

    fun createPoll(pregunta: String, opciones: List<String>, isMultiple: Boolean) {
        viewModelScope.launch {
            val results = opciones.associateWith { 0 }
            val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm", java.util.Locale.getDefault()).format(java.util.Date())
            val weekAfter = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm", java.util.Locale.getDefault()).format(java.util.Date(System.currentTimeMillis() + 7 * 24 * 60 * 60 * 1000))
            
            val data = mapOf(
                "pregunta" to pregunta,
                "opciones" to opciones,
                "multipleChoice" to isMultiple,
                "activa" to true,
                "resultados" to results,
                "votos" to emptyMap<String, Any>(),
                "fechaInicio" to now,
                "fechaFin" to weekAfter
            )
            repository.addPoll(boothId, data)
        }
    }
}
