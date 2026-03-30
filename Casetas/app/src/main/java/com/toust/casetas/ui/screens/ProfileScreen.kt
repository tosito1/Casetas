package com.toust.casetas.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.casetas.data.model.Socio
import com.toust.casetas.ui.components.GlassmorphismCard
import com.toust.casetas.ui.theme.*

@Composable
fun ProfileScreen(
    socio: Socio,
    onLogout: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // --- Header / Avatar ---
        item {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    Modifier.size(100.dp).clip(CircleShape).background(Gold.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        socio.nombre.take(1).uppercase(),
                        color = Gold,
                        fontSize = 40.sp,
                        fontWeight = FontWeight.Black
                    )
                }
                Spacer(Modifier.height(16.dp))
                Text(socio.nombre.uppercase(), style = MaterialTheme.typography.headlineSmall, color = TextPrimary, fontWeight = FontWeight.Bold)
                Text(socio.rol.uppercase(), style = MaterialTheme.typography.labelSmall, color = Gold, fontWeight = FontWeight.Bold)
            }
        }

        // --- Info Cards ---
        item {
            GlassmorphismCard(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    ProfileInfoRow(Icons.Default.Email, "EMAIL", socio.email)
                    ProfileInfoRow(Icons.Default.Phone, "TELÉFONO", socio.telefono.ifBlank { "No especificado" })
                    ProfileInfoRow(
                Icons.Default.Home, 
                "MI CASETA", 
                socio.nombreCaseta.ifBlank { 
                    if (socio.casetaId?.isNotBlank() == true) "Cargando..." else "Sin asignar" 
                }
            )
                }
            }
        }

        // --- Status Section ---
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                StatusCard(
                    Modifier.weight(1f),
                    "SOLVENTE",
                    if (socio.cuotaAlDia) "AL DÍA" else "PENDIENTE",
                    if (socio.cuotaAlDia) Gold else Red
                )
                StatusCard(
                    Modifier.weight(1f),
                    "ESTADO",
                    if (socio.approved) "APROBADO" else "REVISIÓN",
                    if (socio.approved) Gold else Red
                )
            }
        }

        // --- Actions ---
        item {
            Button(
                onClick = onLogout,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Red.copy(alpha = 0.1f)),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Red.copy(alpha = 0.4f))
            ) {
                Icon(Icons.Default.Logout, contentDescription = null, tint = Red)
                Spacer(Modifier.width(12.dp))
                Text("CERRAR SESIÓN", color = Red, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ProfileInfoRow(icon: ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = Gold, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(16.dp))
        Column {
            Text(label, style = MaterialTheme.typography.labelSmall, color = TextSecondary, fontSize = 9.sp)
            Text(value, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
fun StatusCard(modifier: Modifier, label: String, status: String, color: Color) {
    GlassmorphismCard(modifier) {
        Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
            Spacer(Modifier.height(4.dp))
            Text(status, color = color, fontWeight = FontWeight.Black, fontSize = 16.sp)
        }
    }
}
