package com.toust.casetas.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.casetas.data.model.Socio
import com.toust.casetas.ui.components.GlassmorphismCard
import com.toust.casetas.ui.theme.*
import com.toust.casetas.ui.viewmodel.SociosViewModel

@Composable
fun SociosManagementScreen(viewModel: SociosViewModel) {
    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            "GESTIÓN DE MIEMBROS",
            style = MaterialTheme.typography.labelSmall,
            color = Gold,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp
        )
        Text(
            "Listado de Socios",
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontWeight = FontWeight.Black,
            modifier = Modifier.padding(bottom = 24.dp)
        )

        if (viewModel.isLoading) {
            Box(Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Gold)
            }
        } else if (viewModel.socios.isEmpty()) {
            Box(Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                Text("No hay socios registrados en esta caseta.", color = TextSecondary)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(viewModel.socios) { socio ->
                    SocioCard(socio, viewModel)
                }
            }
        }
    }
}

@Composable
fun SocioCard(socio: Socio, viewModel: SociosViewModel) {
    GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    modifier = Modifier.size(40.dp),
                    shape = androidx.compose.foundation.shape.CircleShape,
                    color = Gold.copy(alpha = 0.1f)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            socio.nombre.take(1).uppercase(),
                            color = Gold,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                
                Spacer(Modifier.width(12.dp))
                
                Column(Modifier.weight(1f)) {
                    Text(socio.nombre.uppercase(), color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(socio.rol, color = Gold, fontSize = 10.sp)
                }

                val debt = viewModel.debts[socio.uid] ?: 0.0
                if (debt > 0) {
                    Column(horizontalAlignment = Alignment.End) {
                        Surface(
                            color = Color.Red.copy(alpha = 0.1f),
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(4.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color.Red.copy(alpha = 0.3f))
                        ) {
                            Text(
                                "-${debt}€", 
                                color = Color.Red, 
                                fontSize = 12.sp, 
                                fontWeight = FontWeight.Black, 
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                        Text("DEUDA TOTAL", color = Color.Red.copy(alpha = 0.6f), fontSize = 8.sp, fontWeight = FontWeight.Bold)
                    }
                } else if (socio.approved) {
                    Icon(Icons.Default.CheckCircle, contentDescription = "Pagado", tint = Color(0xFF4ADE80), modifier = Modifier.size(24.dp))
                }

                if (!socio.approved) {
                    Surface(
                        color = Color.Red.copy(alpha = 0.2f),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(4.dp),
                        modifier = Modifier.padding(start = 8.dp)
                    ) {
                        Text("PENDIENTE", color = Color.Red, fontSize = 8.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                    }
                }
            }
            
            Spacer(Modifier.height(16.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (!socio.approved) {
                    Button(
                        onClick = { viewModel.approveSocio(socio.id) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Color.Black),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp)
                    ) {
                        Text("APROBAR ENTRADA", fontSize = 10.sp, fontWeight = FontWeight.Black)
                    }
                } else {
                    OutlinedButton(
                        onClick = { viewModel.toggleSolvency(socio.id, !socio.cuotaAlDia) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = if (socio.cuotaAlDia) Color(0xFF4ADE80) else Color.Red),
                        border = androidx.compose.foundation.BorderStroke(1.dp, if (socio.cuotaAlDia) Color(0xFF4ADE80).copy(alpha = 0.4f) else Color.Red.copy(alpha = 0.4f)),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp)
                    ) {
                        Text(if (socio.cuotaAlDia) "MARCAR IMPAGO" else "MARCAR AL DÍA", fontSize = 10.sp, fontWeight = FontWeight.Black)
                    }
                }
                
                IconButton(
                    onClick = { viewModel.removeSocio(socio.id) },
                    modifier = Modifier.size(40.dp)
                ) {
                    Icon(Icons.Default.PersonRemove, contentDescription = "Expulsar", tint = Color.Red.copy(alpha = 0.6f))
                }
            }
        }
    }
}
