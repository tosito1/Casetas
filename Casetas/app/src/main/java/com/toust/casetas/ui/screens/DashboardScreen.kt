package com.toust.casetas.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.ui.*
import androidx.compose.ui.Alignment
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.toust.casetas.ui.theme.Gold
import com.toust.casetas.ui.viewmodel.DashboardViewModel
import com.toust.casetas.ui.components.GlassmorphismCard

import com.toust.casetas.ui.screens.finance.CuotasScreen
import com.toust.casetas.ui.viewmodel.CuotasViewModel
import com.toust.casetas.ui.viewmodel.HomeViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    initialBoothId: String = "",
    initialTab: Int = 0,
    viewModel: DashboardViewModel = viewModel(),
    onLoggedOut: () -> Unit,
    onBack: () -> Unit = {}
) {
    LaunchedEffect(initialTab) {
        viewModel.selectedTab = initialTab
    }

    val socio = viewModel.socio
    val isAdmin = socio?.isAdmin ?: false
    val isGlobalAdmin = socio?.isGlobalAdmin ?: false
    
    val items = remember(isAdmin) {
        val list = mutableListOf(
            "Inicio" to Icons.Default.Home,
            "Eventos" to Icons.Default.Event,
            "Cuentas" to Icons.Default.Payments,
            "Votos" to Icons.Default.HowToVote
        )
        if (isAdmin) {
            list.add("Socios" to Icons.Default.People)
        }
        list
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(onClick = onBack) {
                                    Icon(Icons.Default.ArrowBack, contentDescription = "Volver", tint = Gold)
                                }
                                Column {
                                    Text(
                                        "MI CASETA",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Gold,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 2.sp
                                    )
                                    Text(
                                        socio?.nombreCaseta?.uppercase() ?: "REALE CASETA",
                                        style = MaterialTheme.typography.headlineMedium,
                                        color = MaterialTheme.colorScheme.onBackground,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                            }
                            
                            Row {
                                IconButton(onClick = { viewModel.showMap = true }) {
                                    Icon(Icons.Default.Map, contentDescription = "Map", tint = Gold)
                                }
                                IconButton(onClick = { viewModel.selectedTab = 5 }) {
                                    Icon(Icons.Default.Person, contentDescription = "Profile", tint = Gold)
                                }
                                IconButton(onClick = { viewModel.logout(onLoggedOut) }) {
                                    Icon(Icons.Default.Close, contentDescription = "Logout", tint = Color.Red)
                                }
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background,
                        titleContentColor = Gold
                    )
                )
            },
            bottomBar = {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = Gold
                ) {
                    items.forEachIndexed { index, (label, icon) ->
                        NavigationBarItem(
                            icon = { Icon(icon, contentDescription = label) },
                            label = { Text(label) },
                            selected = viewModel.selectedTab == index,
                            onClick = { viewModel.selectedTab = index },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Gold,
                                selectedTextColor = Gold,
                                indicatorColor = Gold.copy(alpha = 0.1f)
                            )
                        )
                    }
                }
            }
        ) { innerPadding ->
            Box(modifier = Modifier.padding(innerPadding).padding(horizontal = 16.dp)) {
                if (socio != null) {
                    val boothId = if (socio.casetaId.isNullOrBlank()) initialBoothId else socio.casetaId
                    val socioId = socio.uid
                    
                    if (boothId.isBlank() && !isGlobalAdmin) {
                        // Show Caseta List
                        CasetaListScreen(
                            socioId = socioId,
                            userName = socio.nombre,
                            userEmail = socio.email,
                            onNavigateToMyBooth = { /* Already handled */ }
                        )
                    } else {
                        // Dashboard logic
                        when (viewModel.selectedTab) {
                            0 -> HomeScreen(
                                viewModel = HomeViewModel(boothId, socioId),
                                userName = socio.nombre,
                                boothName = socio.nombreCaseta.ifBlank { "MI CASETA" },
                                onNavigate = { viewModel.selectedTab = it }
                            )
                            1 -> com.toust.casetas.ui.screens.EventHubScreen(
                                viewModel = com.toust.casetas.ui.viewmodel.EventHubViewModel(boothId, "feria", socioId),
                                userName = socio.nombre,
                                isAdmin = isAdmin
                            )
                            2 -> CuotasScreen(
                                viewModel = CuotasViewModel(boothId, socioId)
                            )
                            3 -> com.toust.casetas.ui.screens.VotacionesScreen(
                                viewModel = com.toust.casetas.ui.viewmodel.VotacionesViewModel(boothId, socioId),
                                socioId = socioId,
                                isAdmin = isAdmin
                            )
                            4 -> if (isAdmin) {
                                com.toust.casetas.ui.screens.SociosManagementScreen(
                                    viewModel = com.toust.casetas.ui.viewmodel.SociosViewModel(boothId)
                                )
                            }
                            5 -> ProfileScreen(
                                socio = socio,
                                onLogout = { viewModel.logout(onLoggedOut) }
                            )
                        }
                    }
                } else {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            }
        }
        
        if (viewModel.showMap) {
            InteractiveMapScreen(
                userId = socio?.uid ?: "",
                onBack = { viewModel.showMap = false }
            )
        }
    }
}
