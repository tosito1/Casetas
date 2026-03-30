package com.toust.casetas.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.casetas.data.model.EventItem
import com.toust.casetas.ui.components.GlassmorphismCard
import com.toust.casetas.ui.theme.*
import com.toust.casetas.ui.viewmodel.EventHubViewModel

@Composable
fun EventHubScreen(
    viewModel: EventHubViewModel,
    userName: String,
    isAdmin: Boolean = false
) {
    val tabs = listOf("consumos", "stock", "gastos", "comidas", "tareas")
    var showAddDialog by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = Color.Transparent,
        floatingActionButton = {
            if (isAdmin && viewModel.activeTab != "consumos") {
                FloatingActionButton(
                    onClick = { showAddDialog = true },
                    containerColor = Gold,
                    contentColor = Color.Black
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Añadir")
                }
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            ScrollableTabRow(
                selectedTabIndex = tabs.indexOf(viewModel.activeTab),
                containerColor = Color.Transparent,
                contentColor = Gold,
                edgePadding = 16.dp,
                divider = {},
                indicator = { TabRowDefaults.Indicator(modifier = Modifier.tabIndicatorOffset(it[tabs.indexOf(viewModel.activeTab)]), color = Gold) }
            ) {
                tabs.forEach { tab ->
                    Tab(
                        selected = viewModel.activeTab == tab,
                        onClick = { viewModel.activeTab = tab },
                        text = { Text(tab.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Box(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
                when (viewModel.activeTab) {
                    "consumos" -> ConsumosTab(viewModel, userName, isAdmin)
                    "stock" -> InventarioTab(viewModel, isAdmin)
                    "gastos" -> GastosTab(viewModel, isAdmin)
                    "comidas" -> ComidasTab(viewModel, userName, isAdmin)
                    "tareas" -> TareasTab(viewModel, isAdmin)
                }
            }
        }
    }

    if (showAddDialog) {
        EventItemAddDialog(
            activeTab = viewModel.activeTab,
            onDismiss = { showAddDialog = false },
            onConfirm = { data ->
                viewModel.addAdminItem(viewModel.activeTab.let { if(it == "stock") "albaran" else it }, data + mapOf("creadoPor" to userName))
                showAddDialog = false
            }
        )
    }
}

@Composable
fun EventItemAddDialog(
    activeTab: String,
    onDismiss: () -> Unit,
    onConfirm: (Map<String, Any>) -> Unit
) {
    var field1 by remember { mutableStateOf("") }
    var field2 by remember { mutableStateOf("") }
    var field3 by remember { mutableStateOf("") }
    var field4 by remember { mutableStateOf("") }
    
    val title = when(activeTab) {
        "stock" -> "Nuevo Albarán (Stock)"
        "gastos" -> "Nuevo Gasto"
        "comidas" -> "Nueva Comida/Menú"
        "tareas" -> "Nueva Tarea"
        else -> "Nuevo Registro"
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, color = Gold, fontWeight = FontWeight.Bold) },
        containerColor = Color(0xFF1A1A1A),
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                when(activeTab) {
                    "stock" -> {
                        OutlinedTextField(value = field1, onValueChange = { field1 = it }, label = { Text("Artículo") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = field4, onValueChange = { field4 = it }, label = { Text("Tipo/Letra (ej: B, R, V)") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = field2, onValueChange = { field2 = it }, label = { Text("Cantidad Recibida") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = field3, onValueChange = { field3 = it }, label = { Text("Precio Unidad") }, modifier = Modifier.fillMaxWidth())
                    }
                    "gastos" -> {
                        OutlinedTextField(value = field1, onValueChange = { field1 = it }, label = { Text("Concepto") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = field2, onValueChange = { field2 = it }, label = { Text("Importe (€)") }, modifier = Modifier.fillMaxWidth())
                    }
                    "comidas" -> {
                        OutlinedTextField(value = field1, onValueChange = { field1 = it }, label = { Text("Menú") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = field2, onValueChange = { field2 = it }, label = { Text("Fecha (ej: Lunes Noche)") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = field3, onValueChange = { field3 = it }, label = { Text("Precio Cubierto (€)") }, modifier = Modifier.fillMaxWidth())
                    }
                    "tareas" -> {
                        OutlinedTextField(value = field1, onValueChange = { field1 = it }, label = { Text("Descripción de la Tarea") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = field2, onValueChange = { field2 = it }, label = { Text("Responsables (opcional)") }, modifier = Modifier.fillMaxWidth())
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val data = when(activeTab) {
                        "stock" -> mapOf("articulo" to field1, "tipo" to field4, "cantidadRecibida" to (field2.toDoubleOrNull() ?: 0.0), "precioUnidad" to (field3.toDoubleOrNull() ?: 0.0))
                        "gastos" -> mapOf("importe" to (field2.toDoubleOrNull() ?: 0.0), "concepto" to field1, "precio" to (field2.toDoubleOrNull() ?: 0.0))
                        "comidas" -> mapOf("menu" to field1, "fecha" to field2, "precioCubierto" to (field3.toDoubleOrNull() ?: 0.0), "asistentes" to emptyMap<String, Any>())
                        "tareas" -> mapOf("tarea" to field1, "concepto" to field1, "responsablesNombres" to if(field2.isBlank()) emptyList<String>() else listOf(field2), "completada" to false)
                        else -> emptyMap()
                    }
                    onConfirm(data)
                },
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Color.Black)
            ) { Text("GUARDAR", fontWeight = FontWeight.Bold) }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("CANCELAR", color = TextSecondary) }
        }
    )
}

@Composable
fun ConsumosTab(viewModel: EventHubViewModel, userName: String, isAdmin: Boolean) {
    val quickItems = viewModel.albaranes.distinctBy { it.articulo }.take(6)
    
    LazyColumn(verticalArrangement = Arrangement.spacedBy(24.dp)) {
        item {
            Column {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("BARRA RÁPIDA (TPOS)", style = MaterialTheme.typography.labelSmall, color = Gold)
                }
                Spacer(Modifier.height(12.dp))
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.heightIn(max = 300.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(quickItems) { product ->
                        val consumed = viewModel.consumos.filter { it.productoId == product.id }.sumOf { it.d_cantidad }
                        val stockAvailable = product.d_cantidadRecibida - consumed
                        val isAgotado = stockAvailable <= 0
                        
                        TposButton(product, isAgotado) { if (!isAgotado) viewModel.addConsumoRapido(product, userName) }
                    }
                }
            }
        }
        
        item {
            var expanded by remember { mutableStateOf(false) }
            val myConsumos = viewModel.consumos.filter { it.targetSocioId == viewModel.currentSocioId }

            GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("HOLA $userName", style = MaterialTheme.typography.labelSmall, color = Gold)
                            Text("MI CONSUMO FERIA", color = TextSecondary, fontSize = 12.sp)
                        }
                        Text("${String.format("%.2f", viewModel.personalDebt)} €", style = MaterialTheme.typography.headlineMedium, color = Gold, fontWeight = FontWeight.Black)
                    }
                    
                    Spacer(Modifier.height(12.dp))
                    
                    Button(
                        onClick = { expanded = !expanded },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Gold.copy(alpha = 0.1f)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(if (expanded) "OCULTAR DETALLES" else "VER DESGLOSE", color = Gold, fontWeight = FontWeight.Bold)
                    }
                    
                    if (expanded) {
                        Column(modifier = Modifier.padding(top = 16.dp)) {
                            myConsumos.reversed().forEach { item ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("${item.d_cantidad.toInt()}x ${item.articulo.ifBlank { item.displayConcepto }}", color = TextPrimary, fontSize = 14.sp)
                                    Text("${String.format("%.2f", item.d_precio)} €", color = Gold, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        if (isAdmin) {
            item {
                Text("RESUMEN GENERAL (ADMIN)", style = MaterialTheme.typography.labelSmall, color = Gold, modifier = Modifier.padding(top = 16.dp))
                Spacer(Modifier.height(8.dp))
            }
            items(viewModel.consumos.sortedByDescending { it.fecha }.take(10)) { consumo ->
                GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(consumo.targetSocioNombre ?: "Socio", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Text("${consumo.cantidad} ud - ${consumo.articulo}", color = TextSecondary, fontSize = 10.sp)
                        }
                        Text("${consumo.precio} €", color = Gold, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        IconButton(onClick = { viewModel.deleteItem("consumos", consumo.id) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Red, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TposButton(product: EventItem, isAgotado: Boolean, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp)
            .clickable(enabled = !isAgotado) { onClick() },
        colors = CardDefaults.cardColors(containerColor = if (isAgotado) Red.copy(alpha = 0.05f) else Gold.copy(alpha = 0.1f)),
        border = androidx.compose.foundation.BorderStroke(1.dp, if (isAgotado) Red.copy(alpha = 0.3f) else Gold.copy(alpha = 0.4f)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(product.tipo, fontWeight = FontWeight.Black, fontSize = 18.sp, color = if (isAgotado) Red else Gold)
            Text(product.articulo, fontSize = 10.sp, color = if (isAgotado) TextSecondary else TextPrimary)
            if (isAgotado) {
                Text("AGOTADO", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Red)
            } else {
                Text("${product.d_precioUnidad} €", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Gold)
            }
        }
    }
}

@Composable
fun InventarioTab(viewModel: EventHubViewModel, isAdmin: Boolean) {
    val items = viewModel.stockMap.keys.toList().sorted()
    
    if (items.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No hay existencias registradas", color = TextSecondary)
        }
    }

    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items(items) { article ->
            val firstAlbaran = viewModel.albaranes.find { it.articulo == article }
            val tipo = firstAlbaran?.tipo ?: "?"
            val stock = viewModel.stockMap[article] ?: 0
            
            GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Small Circle with Letter
                    Surface(
                        modifier = Modifier.size(36.dp),
                        color = Gold.copy(alpha = 0.1f),
                        shape = androidx.compose.foundation.shape.CircleShape,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Gold.copy(alpha = 0.3f))
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(tipo, color = Gold, fontWeight = FontWeight.Black)
                        }
                    }

                    Spacer(Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            article.uppercase(),
                            color = TextPrimary,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                        val totalIn = viewModel.albaranes.filter { it.articulo == article }.sumOf { it.d_cantidadRecibida }.toInt()
                        Text("Total recibido: $totalIn ud", color = TextSecondary, fontSize = 12.sp)
                    }
                    
                    Surface(
                        color = if (stock <= 5) Red.copy(alpha = 0.2f) else Gold.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(8.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, if (stock <= 5) Red else Gold.copy(alpha = 0.5f))
                    ) {
                        Text(
                            "$stock",
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            color = if (stock <= 5) Red else Gold,
                            fontWeight = FontWeight.Black,
                            fontSize = 20.sp
                        )
                    }
                    
                    if (isAdmin) {
                        IconButton(onClick = { 
                            // Delete last albaran for this article (simplified maintenance)
                            firstAlbaran?.let { viewModel.deleteItem("albaran", it.id) }
                        }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Red, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun GastosTab(viewModel: EventHubViewModel, isAdmin: Boolean) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        items(viewModel.gastos) { gasto ->
            GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(gasto.displayConcepto, color = TextPrimary)
                        Text("Por ${gasto.creadoPor}", color = TextSecondary, fontSize = 10.sp)
                    }
                    Text("-${String.format("%.2f", gasto.d_precio)} €", color = Red, fontWeight = FontWeight.Bold)
                    if (isAdmin) {
                        IconButton(onClick = { viewModel.deleteItem("gastos", gasto.id) }, Modifier.size(24.dp)) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Red, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ComidasTab(viewModel: EventHubViewModel, userName: String, isAdmin: Boolean) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        items(viewModel.comidas) { comida ->
            val myInfo = comida.asistentes?.get(viewModel.currentSocioId) as? Map<String, Any>
            val isJoined = myInfo != null
            val guestCount = (myInfo?.get("invitados") as? Number)?.toInt() ?: 0
            
            GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(comida.fecha, color = Gold, style = MaterialTheme.typography.labelSmall)
                        if (isAdmin) {
                            IconButton(onClick = { viewModel.deleteItem("comidas", comida.id) }, Modifier.size(24.dp)) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Red, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                    Text(comida.menu.ifBlank { "Menú por definir" }, color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text("Precio: ${if(comida.d_precioCubierto > 0) comida.d_precioCubierto else comida.d_precioUnidad} € / cubierto", color = TextSecondary)
                    
                    Spacer(Modifier.height(12.dp))
                    
                    // Attendees Sum
                    val totalAsistentes = (comida.asistentes?.values?.size ?: 0) + (comida.asistentes?.values?.filterIsInstance<Map<String, Any>>()?.sumOf { (it["invitados"] as? Number)?.toInt() ?: 0 } ?: 0)
                    
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("👥 $totalAsistentes personas", color = Gold, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (isJoined) {
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(end = 16.dp)) {
                                    IconButton(onClick = { viewModel.updateComidaGuests(comida, -1) }, modifier = Modifier.size(24.dp)) {
                                        Icon(androidx.compose.material.icons.Icons.Default.Remove, contentDescription = "-", tint = Gold)
                                    }
                                    Text("$guestCount inv.", color = TextPrimary, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 4.dp))
                                    IconButton(onClick = { viewModel.updateComidaGuests(comida, 1) }, modifier = Modifier.size(24.dp)) {
                                        Icon(androidx.compose.material.icons.Icons.Default.Add, contentDescription = "+", tint = Gold)
                                    }
                                }
                            }
                            
                            Button(
                                onClick = { viewModel.toggleComidaAttendance(comida, userName) },
                                colors = ButtonDefaults.buttonColors(containerColor = if (isJoined) Red.copy(alpha = 0.2f) else Gold.copy(alpha = 0.2f)),
                                modifier = Modifier.height(32.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp)
                            ) {
                                Text(if (isJoined) "BAJA" else "UNIRME", color = if (isJoined) Red else Gold, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TareasTab(viewModel: EventHubViewModel, isAdmin: Boolean) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        items(viewModel.tareas) { tarea ->
            GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = tarea.completada, 
                        onCheckedChange = { viewModel.toggleTarea(tarea) },
                        colors = CheckboxDefaults.colors(checkedColor = Gold)
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(tarea.displayConcepto, color = TextPrimary, fontWeight = if (tarea.completada) FontWeight.Normal else FontWeight.Bold)
                        Text("Responsables: ${tarea.responsablesNombres.joinToString().ifBlank { "General" }}", color = Gold, fontSize = 10.sp)
                    }
                    if (isAdmin) {
                        IconButton(onClick = { viewModel.deleteItem("tareas", tarea.id) }, Modifier.size(24.dp)) {
                            Icon(androidx.compose.material.icons.Icons.Default.Delete, contentDescription = "Delete", tint = Red, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }
}
