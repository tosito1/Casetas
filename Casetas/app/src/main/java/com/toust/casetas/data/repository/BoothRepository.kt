package com.toust.casetas.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.toust.casetas.data.model.*
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.tasks.await

class BoothRepository(
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val rtdb: com.google.firebase.database.FirebaseDatabase = com.google.firebase.database.FirebaseDatabase.getInstance()
) {
    // --- REALTIME RADAR (RTDB) ---
    fun observeLiveUsers(): Flow<List<LiveUser>> = callbackFlow {
        val ref = rtdb.getReference("locations")
        val listener = object : com.google.firebase.database.ValueEventListener {
            override fun onDataChange(snapshot: com.google.firebase.database.DataSnapshot) {
                val list = mutableListOf<LiveUser>()
                snapshot.children.forEach { child ->
                    val user = child.getValue(LiveUser::class.java)?.copy(id = child.key ?: "")
                    if (user != null) list.add(user)
                }
                trySend(list)
            }
            override fun onCancelled(error: com.google.firebase.database.DatabaseError) {}
        }
        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }

    suspend fun broadcastLocation(userId: String, data: Map<String, Any>) {
        if (userId.isBlank()) return
        val ref = rtdb.getReference("locations").child(userId)
        ref.setValue(data + ("lastUpdate" to java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date()))).await()
        ref.onDisconnect().removeValue()
    }
    // Fetch all booths
    fun observeCasetas(): Flow<List<Caseta>> = callbackFlow {
        val listener = db.collection("casetas").addSnapshotListener { snap, _ ->
            val list = snap?.toObjectList<Caseta>() ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }

    // Observe specific booth data (Cuotas, Movimientos, etc.)
    fun observeMovimientos(boothId: String): Flow<List<Movimiento>> {
        if (boothId.isBlank()) return flowOf(emptyList())
        return callbackFlow {
            val listener = db.collection("casetas").document(boothId).collection("movimientos")
                .orderBy("fecha", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .addSnapshotListener { snap, _ ->
                    trySend(snap?.toObjectList<Movimiento>() ?: emptyList())
                }
            awaitClose { listener.remove() }
        }
    }

    fun observeEventData(boothId: String, eventId: String, subType: String): Flow<List<EventItem>> {
        if (boothId.isBlank() || eventId.isBlank()) return flowOf(emptyList())
        return callbackFlow {
            val listener = db.collection("casetas").document(boothId).collection("eventos").document(eventId).collection(subType)
                .addSnapshotListener { snap, _ ->
                    trySend(snap?.toObjectList<EventItem>() ?: emptyList())
                }
            awaitClose { listener.remove() }
        }
    }

    fun observeNotificaciones(boothId: String): Flow<List<Notificacion>> {
        if (boothId.isBlank()) return flowOf(emptyList())
        return callbackFlow {
            val listener = db.collection("casetas").document(boothId).collection("notificaciones")
                .orderBy("fecha")
                .addSnapshotListener { snap, _ ->
                    trySend(snap?.toObjectList<Notificacion>() ?: emptyList())
                }
            awaitClose { listener.remove() }
        }
    }

    // --- EVENT HUB METHODS ---
    fun observeEventItems(boothId: String, eventId: String, subType: String): Flow<List<EventItem>> {
        if (boothId.isBlank()) return flowOf(emptyList())
        return callbackFlow {
            val listener = db.collection("casetas").document(boothId).collection("eventos").document(eventId).collection(subType)
                .addSnapshotListener { snap, _ ->
                    trySend(snap?.toObjectList<EventItem>() ?: emptyList())
                }
            awaitClose { listener.remove() }
        }
    }

    suspend fun addEventItem(boothId: String, eventId: String, subType: String, data: Map<String, Any>): Result<String> {
        return try {
            val docRef = db.collection("casetas").document(boothId)
                .collection("eventos").document(eventId)
                .collection(subType).add(data).await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun observeVotaciones(boothId: String): Flow<List<Votacion>> {
        if (boothId.isBlank()) return flowOf(emptyList())
        return callbackFlow {
            val listener = db.collection("casetas").document(boothId).collection("votaciones")
                .addSnapshotListener { snap, _ ->
                    trySend(snap?.toObjectList<Votacion>() ?: emptyList())
                }
            awaitClose { listener.remove() }
        }
    }

    suspend fun updateEventItem(boothId: String, eventId: String, subType: String, itemId: String, data: Map<String, Any>): Result<Unit> {
        return try {
            db.collection("casetas").document(boothId)
                .collection("eventos").document(eventId)
                .collection(subType).document(itemId).set(data, com.google.firebase.firestore.SetOptions.merge()).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // --- SOCIOS METHODS ---
    fun observeSocios(boothId: String): Flow<List<Socio>> {
        return callbackFlow {
            val listener = db.collection("socios")
                .whereEqualTo("casetaId", boothId)
                .addSnapshotListener { snap, _ ->
                    trySend(snap?.toObjectList<Socio>() ?: emptyList())
                }
            awaitClose { listener.remove() }
        }
    }

    fun observeCuotas(boothId: String): Flow<List<Cuota>> {
        return callbackFlow {
            val listener = db.collection("casetas").document(boothId)
                .collection("cuotas")
                .addSnapshotListener { snap, _ ->
                    val data = snap?.toObjectList<Cuota>() ?: emptyList()
                    trySend(data)
                }
            awaitClose { listener.remove() }
        }
    }

    suspend fun updateSocio(socioId: String, data: Map<String, Any>): Result<Unit> {
        return try {
            db.collection("socios").document(socioId).update(data).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteEventItem(boothId: String, eventId: String, subType: String, itemId: String): Result<Unit> {
        return try {
            if (eventId.isBlank()) {
                db.collection("casetas").document(boothId)
                    .collection(subType).document(itemId).delete().await()
            } else {
                db.collection("casetas").document(boothId)
                    .collection("eventos").document(eventId)
                    .collection(subType).document(itemId).delete().await()
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun castVote(
        boothId: String, 
        pollId: String, 
        socioId: String, 
        choices: List<String>, 
        results: Map<String, Int>
    ): Result<Unit> {
        return try {
            db.collection("casetas").document(boothId).collection("votaciones").document(pollId)
                .update(
                    mapOf(
                        "votos.$socioId" to choices,
                        "resultados" to results
                    )
                ).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Helper extension to map snapshot to list of objects
    private inline fun <reified T> com.google.firebase.firestore.QuerySnapshot.toObjectList(): List<T> {
        return documents.mapNotNull { it.toObject(T::class.java) }
    }

    suspend fun addPoll(boothId: String, data: Map<String, Any>): Result<String> {
        return try {
            val docRef = db.collection("casetas").document(boothId).collection("votaciones")
                .add(data).await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun observeAllSocios(): Flow<List<Socio>> {
        return callbackFlow {
            val listener = db.collection("socios")
                .addSnapshotListener { snap, _ ->
                    trySend(snap?.toObjectList<Socio>() ?: emptyList())
                }
            awaitClose { listener.remove() }
        }
    }

    suspend fun saveCaseta(id: String?, data: Map<String, Any>): Result<String> {
        return try {
            if (id.isNullOrBlank()) {
                val docRef = db.collection("casetas").add(data).await()
                Result.success(docRef.id)
            } else {
                db.collection("casetas").document(id!!).set(data, com.google.firebase.firestore.SetOptions.merge()).await()
                Result.success(id)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteCaseta(id: String): Result<Unit> {
        return try {
            db.collection("casetas").document(id).delete().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
