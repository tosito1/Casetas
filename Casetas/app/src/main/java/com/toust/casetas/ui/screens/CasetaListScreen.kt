package com.toust.casetas.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CheckCircle
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

@Composable
fun CasetaListScreen(
    viewModel: CasetaListViewModel = viewModel(),
    socioId: String,
    userName: String,
    userEmail: String,
    currentCasetaId: String? = null,
    onNavigateToMyBooth: () -> Unit
) {
    val casetas by viewModel.casetas.collectAsState()
    
    AnimatedContent(targetState = viewModel.selectedCaseta == null) { isBrowsing ->
        if (isBrowsing) {
            Column(modifier = Modifier.fillMaxSize()) {
                Column(modifier = Modifier.padding(24.dp)) {
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
                }

                LazyVerticalGrid(
                    columns = GridCells.Fixed(1),
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
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
            Icon(Icons.Default.ArrowBack, contentDescription = "Regresar", tint = Gold)
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
                            Icon(Icons.Default.Send, contentDescription = null)
                            Spacer(Modifier.width(12.dp))
                            Text("ENVIAR PETICIÓN")
                        }
                    }
                }
            }
        }
    }
}
