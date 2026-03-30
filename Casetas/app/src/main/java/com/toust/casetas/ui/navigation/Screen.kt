package com.toust.casetas.ui.navigation

sealed class Screen(val route: String) {
    object Auth : Screen("auth")
    object Home : Screen("home")
    object InteractiveMap : Screen("map")
    object BoothDashboard : Screen("booth/{boothId}") {
        fun createRoute(boothId: String) = "booth/$boothId"
    }
    object Profile : Screen("profile")
}
