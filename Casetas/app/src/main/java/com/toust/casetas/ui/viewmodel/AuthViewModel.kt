package com.toust.casetas.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.AuthCredential
import com.toust.casetas.data.repository.AuthRepository
import kotlinx.coroutines.launch

class AuthViewModel(
    private val repository: AuthRepository = AuthRepository()
) : ViewModel() {
    var email by mutableStateOf("")
    var password by mutableStateOf("")
    var isLoading by mutableStateOf(false)
    var errorMessage by mutableStateOf<String?>(null)

    fun loginWithCredential(credential: AuthCredential, onSuccess: () -> Unit) {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            repository.signInWithCredential(credential)
                .onSuccess {
                    repository.syncUserProfile()
                    onSuccess()
                }
                .onFailure {
                    errorMessage = it.localizedMessage ?: "Error de login externo"
                }
            isLoading = false
        }
    }

    fun login(onSuccess: () -> Unit) {
        if (email.isBlank() || password.isBlank()) {
            errorMessage = "Complete todos los campos"
            return
        }

        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            repository.signIn(email, password)
                .onSuccess {
                    repository.syncUserProfile()
                    onSuccess()
                }
                .onFailure {
                    errorMessage = it.localizedMessage ?: "Error de login"
                }
            isLoading = false
        }
    }
}
