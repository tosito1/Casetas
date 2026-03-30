package com.toust.casetas.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.toust.casetas.ui.screens.AuthScreen
import com.toust.casetas.ui.screens.DashboardScreen

import com.toust.casetas.ui.screens.MainHomeScreen
import com.toust.casetas.ui.screens.InteractiveMapScreen

@Composable
fun AppNavigation(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Screen.Auth.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Auth.route) {
            AuthScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Auth.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.Home.route) {
            MainHomeScreen(
                onOpenMap = { navController.navigate(Screen.InteractiveMap.route) },
                onOpenBooth = { id -> navController.navigate(Screen.BoothDashboard.createRoute(id)) },
                onOpenProfile = { navController.navigate(Screen.Profile.route) },
                onLogout = {
                    navController.navigate(Screen.Auth.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Profile.route) {
            // Need a way to get Socio here. For now I'll use a specific ViewModel or common one.
            // I'll make ProfileScreen fetch its own data if it's standalone, 
            // or I'll use a Shared ViewModel.
            // For now, I'll navigate to Dashboard tab 4 for the user's booth if they have one.
            // Or I'll create a StandaloneProfileScreen.
            // Actually, I'll navigate to Dashboard with tab 4.
            DashboardScreen(
                initialBoothId = "", // uses default profile booth
                initialTab = 4,
                onLoggedOut = {
                    navController.navigate(Screen.Auth.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.InteractiveMap.route) {
            InteractiveMapScreen(
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.BoothDashboard.route) { backStackEntry ->
            val boothId = backStackEntry.arguments?.getString("boothId") ?: ""
            DashboardScreen(
                initialBoothId = boothId,
                onLoggedOut = {
                    navController.navigate(Screen.Auth.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }
    }
}

