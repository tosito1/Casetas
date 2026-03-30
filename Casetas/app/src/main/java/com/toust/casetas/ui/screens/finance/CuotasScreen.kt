package com.toust.casetas.ui.screens.finance

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.casetas.data.model.Cuota
import com.toust.casetas.ui.components.GlassmorphismCard
import com.toust.casetas.ui.theme.Gold
import com.toust.casetas.ui.theme.Red
import com.toust.casetas.ui.theme.TextPrimary
import com.toust.casetas.ui.theme.TextSecondary
import com.toust.casetas.ui.viewmodel.CuotasViewModel

@Composable
fun CuotasScreen(
    viewModel: CuotasViewModel
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Tab Selector (Small Pill style)
        TabRow(
            selectedTabIndex = viewModel.activeTab,
            containerColor = Color.Transparent,
            contentColor = Gold,
            divider = {},
            indicator = { TabRowDefaults.Indicator(color = Gold) }
        ) {
            Tab(selected = viewModel.activeTab == 0, onClick = { viewModel.activeTab = 0 }) {
                Text("Mis Pagos", modifier = Modifier.padding(16.dp))
            }
            Tab(selected = viewModel.activeTab == 1, onClick = { viewModel.activeTab = 1 }) {
                Text("Caja General", modifier = Modifier.padding(16.dp))
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (viewModel.activeTab == 0) {
            PersonalFinanceContent(viewModel)
        } else {
            GeneralFinanceContent(viewModel)
        }
    }
}

@Composable
fun PersonalFinanceContent(viewModel: CuotasViewModel) {
    Column {
        // Global Debt Widget
        GlassmorphismCard(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    "DEUDA TOTAL ACUMULADA",
                    style = MaterialTheme.typography.labelMedium,
                    color = Gold.copy(alpha = 0.7f)
                )
                Text(
                    "${viewModel.totalFeesDebt} €",
                    style = MaterialTheme.typography.headlineLarge.copy(
                        fontWeight = FontWeight.Black,
                        color = if (viewModel.totalFeesDebt > 0) Red else Gold
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            "CUOTAS PENDIENTES",
            style = MaterialTheme.typography.labelLarge,
            color = Gold,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (viewModel.cuotas.isEmpty()) {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text("No hay cuotas registradas", color = TextSecondary)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(viewModel.cuotas) { fee ->
                    FeeCardItem(fee)
                }
            }
        }
    }
}

@Composable
fun FeeCardItem(fee: Cuota) {
    GlassmorphismCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(fee.concepto, color = TextPrimary, fontWeight = FontWeight.Bold)
                Text("Límite: ${fee.deadline}", color = TextSecondary, style = MaterialTheme.typography.bodySmall)
            }
            Text(
                "${fee.d_dineroBase} €",
                color = Gold,
                fontWeight = FontWeight.Black,
                fontSize = 18.sp
            )
        }
    }
}

@Composable
fun GeneralFinanceContent(viewModel: CuotasViewModel) {
    // Basic dashboard for cash flow
    Column {
        GlassmorphismCard(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    "SALDO EN CAJA",
                    style = MaterialTheme.typography.labelMedium,
                    color = Gold.copy(alpha = 0.7f)
                )
                Text(
                    "${viewModel.currentBalance} €",
                    style = MaterialTheme.typography.headlineLarge.copy(
                        fontWeight = FontWeight.Black,
                        color = Gold
                    )
                )
            }
        }
    }
}
