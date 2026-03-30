package com.toust.casetas.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.AuthCredential
import com.google.firebase.firestore.FirebaseFirestore
import com.toust.casetas.data.model.Socio
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.callbackFlow

class AuthRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    val currentUserUID: String? get() = auth.currentUser?.uid

    suspend fun signIn(email: String, pass: String): Result<Unit> {
        return try {
            auth.signInWithEmailAndPassword(email, pass).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signInWithCredential(credential: AuthCredential): Result<Unit> {
        return try {
            auth.signInWithCredential(credential).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun signOut() {
        auth.signOut()
    }

    suspend fun syncUserProfile(): Result<Socio> {
        val user = auth.currentUser ?: return Result.failure(Exception("Not logged in"))
        val docRef = db.collection("socios").document(user.uid)
        
        return try {
            val snapshot = docRef.get().await()
            if (snapshot.exists()) {
                val socio = snapshot.toObject(Socio::class.java)!!
                Result.success(socio)
            } else {
                // Initialize default profile
                val isAdmin = user.email == "admin@feria.com"
                val initialProfile = Socio(
                    uid = user.uid,
                    email = user.email ?: "",
                    nombre = if (isAdmin) "Admin Feria" else "Usuario Nuevo",
                    rol = if (isAdmin) "Administrador Global" else "Socio de Caseta",
                    approved = isAdmin,
                    cuotaAlDia = true
                )
                docRef.set(initialProfile).await()
                Result.success(initialProfile)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun observeProfile(): Flow<Socio?> = callbackFlow {
        val uid = auth.currentUser?.uid ?: return@callbackFlow
        val profileListener = db.collection("socios").document(uid)
            .addSnapshotListener { snapshot, _ ->
                val socio = snapshot?.toObject(Socio::class.java)
                if (socio != null && socio.casetaId?.isNotBlank() == true && socio.nombreCaseta.isBlank()) {
                    // Try to resolve booth name if missing
                    db.collection("casetas").document(socio.casetaId)
                        .get()
                        .addOnSuccessListener { boothSnap ->
                            val boothName = boothSnap.getString("nombre") ?: "Sin nombre"
                            trySend(socio.copy(nombreCaseta = boothName))
                        }
                        .addOnFailureListener {
                            trySend(socio)
                        }
                } else {
                    trySend(socio)
                }
            }
        awaitClose { profileListener.remove() }
    }
}
