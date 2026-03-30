package com.toust.casetas.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.casetas.data.model.Votacion
import com.toust.casetas.ui.components.GlassmorphismCard
import com.toust.casetas.ui.theme.*
import com.toust.casetas.ui.viewmodel.VotacionesViewModel

import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Verified
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.SolidColor

@Composable
fun VotacionesScreen(
    viewModel: VotacionesViewModel,
    socioId: String,
    isAdmin: Boolean = false
) {
    var showCreateDialog by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = Color.Transparent,
        floatingActionButton = {
            if (isAdmin) {
                FloatingActionButton(onClick = { showCreateDialog = true }, containerColor = Gold) {
                    Icon(Icons.Default.Add, contentDescription = "Crear", tint = Color.Black)
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Text(
                "URNA ELECTRÓNICA",
                style = MaterialTheme.typography.labelSmall,
                color = Gold,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            Text(
                "Procesos de Votación",
                style = MaterialTheme.typography.headlineSmall,
                color = TextPrimary,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 24.dp)
            )

            if (viewModel.polls.isEmpty()) {
                Box(Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                    Text("No hay votaciones activas.", color = TextSecondary)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(20.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(viewModel.polls) { poll ->
                        PollCardItem(poll, socioId, isAdmin, onDelete = { viewModel.deletePoll(poll.id) }) { options ->
                            viewModel.castVote(poll.id, options)
                        }
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        var pregunta by remember { mutableStateOf("") }
        var opcionesStr by remember { mutableStateOf("") }
        var isMultiple by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            title = { Text("Nueva Votación", color = Gold, fontWeight = FontWeight.Bold) },
            containerColor = Color(0xFF1A1A1A),
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = pregunta, 
                        onValueChange = { pregunta = it }, 
                        label = { Text("Pregunta") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Gold, focusedLabelColor = Gold)
                    )
                    OutlinedTextField(
                        value = opcionesStr, 
                        onValueChange = { opcionesStr = it }, 
                        label = { Text("Opciones (separadas por coma)") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Opción 1, Opción 2...") },
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Gold, focusedLabelColor = Gold)
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = isMultiple, onCheckedChange = { isMultiple = it }, colors = CheckboxDefaults.colors(checkedColor = Gold))
                        Text("Permitir múltiples respuestas", color = TextPrimary, fontSize = 14.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val list = opcionesStr.split(",").map { it.trim() }.filter { it.isNotBlank() }
                        if (pregunta.isNotBlank() && list.size >= 2) {
                            viewModel.createPoll(pregunta, list, isMultiple)
                            showCreateDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Color.Black)
                ) { Text("PUBLICAR", fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) { Text("CANCELAR", color = TextSecondary) }
            }
        )
    }
}

@Composable
fun PollCardItem(
    poll: Votacion,
    socioId: String,
    isAdmin: Boolean,
    onDelete: () -> Unit,
    onVote: (List<String>) -> Unit
) {
    val userVote = poll.votos[socioId]
    val hasVoted = userVote != null
    val totalVotes = poll.votos.size // Participant count
    val status = poll.status
    val canVote = status == "ABIERTA" && !hasVoted
    
    // For pending selection in multiple choice
    val selectedOptions = remember(hasVoted) { mutableStateListOf<String>() }

    GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    color = when(status) {
                        "ABIERTA" -> Color(0xFF4ADE80).copy(alpha = 0.1f)
                        "CERRADA" -> Color.Red.copy(alpha = 0.1f)
                        else -> Gold.copy(alpha = 0.1f)
                    },
                    shape = RoundedCornerShape(4.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, when(status) {
                        "ABIERTA" -> Color(0xFF4ADE80).copy(alpha = 0.4f)
                        "CERRADA" -> Color.Red.copy(alpha = 0.4f)
                        else -> Gold.copy(alpha = 0.4f)
                    })
                ) {
                    Text(
                        status, 
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        fontSize = 10.sp, 
                        fontWeight = FontWeight.Bold,
                        color = when(status) {
                            "ABIERTA" -> Color(0xFF4ADE80)
                            "CERRADA" -> Color.Red
                            else -> Gold
                        }
                    )
                }
                
                if (isAdmin) {
                    IconButton(onClick = onDelete, modifier = Modifier.size(24.dp)) {
                        Icon(androidx.compose.material.icons.Icons.Default.Delete, contentDescription = "Eliminar", tint = Color.Red.copy(alpha = 0.6f), modifier = Modifier.size(16.dp))
                    }
                }
            }

            Spacer(Modifier.height(8.dp))
            
            Text(
                poll.pregunta,
                style = MaterialTheme.typography.titleMedium,
                color = TextPrimary,
                fontWeight = FontWeight.ExtraBold
            )
            
            if (poll.multipleChoice) {
                Text("Permitido voto múltiple", color = Gold, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(16.dp))

            poll.opciones.forEach { opt ->
                val votesForOpt = poll.resultados[opt] ?: 0
                val percentage = if (totalVotes > 0) (votesForOpt.toFloat() / totalVotes) else 0f
                val isMyChoice = if (userVote is List<*>) userVote.contains(opt) else userVote == opt
                val isTemporarilySelected = selectedOptions.contains(opt)

                Column(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            if (canVote) {
                                if (poll.multipleChoice) {
                                    Checkbox(
                                        checked = isTemporarilySelected,
                                        onCheckedChange = { 
                                            if (it) selectedOptions.add(opt) else selectedOptions.remove(opt)
                                        },
                                        colors = CheckboxDefaults.colors(checkedColor = Gold)
                                    )
                                } else {
                                    RadioButton(
                                        selected = isTemporarilySelected,
                                        onClick = { 
                                            selectedOptions.clear()
                                            selectedOptions.add(opt)
                                        },
                                        colors = RadioButtonDefaults.colors(selectedColor = Gold)
                                    )
                                }
                            } else if (hasVoted && isMyChoice) {
                                Icon(androidx.compose.material.icons.Icons.Default.Check, contentDescription = null, tint = Gold, modifier = Modifier.size(20.dp).padding(end = 8.dp))
                            }
                            
                            Text(opt, color = if (isMyChoice) Gold else TextPrimary, fontSize = 14.sp, fontWeight = if (isMyChoice) FontWeight.Bold else FontWeight.Normal)
                        }
                        
                        if (hasVoted || status == "CERRADA") {
                            Text("${(percentage * 100).toInt()}%", color = Gold, fontWeight = FontWeight.Black, fontSize = 12.sp)
                        }
                    }
                    
                    if (hasVoted || status == "CERRADA") {
                        Spacer(Modifier.height(4.dp))
                        Box(Modifier.fillMaxWidth().height(6.dp).background(Color.White.copy(alpha = 0.05f), CircleShape)) {
                            Box(
                                Modifier.fillMaxWidth(percentage).fillMaxHeight().background(
                                    if (isMyChoice) Brush.horizontalGradient(listOf(Gold, Gold.copy(alpha = 0.5f))) else SolidColor(Gold.copy(alpha = 0.1f)),
                                    CircleShape
                                )
                            )
                        }
                    }
                }
            }

            if (canVote && selectedOptions.isNotEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { onVote(selectedOptions.toList()) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Color.Black),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("REGISTRAR MI VOTO", fontWeight = FontWeight.Black)
                }
            }

            if (hasVoted) {
                Spacer(modifier = Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(androidx.compose.material.icons.Icons.Default.Verified, contentDescription = null, tint = Gold.copy(alpha = 0.5f), modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("TU PARTICIPACIÓN HA SIDO RECONOCIDA", color = Gold.copy(alpha = 0.5f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
