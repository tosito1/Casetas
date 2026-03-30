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
import com.toust.casetas.data.model.Caseta
import com.toust.casetas.ui.components.GlassmorphismCard
import com.toust.casetas.ui.theme.*
import com.toust.casetas.ui.viewmodel.GlobalAdminViewModel

@Composable
fun GlobalAdminScreen(viewModel: GlobalAdminViewModel) {
    var activeSubTab by remember { mutableStateOf("casetas") }
    var showAddBoothDialog by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = Color.Transparent,
        floatingActionButton = {
            if (activeSubTab == "casetas") {
                FloatingActionButton(onClick = { showAddBoothDialog = true }, containerColor = Gold, contentColor = Color.Black) {
                    Icon(Icons.Default.Add, contentDescription = "Nueva Caseta")
                }
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            Text("ADMINISTRACIÓN GLOBAL", style = MaterialTheme.typography.labelSmall, color = Gold, fontWeight = FontWeight.Bold)
            
            Row(modifier = Modifier.padding(vertical = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AdminChip(label = "CASETAS", selected = activeSubTab == "casetas") { activeSubTab = "casetas" }
                AdminChip(label = "SOCIOS", selected = activeSubTab == "socios") { activeSubTab = "socios" }
            }

            if (viewModel.isLoading) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Gold) }
            } else {
                when (activeSubTab) {
                    "casetas" -> LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        items(viewModel.casetas) { caseta ->
                            GlobalCasetaCard(caseta, onDelete = { viewModel.deleteBooth(caseta.id) })
                        }
                    }
                    "socios" -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(viewModel.allSocios) { socio ->
                            GlobalSocioItem(socio)
                        }
                    }
                }
            }
        }
    }

    if (showAddBoothDialog) {
        AddBoothDialog(
            onDismiss = { showAddBoothDialog = false },
            onConfirm = { name, street, num ->
                viewModel.saveBooth(null, name, street, num)
                showAddBoothDialog = false
            }
        )
    }
}

@Composable
fun AdminChip(label: String, selected: Boolean, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        color = if (selected) Gold else Color.White.withOpacity(0.05f),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp),
        border = if (selected) null else androidx.compose.foundation.BorderStroke(1.dp, Color.White.withOpacity(0.1f))
    ) {
        Text(
            label, 
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            color = if (selected) Color.Black else Color.White,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

private fun Color.withOpacity(alpha: Float) = this.copy(alpha = alpha)

@Composable
fun GlobalCasetaCard(caseta: Caseta, onDelete: () -> Unit) {
    GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(caseta.nombre.uppercase(), color = TextPrimary, fontWeight = FontWeight.Black)
                Text("${caseta.calle}, ${caseta.numero}", color = TextSecondary, fontSize = 12.sp)
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, contentDescription = "Borrar", tint = Color.Red.copy(alpha = 0.6f))
            }
        }
    }
}

@Composable
fun GlobalSocioItem(socio: com.toust.casetas.data.model.Socio) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.05f))
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Person, contentDescription = null, tint = Gold, modifier = Modifier.size(24.dp))
            Spacer(Modifier.width(12.dp))
            Column {
                Text(socio.nombre, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Text("${socio.email} • ${socio.rol}", color = TextSecondary, fontSize = 10.sp)
            }
        }
    }
}

@Composable
fun AddBoothDialog(onDismiss: () -> Unit, onConfirm: (String, String, String) -> Unit) {
    var name by remember { mutableStateOf("") }
    var street by remember { mutableStateOf("") }
    var num by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("CREAR NUEVA CASETA", color = Gold, fontWeight = FontWeight.Bold) },
        containerColor = Color(0xFF1A1A1A),
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nombre de la Caseta") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = street, onValueChange = { street = it }, label = { Text("Calle") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = num, onValueChange = { num = it }, label = { Text("Número") }, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(onClick = { onConfirm(name, street, num) }, colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Color.Black)) {
                Text("CREAR", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("CANCELAR", color = TextSecondary) }
        }
    )
}
