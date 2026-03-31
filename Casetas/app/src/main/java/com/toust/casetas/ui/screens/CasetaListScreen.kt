package com.toust.casetas.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.toust.casetas.data.model.Caseta
import com.toust.casetas.ui.components.GlassmorphismCard
import com.toust.casetas.ui.theme.Gold
import com.toust.casetas.ui.viewmodel.CasetaListViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CasetaListScreen(
    viewModel: CasetaListViewModel = viewModel(),
    socioId: String,
    userName: String,
    userEmail: String,
    currentCasetaId: String? = null,
    onNavigateToMyBooth: () -> Unit
) {
    val casetas by viewModel.filteredCasetas.collectAsState(initial = emptyList())
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedFilter by viewModel.selectedFilter.collectAsState()
    
    AnimatedContent(targetState = viewModel.selectedCaseta == null) { isBrowsing ->
        if (isBrowsing) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
            ) {
                Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)) {
                    Text(
                        "NUESTRAS CASETAS",
                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black),
                        color = Gold
                    )
                    Text(
                        "Encuentra la caseta perfecta para disfrutar de la feria.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.6f)
                    )
                    
                    Spacer(Modifier.height(24.dp))

                    val focusManager = androidx.compose.ui.platform.LocalFocusManager.current

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { viewModel.onSearchQueryChange(it) },
                            modifier = Modifier.weight(1f),
                            placeholder = { Text("Buscar por nombre o calle...", color = Color.White.copy(alpha = 0.3f)) },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Gold) },
                            trailingIcon = { 
                                if (searchQuery.isNotEmpty()) {
                                    IconButton(onClick = { viewModel.onSearchQueryChange("") }) {
                                        Icon(Icons.Default.Close, contentDescription = null, tint = Gold)
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

                        Surface(
                            onClick = { focusManager.clearFocus() },
                            color = Gold,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.size(56.dp),
                            tonalElevation = 2.0.dp,
                            shadowElevation = 4.0.dp
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.Search, contentDescription = "Buscar", tint = Color.Black)
                            }
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("TODAS", "PÚBLICA", "PRIVADA", "PEÑA").forEach { filter ->
                            val isSelected = selectedFilter == filter
                            FilterChip(
                                selected = isSelected,
                                onClick = { viewModel.onFilterChange(filter) },
                                label = { Text(filter) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Gold,
                                    selectedLabelColor = Color.Black,
                                    containerColor = Color.White.copy(alpha = 0.05f),
                                    labelColor = Color.White.copy(alpha = 0.6f)
                                ),
                                border = FilterChipDefaults.filterChipBorder(
                                    enabled = true,
                                    selected = isSelected,
                                    borderColor = Color.White.copy(alpha = 0.1f),
                                    selectedBorderColor = Gold
                                )
                            )
                        }
                    }
                }

                if (casetas.isEmpty() && searchQuery.isNotEmpty()) {
                    Column(
                        modifier = Modifier.fillMaxSize().padding(40.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text("🔍", fontSize = 48.sp)
                        Text(
                            "No se encontró ninguna caseta",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White,
                            modifier = Modifier.padding(top = 16.dp)
                        )
                        Text(
                            "Prueba con otros términos o filtros.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.4f)
                        )
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(1),
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 80.dp, top = 0.dp, start = 16.dp, end = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(casetas) { caseta ->
                            val isMember = currentCasetaId == caseta.id
                            CasetaListItem(
                                caseta = caseta,
                                isMember = isMember,
                                onClick = {
                                    if (isMember) onNavigateToMyBooth()
                                    else if (currentCasetaId.isNullOrBlank()) viewModel.selectedCaseta = caseta
                                }
                            )
                        }
                    }
                }
            }
        } else {
            JoinRequestFormScreen(
                caseta = viewModel.selectedCaseta!!,
                socioId = socioId,
                userName = userName,
                userEmail = userEmail,
                viewModel = viewModel,
                onBack = { viewModel.selectedCaseta = null }
            )
        }
    }
}

@Composable
fun CasetaListItem(
    caseta: Caseta,
    isMember: Boolean,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(180.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.4f))
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            AsyncImage(
                model = caseta.imagen ?: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1000&auto=format&fit=crop",
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
                alpha = 0.5f
            )
            
            Column(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.Bottom
            ) {
                if (isMember) {
                    Surface(
                        color = Gold,
                        shape = RoundedCornerShape(4.dp),
                        modifier = Modifier.padding(bottom = 8.dp)
                    ) {
                        Text(
                            "TU CASETA",
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.Black,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Text(
                    caseta.nombre.uppercase(),
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                    color = Gold
                )
                Text(
                    "${caseta.calle} \u2022 N\u00BA ${caseta.numero}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White
                )
            }
            
            Surface(
                color = Color.White.copy(alpha = 0.1f),
                shape = RoundedCornerShape(4.dp),
                modifier = Modifier.align(Alignment.TopEnd).padding(16.dp)
            ) {
                Text(
                    caseta.clase,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JoinRequestFormScreen(
    caseta: Caseta,
    socioId: String,
    userName: String,
    userEmail: String,
    viewModel: CasetaListViewModel,
    onBack: () -> Unit
) {
    var motivo by remember { mutableStateOf("") }
    
    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Regresar", tint = Gold)
        }
        
        Spacer(Modifier.height(16.dp))
        
        if (viewModel.requestSubmitted) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = Gold,
                    modifier = Modifier.size(64.dp)
                )
                Spacer(Modifier.height(24.dp))
                Text(
                    "¡SOLICITUD ENVIADA!",
                    style = MaterialTheme.typography.titleLarge,
                    color = Gold,
                    fontWeight = FontWeight.Black
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    "Tu petición para unirte a ${caseta.nombre} ha sido registrada. " +
                    "Te avisaremos cuando el administrador apruebe tu solicitud.",
                    textAlign = TextAlign.Center,
                    color = Color.White.copy(alpha = 0.7f)
                )
                Spacer(Modifier.height(32.dp))
                Button(
                    onClick = onBack,
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.1f))
                ) {
                    Text("Volver al listado")
                }
            }
        } else {
            Text(
                "SOLICITAR ENTRADA",
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black),
                color = Gold
            )
            Text(
                "Unirse a ${caseta.nombre}",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.4f)
            )
            
            Spacer(Modifier.height(32.dp))
            
            GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(24.dp)) {
                    OutlinedTextField(
                        value = motivo,
                        onValueChange = { motivo = it },
                        label = { Text("Motivo de la solicitud (Opcional)") },
                        modifier = Modifier.fillMaxWidth().height(150.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                            focusedBorderColor = Gold
                        )
                    )
                    
                    Spacer(Modifier.height(24.dp))
                    
                    Button(
                        onClick = { 
                            viewModel.submitJoinRequest(socioId, userName, userEmail, motivo)
                        },
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Color.Black),
                        shape = RoundedCornerShape(12.dp),
                        enabled = !viewModel.isSubmittingRequest
                    ) {
                        if (viewModel.isSubmittingRequest) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.Black)
                        } else {
                            Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null)
                            Spacer(Modifier.width(12.dp))
                            Text("ENVIAR PETICIÓN")
                        }
                    }
                }
            }
        }
    }
}
