package com.toust.casetas.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.toust.casetas.ui.components.GlassmorphismCard
import com.toust.casetas.ui.theme.BgPrimary
import com.toust.casetas.ui.theme.Gold
import com.toust.casetas.ui.theme.GoldLight
import com.toust.casetas.ui.theme.TextPrimary
import com.toust.casetas.ui.viewmodel.AuthViewModel

import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import com.toust.casetas.R
import androidx.credentials.*
import androidx.credentials.exceptions.*
import com.google.android.libraries.identity.googleid.*
import kotlinx.coroutines.launch
import androidx.compose.ui.platform.LocalContext
import android.app.Activity
import androidx.compose.foundation.BorderStroke
import androidx.compose.material.icons.filled.AccountCircle
import com.google.android.libraries.identity.googleid.GetGoogleIdOption

@Composable
fun AuthScreen(
    viewModel: AuthViewModel = viewModel(),
    onLoginSuccess: () -> Unit
) {
    var passwordVisible by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(BgPrimary, Color(0xFF0F0F1A))
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
        ) {
            Image(
                painter = painterResource(id = R.drawable.app_icon),
                contentDescription = "App Icon",
                modifier = Modifier
                    .size(120.dp)
                    .padding(bottom = 24.dp)
            )

            Text(
                text = "MI CASETA",
                style = MaterialTheme.typography.headlineLarge.copy(
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 4.sp,
                    color = Gold
                )
            )

            Text(
                text = "EL REAL EN TU MANO",
                style = MaterialTheme.typography.labelMedium.copy(
                    letterSpacing = 2.sp,
                    color = GoldLight.copy(alpha = 0.7f)
                ),
                modifier = Modifier.padding(bottom = 40.dp)
            )

            GlassmorphismCard(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "BIENVENIDO",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        ),
                        modifier = Modifier.padding(bottom = 24.dp)
                    )

                    OutlinedTextField(
                        value = viewModel.email,
                        onValueChange = { viewModel.email = it },
                        label = { Text("Email") },
                        modifier = Modifier.fillMaxWidth(),
                        leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = Gold) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Gold,
                            unfocusedBorderColor = Color.White.copy(alpha = 0.2f),
                            focusedLabelColor = Gold
                        ),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = viewModel.password,
                        onValueChange = { viewModel.password = it },
                        label = { Text("Contraseña") },
                        modifier = Modifier.fillMaxWidth(),
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = Gold) },
                        trailingIcon = {
                            val image = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(image, contentDescription = null, tint = Gold.copy(alpha = 0.5f))
                            }
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Gold,
                            unfocusedBorderColor = Color.White.copy(alpha = 0.2f),
                            focusedLabelColor = Gold
                        ),
                        singleLine = true,
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
                    )

                    if (viewModel.errorMessage != null) {
                        Text(
                            text = viewModel.errorMessage!!,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(32.dp))

                    Button(
                        onClick = { viewModel.login(onLoginSuccess) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Gold,
                            contentColor = Color.Black
                        ),
                        shape = MaterialTheme.shapes.medium,
                        enabled = !viewModel.isLoading
                    ) {
                        if (viewModel.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = Color.Black,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                "ACCEDER",
                                style = MaterialTheme.typography.labelLarge.copy(
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = 1.sp
                                )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    ) {
                        Divider(modifier = Modifier.weight(1f), color = Color.White.copy(alpha = 0.1f))
                        Text(
                            " O ", 
                            style = MaterialTheme.typography.bodySmall, 
                            color = Color.White.copy(alpha = 0.3f),
                            modifier = Modifier.padding(horizontal = 8.dp)
                        )
                        Divider(modifier = Modifier.weight(1f), color = Color.White.copy(alpha = 0.1f))
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    val context = LocalContext.current
                    val scope = rememberCoroutineScope()

                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        // Google Button
                        Button(
                            onClick = {
                                scope.launch {
                                    try {
                                        val credentialManager = CredentialManager.create(context)
                                        val googleIdOption = GetGoogleIdOption.Builder()
                                            .setFilterByAuthorizedAccounts(false)
                                            .setServerClientId("318530134361-r5mrm2445vpniq6fclvme07is9dkqbkn.apps.googleusercontent.com")
                                            .build()

                                        val request = GetCredentialRequest.Builder()
                                            .addCredentialOption(googleIdOption)
                                            .build()

                                        val result = credentialManager.getCredential(
                                            context = context,
                                            request = request
                                        )
                                        
                                        val credential = result.credential
                                        if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                                            val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                                            val firebaseCredential = com.google.firebase.auth.GoogleAuthProvider.getCredential(googleIdTokenCredential.idToken, null)
                                            viewModel.loginWithCredential(firebaseCredential, onLoginSuccess)
                                        }
                                    } catch (e: Exception) {
                                        val detailedError = when(e) {
                                            is GetCredentialException -> "Error Credencial [${e.type}]: ${e.message}"
                                            else -> "Error con Google (${e.javaClass.simpleName}): ${e.message}"
                                        }
                                        viewModel.errorMessage = detailedError
                                        android.util.Log.e("AuthScreen", "Google Login Fail", e)
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(54.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
                            shape = MaterialTheme.shapes.medium,
                            elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
                        ) {
                            Image(
                                painter = painterResource(id = R.drawable.ic_google_logo),
                                contentDescription = null,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(Modifier.width(12.dp))
                            Text("Continuar con Google", style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold))
                        }

                        // Apple Button
                        Button(
                            onClick = {
                                scope.launch {
                                    try {
                                        val credentialManager = CredentialManager.create(context)
                                        // Apple logic is usually handled via OAuthProvider in Firebase for better cross-platform
                                        val provider = com.google.firebase.auth.OAuthProvider.newBuilder("apple.com")
                                        val auth = com.google.firebase.auth.FirebaseAuth.getInstance()
                                        
                                        auth.startActivityForSignInWithProvider(context as Activity, provider.build())
                                            .addOnSuccessListener { result ->
                                                viewModel.loginWithCredential(result.credential!!, onLoginSuccess)
                                            }
                                            .addOnFailureListener {
                                                viewModel.errorMessage = "Error con Apple: ${it.message}"
                                            }
                                    } catch (e: Exception) {
                                        viewModel.errorMessage = "Apple Login Fail [${e.javaClass.simpleName}]: ${e.message}"
                                        android.util.Log.e("AuthScreen", "Apple Login Fail", e)
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(54.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Black, contentColor = Color.White),
                            shape = MaterialTheme.shapes.medium,
                            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                            elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
                        ) {
                            Image(
                                painter = painterResource(id = R.drawable.ic_apple_logo),
                                contentDescription = null,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(Modifier.width(12.dp))
                            Text("Continuar con Apple", style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold))
                        }
                    }
                }
            }
        }
    }
}
