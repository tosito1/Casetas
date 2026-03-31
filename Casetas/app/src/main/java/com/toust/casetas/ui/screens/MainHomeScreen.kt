package com.toust.casetas.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.toust.casetas.ui.components.GlassmorphismCard
import com.toust.casetas.ui.theme.*
import com.toust.casetas.ui.viewmodel.CasetaListViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainHomeScreen(
    onOpenMap: () -> Unit,
    onOpenBooth: (String) -> Unit,
    onOpenProfile: () -> Unit,
    onLogout: () -> Unit
) {
    val listViewModel: CasetaListViewModel = viewModel()
    val casetas by listViewModel.casetas.collectAsState()

    Scaffold(
        containerColor = BgPrimary
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .padding(padding)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(BgPrimary, Color.Black)
                    )
                )
        ) {
            // Header with Search Bar
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            "MI PORTAL",
                            style = MaterialTheme.typography.labelSmall,
                            color = Gold,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.sp
                        )
                        Text(
                            "Mi Caseta",
                            style = MaterialTheme.typography.headlineMedium,
                            color = TextPrimary,
                            fontWeight = FontWeight.Black
                        )
                    }
                    IconButton(onClick = onOpenProfile) {
                        Icon(androidx.compose.material.icons.Icons.Default.Person, contentDescription = "Perfil", tint = Gold)
                    }
                }

                // IN-HEADER SEARCH BAR
                val focusManager = androidx.compose.ui.platform.LocalFocusManager.current
                val searchQuery by listViewModel.searchQuery.collectAsState()
                
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { listViewModel.onSearchQueryChange(it) },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Buscar caseta o calle...", color = TextSecondary, fontSize = 14.sp) },
                    leadingIcon = { Icon(androidx.compose.material.icons.Icons.Default.Search, contentDescription = null, tint = Gold, modifier = Modifier.size(20.dp)) },
                    trailingIcon = { 
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { listViewModel.onSearchQueryChange("") }) {
                                Icon(androidx.compose.material.icons.Icons.Default.Close, contentDescription = "Limpiar", tint = Gold)
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Gold,
                        unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                        focusedContainerColor = Color.White.copy(alpha = 0.05f),
                        unfocusedContainerColor = Color.White.copy(alpha = 0.05f),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        imeAction = androidx.compose.ui.text.input.ImeAction.Search
                    ),
                    keyboardActions = androidx.compose.foundation.text.KeyboardActions(
                        onSearch = { focusManager.clearFocus() }
                    )
                )
            }

            Spacer(Modifier.height(16.dp))

            // SECTION 1: MAPA INTERACTIVO
            Text(
                "EXPLORA EL REAL",
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary,
                fontWeight = FontWeight.Bold
            )
            Spacer(Modifier.height(16.dp))
            
            GlassmorphismCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
                    .clickable { onOpenMap() }
            ) {
                Box(Modifier.fillMaxSize()) {
                    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.Center) {
                        Icon(Icons.Default.Map, contentDescription = "Map", tint = Gold, modifier = Modifier.size(32.dp))
                        Text("MAPA INTERACTIVO", style = MaterialTheme.typography.titleMedium, color = TextPrimary, fontWeight = FontWeight.Black)
                        Text("Ver rastro de socios y ubicaciones", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    }
                }
            }

            // SECTION: GLOBAL ADMIN (DYNAMIC)
            val authRepo = remember { com.toust.casetas.data.repository.AuthRepository() }
            val socio by authRepo.observeProfile().collectAsState(initial = null)
            
            if (socio?.isGlobalAdmin == true) {
                var showGlobalPanel by remember { mutableStateOf(false) }
                
                Spacer(Modifier.height(32.dp))
                Text(
                    "HERRAMIENTAS DE CONTROL",
                    style = MaterialTheme.typography.labelSmall,
                    color = Gold,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.height(16.dp))
                
                GlassmorphismCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp)
                        .clickable { showGlobalPanel = true }
                ) {
                    Box(Modifier.fillMaxSize()) {
                        Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.Center) {
                            Icon(androidx.compose.material.icons.Icons.Default.Settings, contentDescription = null, tint = Gold, modifier = Modifier.size(32.dp))
                            Text("ADMINISTRACIÓN GLOBAL", style = MaterialTheme.typography.titleMedium, color = TextPrimary, fontWeight = FontWeight.Black)
                            Text("Gestionar casetas, socios y sistema", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                        }
                    }
                }
                
                if (showGlobalPanel) {
                    AlertDialog(
                        onDismissRequest = { showGlobalPanel = false },
                        modifier = Modifier.fillMaxSize(),
                        containerColor = BgPrimary,
                        title = { null },
                        text = {
                            com.toust.casetas.ui.screens.GlobalAdminScreen(
                                viewModel = viewModel(factory = object : androidx.lifecycle.ViewModelProvider.Factory {
                                    override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T = 
                                        com.toust.casetas.ui.viewmodel.GlobalAdminViewModel() as T
                                })
                            )
                        },
                        confirmButton = {
                            IconButton(onClick = { showGlobalPanel = false }) {
                                Icon(androidx.compose.material.icons.Icons.Default.Close, contentDescription = "Cerrar", tint = Gold)
                            }
                        }
                    )
                }
            }

            Spacer(Modifier.height(40.dp))

            // SECTION 2: CASETAS
            Text(
                "CASETAS EN LA APP",
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary,
                fontWeight = FontWeight.Bold
            )
            Spacer(Modifier.height(16.dp))

            val filteredCasetas by listViewModel.filteredCasetas.collectAsState(initial = emptyList())

            LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                items(filteredCasetas) { booth ->
                    BoothListItem(booth.nombre, booth.descripcion ?: "Caseta oficial") {
                        onOpenBooth(booth.id)
                    }
                }
            }
        }
    }
}

@Composable
fun BoothListItem(title: String, subtitle: String, onClick: () -> Unit) {
    GlassmorphismCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Row(
            Modifier
                .padding(20.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                Modifier
                    .size(48.dp)
                    .background(Gold.copy(alpha = 0.1f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    title.take(1).uppercase(),
                    color = Gold,
                    fontWeight = FontWeight.Black,
                    fontSize = 20.sp
                )
            }
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f)) {
                Text(title, color = TextPrimary, fontWeight = FontWeight.Bold)
                Text(subtitle, color = TextSecondary, fontSize = 12.sp)
            }
            Icon(Icons.Default.ArrowForward, contentDescription = "Go", tint = Gold, modifier = Modifier.size(16.dp))
        }
    }
}
