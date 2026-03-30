package com.toust.casetas.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Poll
import androidx.compose.material3.*
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.casetas.ui.components.GlassmorphismCard
import com.toust.casetas.ui.theme.*
import com.toust.casetas.ui.viewmodel.HomeViewModel

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    userName: String,
    boothName: String,
    onNavigate: (Int) -> Unit
) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }

    Box(modifier = Modifier.fillMaxSize()) {
        // Decorative background elements
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Gold.copy(alpha = 0.03f), Color.Transparent),
                    center = Offset(size.width, 0f),
                    radius = size.width * 0.8f
                ),
                center = Offset(size.width, 0f),
                radius = size.width * 0.8f
            )
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // --- Hero Welcome ---
            item {
                AnimatedVisibility(
                    visible = visible,
                    enter = fadeIn(tween(800)) + slideInVertically(tween(800)) { it / 2 }
                ) {
                    GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
                        Box {
                            // Tiny decorative icon in the corner
                            Icon(
                                Icons.Default.Place, 
                                contentDescription = null, 
                                tint = Gold.copy(0.05f),
                                modifier = Modifier.size(120.dp).align(Alignment.BottomEnd).offset(x = 20.dp, y = 20.dp)
                            )

                            Column(modifier = Modifier.padding(28.dp)) {
                                Text(
                                    "BIENVENIDO A", 
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Gold, 
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = 2.sp
                                )
                                Text(
                                    boothName.uppercase(),
                                    style = MaterialTheme.typography.headlineMedium,
                                    color = TextPrimary,
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = (-0.5).sp
                                )
                                Text(
                                    "La feria es alegría, y tú eres parte de ella.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TextSecondary,
                                    modifier = Modifier.padding(top = 4.dp)
                                )
                                
                                Spacer(modifier = Modifier.height(32.dp))
                                
                                Button(
                                    onClick = { viewModel.manualCheckIn(userName) },
                                    modifier = Modifier.fillMaxWidth().height(56.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Color.Black),
                                    shape = RoundedCornerShape(16.dp),
                                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 8.dp)
                                ) {
                                    Icon(Icons.Default.Place, contentDescription = null, modifier = Modifier.size(20.dp))
                                    Spacer(Modifier.width(12.dp))
                                    Text("REGISTRAR MI POSICIÓN", fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
                                }
                            }
                        }
                    }
                }
            }

            // --- Widgets Grid ---
            item {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    AnimatedVisibility(
                        visible = visible,
                        enter = fadeIn(tween(800, delayMillis = 200)) + slideInVertically(tween(800, delayMillis = 200)) { it / 2 }
                    ) {
                        DashboardWidget(
                            title = "Último Aviso",
                            icon = Icons.Default.Notifications,
                            content = viewModel.latestNotif?.titulo ?: "No hay avisos recientes",
                            description = viewModel.latestNotif?.displayMensaje?.take(40) ?: "Ve al tablón para ver más.",
                            onClick = { onNavigate(4) }
                        )
                    }
                    
                    AnimatedVisibility(
                        visible = visible,
                        enter = fadeIn(tween(800, delayMillis = 400)) + slideInVertically(tween(800, delayMillis = 400)) { it / 2 }
                    ) {
                        DashboardWidget(
                            title = "Mis Cuentas",
                            icon = Icons.Default.Payments,
                            content = if (viewModel.pendingFeesCount > 0) "${viewModel.pendingFeesCount} cuotas" else "¡Al día!",
                            description = if (viewModel.pendingFeesCount > 0) "Tienes pagos pendientes." else "Felicidades, solvente.",
                            onClick = { onNavigate(1) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun DashboardWidget(
    title: String,
    icon: ImageVector,
    content: String,
    description: String,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
        contentPadding = PaddingValues(0.dp),
        shape = RoundedCornerShape(24.dp)
    ) {
        GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.padding(24.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Gold.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, contentDescription = null, tint = Gold, modifier = Modifier.size(28.dp))
                }
                
                Spacer(modifier = Modifier.width(20.dp))
                
                Column {
                    Text(title.uppercase(), style = MaterialTheme.typography.labelSmall, color = Gold, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    Text(content, style = MaterialTheme.typography.titleMedium, color = TextPrimary, fontWeight = FontWeight.Bold)
                    Text(description, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                }
            }
        }
    }
}
