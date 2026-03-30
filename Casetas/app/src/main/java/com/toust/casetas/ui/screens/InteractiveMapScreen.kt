package com.toust.casetas.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import kotlinx.coroutines.launch
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.*
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.drawscope.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.toust.casetas.data.model.Caseta
import com.toust.casetas.ui.theme.*
import com.toust.casetas.ui.viewmodel.CasetaListViewModel

// --- DATA MODELS ---
data class MapElement(val id: Any, val x: Float, val y: Float, val w: Float, val h: Float, val special: String? = null)
data class SimpleRect(val x: Float, val y: Float, val w: Float, val h: Float, val label: String? = null)
data class Puerta(val id: String, val name: String, val lat: Double, val lng: Double)

interface MapConfig {
    val rotondaCenter: Offset
    val rotondaRadius: Float
    val bounds: MapBounds
    val greenAreas: List<SimpleRect>
    val roads: List<SimpleRect>
    val boothDefinitions: List<MapElement>
    val municipal: SimpleRect?
    val servicios: List<SimpleRect>
    val puertas: List<Puerta>
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InteractiveMapScreen(
    viewModel: CasetaListViewModel = viewModel(),
    userId: String = "",
    onBack: () -> Unit
) {
    BackHandler { onBack() }
    
    val casetas by viewModel.casetas.collectAsState()
    val liveUsers by viewModel.liveUsers.collectAsState()
    var selectedEvent by remember { mutableStateOf("feria") }
    
    val animatedScale = remember { Animatable(0.6f) }
    val animatedMapOffset = remember { Animatable(Offset.Zero, Offset.VectorConverter) }
    var searchQuery by remember { mutableStateOf("") }
    var visibleTypes by remember { mutableStateOf(setOf("Privada", "Publica", "Peña")) }
    var initialCentered by remember { mutableStateOf(false) }
    var showOutsideUsers by remember { mutableStateOf(false) }

    val config: MapConfig = if (selectedEvent == "feria") FeriaConfig else SanJuanConfig
    val scope = rememberCoroutineScope()
    
    // Pulse animation for radar
    val infiniteTransition = rememberInfiniteTransition(label = "RadarPulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulse"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "alpha"
    )

    // Animate map when event changes
    LaunchedEffect(selectedEvent) {
        initialCentered = false
        // You can adjust animation spec as needed
        animatedScale.animateTo(0.8f, animationSpec = tween(500))
        animatedMapOffset.animateTo(Offset.Zero, animationSpec = tween(500))
    }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFF1E1E24), Color(0xFF0A0A0F)),
                    radius = 2500f
                )
            )
    ) {
        val screenWidth = constraints.maxWidth.toFloat()
        val screenHeight = constraints.maxHeight.toFloat()
        
        // Initial auto-centering
        if (!initialCentered && screenWidth > 0) {
            val mapW = 1200f
            val mapH = 950f
            val targetScale = (screenWidth / mapW).coerceAtMost(screenHeight / mapH) * 0.85f
            val targetOffset = Offset(
                (screenWidth - mapW * targetScale) / 2f,
                (screenHeight - mapH * targetScale) / 2f
            )
            LaunchedEffect(Unit) {
                animatedScale.animateTo(targetScale, animationSpec = tween(800))
                animatedMapOffset.animateTo(targetOffset, animationSpec = tween(800))
                initialCentered = true
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(Unit) {
                    detectTransformGestures { _, pan, zoom, _ ->
                        val currentScale = animatedScale.value
                        val currentOffset = animatedMapOffset.value
                        val newScale = (currentScale * zoom).coerceIn(0.5f, 5f)
                        val newOffset = currentOffset + pan

                        // Update Animatable values directly without animation during gesture
                        // This allows for immediate visual feedback during interaction
                        if (animatedScale.value != newScale) scope.launch { animatedScale.snapTo(newScale) }
                        if (animatedMapOffset.value != newOffset) scope.launch { animatedMapOffset.snapTo(newOffset) }
                    }
                }
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                withTransform({
                    translate(animatedMapOffset.value.x, animatedMapOffset.value.y)
                    scale(animatedScale.value, animatedScale.value, pivot = Offset.Zero)
                }) {
                    drawRect(Color(0xFFF8F9FA), size = Size(2000f, 2000f), topLeft = Offset(-500f, -500f))

                    config.greenAreas.forEach { area ->
                        drawRoundRect(
                            color = Color(0xFFF0F7F0),
                            topLeft = Offset(area.x, area.y),
                            size = Size(area.w, area.h),
                            cornerRadius = CornerRadius(10f)
                        )
                    }

                    config.roads.forEach { road ->
                        drawRoundRect(
                            color = Color(0xFFF2E3B6),
                            topLeft = Offset(road.x, road.y),
                            size = Size(road.w, road.h),
                            cornerRadius = CornerRadius(4f)
                        )
                    }

                    drawCircle(
                        color = Color(0xFFEFF6FF),
                        center = config.rotondaCenter,
                        radius = config.rotondaRadius,
                        style = androidx.compose.ui.graphics.drawscope.Fill
                    )
                    drawCircle(
                        color = Color(0xFF3B82F6),
                        center = config.rotondaCenter,
                        radius = config.rotondaRadius,
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2f)
                    )
                    config.boothDefinitions.forEach { def ->
                        val realCaseta = casetas.find { it.numero == def.id.toString() }
                        val isVisible = when (realCaseta?.clase ?: "Privada") {
                            "Publica" -> visibleTypes.contains("Publica")
                            "Peña" -> visibleTypes.contains("Peña")
                            else -> visibleTypes.contains("Privada")
                        }
                        if (!isVisible && def.id.toString() != searchQuery) return@forEach
                        
                        val baseColor = if (realCaseta != null && realCaseta.color.isNotEmpty()) {
                            try { Color(android.graphics.Color.parseColor(realCaseta.color)) } catch(e: Exception) { 
                                when(realCaseta.clase) {
                                    "Publica" -> Color(0xFFBB242B)
                                    "Peña" -> Color(0xFFD4AF37)
                                    else -> Color(0xFF004724)
                                }
                            }
                        } else {
                            when(def.special) {
                                "CruzRoja" -> Color(0xFFEF4444)
                                else -> Color(0xFF004724)
                            }
                        }
                        
                        // --- 3D Depth Shadow ---
                        drawRect(
                            color = Color.Black.copy(0.12f),
                            topLeft = Offset(def.x + 2f, def.y + 2f),
                            size = Size(def.w, def.h)
                        )

                        // Draw patterned roof
                        drawRect(
                            color = baseColor,
                            topLeft = Offset(def.x, def.y),
                            size = Size(def.w, def.h)
                        )
                        
                        // Diagonal stripes
                        val step = 4f
                        for (i in 0..(def.w + def.h).toInt() step step.toInt()) {
                            drawLine(
                                color = Color.White.copy(0.15f),
                                start = Offset((def.x + i).coerceIn(def.x, def.x + def.w), def.y),
                                end = Offset(def.x, (def.y + i).coerceIn(def.y, def.y + def.h)),
                                strokeWidth = 1f
                            )
                        }

                        // Border and Shadow
                        drawRect(
                            color = Color.Black.copy(0.3f),
                            topLeft = Offset(def.x, def.y),
                            size = Size(def.w, def.h),
                            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1f)
                        )

                        // 3D Roof Ridges
                        drawContext.canvas.nativeCanvas.apply {
                            val path = android.graphics.Path().apply {
                                moveTo(def.x, def.y)
                                lineTo(def.x + def.w / 2f, def.y - 3f)
                                lineTo(def.x + def.w, def.y)
                            }
                            val paint = android.graphics.Paint().apply {
                                color = android.graphics.Color.argb(60, 255, 255, 255)
                                style = android.graphics.Paint.Style.STROKE
                                strokeWidth = 1f
                            }
                            drawPath(path, paint)
                        }

                        if (animatedScale.value > 1.2f) {
                            val isMyBooth = realCaseta?.id != null && realCaseta.id == liveUsers.find { it.id == userId }?.boothId
                            val label = if (def.special == "CruzRoja") "+" else (realCaseta?.nombre?.take(8) ?: def.id.toString())
                            drawContext.canvas.nativeCanvas.apply {
                                val paint = android.graphics.Paint().apply {
                                    color = if (def.special == "CruzRoja") android.graphics.Color.RED else android.graphics.Color.WHITE
                                    textSize = (if (def.special == "CruzRoja") 14f else 7f) * animatedScale.value
                                    textAlign = android.graphics.Paint.Align.CENTER
                                    typeface = android.graphics.Typeface.DEFAULT_BOLD
                                }
                                drawText(label, def.x + def.w / 2, def.y + def.h / 2 + 3f * animatedScale.value, paint)
                                
                                if (isMyBooth) {
                                    val myBoothPaint = android.graphics.Paint().apply {
                                        color = 0xFFD4AF37.toInt()
                                        textSize = 10f * animatedScale.value
                                        textAlign = android.graphics.Paint.Align.CENTER
                                        typeface = android.graphics.Typeface.DEFAULT_BOLD
                                        setShadowLayer(4f, 0f, 0f, android.graphics.Color.BLACK)
                                    }
                                    drawText("TU CASETA", def.x + def.w/2, def.y - 8f * animatedScale.value, myBoothPaint)
                                }
                            }
                        }
                    }

                    // --- 4.5. Municipal Area ---
                    config.municipal?.let { m ->
                        // Subtle shadow for the area
                        drawRoundRect(
                            color = Color.Black.copy(0.1f),
                            topLeft = Offset(m.x + 2f, m.y + 2f),
                            size = Size(m.w, m.h),
                            cornerRadius = CornerRadius(4f)
                        )
                        drawRoundRect(
                            brush = Brush.verticalGradient(listOf(Color(0xFFF0F7FF), Color(0xFFEFF6FF))),
                            topLeft = Offset(m.x, m.y),
                            size = Size(m.w, m.h),
                            cornerRadius = CornerRadius(4f)
                        )
                        drawRoundRect(
                            color = Color(0xFF3B82F6).copy(0.8f),
                            topLeft = Offset(m.x, m.y),
                            size = Size(m.w, m.h),
                            cornerRadius = CornerRadius(4f),
                            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3f)
                        )
                        drawContext.canvas.nativeCanvas.apply {
                            val paint = android.graphics.Paint().apply {
                                color = 0xFF1D4ED8.toInt()
                                textSize = 14f * animatedScale.value
                                textAlign = android.graphics.Paint.Align.CENTER
                                typeface = android.graphics.Typeface.create("sans-serif-condensed", android.graphics.Typeface.BOLD)
                            }
                            drawText("CASETA", m.x + m.w/2, m.y + m.h/2 - 2f * animatedScale.value, paint)
                            drawText("MUNICIPAL", m.x + m.w/2, m.y + m.h/2 + 12f * animatedScale.value, paint)
                        }
                    }

                    // 4.6. Servicios (WC)
                    config.servicios.forEach { s ->
                        drawRoundRect(
                            color = Color(0xFFFEF3C7),
                            topLeft = Offset(s.x, s.y),
                            size = Size(s.w, s.h),
                            cornerRadius = CornerRadius(4f)
                        )
                        drawRoundRect(
                            color = Color(0xFFB45309),
                            topLeft = Offset(s.x, s.y),
                            size = Size(s.w, s.h),
                            cornerRadius = CornerRadius(4f),
                            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2f)
                        )
                        drawContext.canvas.nativeCanvas.apply {
                            val paint = android.graphics.Paint().apply {
                                color = 0xFF92400E.toInt()
                                textSize = 10f * animatedScale.value
                                textAlign = android.graphics.Paint.Align.CENTER
                                typeface = android.graphics.Typeface.DEFAULT_BOLD
                            }
                            drawText(s.label ?: "WC", s.x + s.w/2, s.y + s.h/2 + 4f * animatedScale.value, paint)
                        }
                    }

                    // 4.7. Puertas
                    config.puertas.forEach { p ->
                        val pos = gpsToPixel(p.lat, p.lng, config.bounds)
                        val isLateral = p.id == "p_lat"
                        
                        drawRoundRect(
                            color = Color(0xFFEAB308),
                            topLeft = Offset(if (isLateral) pos.x + 15f else pos.x - 40f, if (isLateral) pos.y - 10f else pos.y + 5f),
                            size = Size(80f, 20f),
                            cornerRadius = CornerRadius(10f)
                        )
                        drawContext.canvas.nativeCanvas.apply {
                            val paint = android.graphics.Paint().apply {
                                color = android.graphics.Color.WHITE
                                textSize = 8f * animatedScale.value
                                textAlign = android.graphics.Paint.Align.CENTER
                                typeface = android.graphics.Typeface.DEFAULT_BOLD
                            }
                            drawText(p.name, if (isLateral) pos.x + 55f else pos.x, if (isLateral) pos.y + 1f else pos.y + 16f, paint)
                        }
                    }

                    // 5. LIVE RADAR (SOCIOS)
                    liveUsers.forEach { user ->
                        if (user.isOutside) return@forEach
                        val pos = gpsToPixel(user.lat, user.lng, config.bounds)
                        val isMe = user.id == userId
                        val dotColor = if (isMe) Gold else Color(0xFF00E5FF)

                        // Pulse Effect
                        drawCircle(
                            color = dotColor.copy(alpha = pulseAlpha), 
                            radius = 12f * pulseScale * animatedScale.value.coerceAtLeast(1f), 
                            center = pos
                        )
                        
                        // Solid Outer Glow
                        drawCircle(
                            color = dotColor.copy(alpha = 0.3f), 
                            radius = 8f * animatedScale.value.coerceAtLeast(1f), 
                            center = pos
                        )
                        
                        drawCircle(color = Color.White, radius = 5f * animatedScale.value.coerceAtLeast(1f), center = pos)
                        drawCircle(color = dotColor, radius = 4f * animatedScale.value.coerceAtLeast(1f), center = pos)

                        if (animatedScale.value > 1.8f) {
                            val name = user.name.split(" ")[0].uppercase()
                            drawContext.canvas.nativeCanvas.apply {
                                val paint = android.graphics.Paint().apply {
                                    color = android.graphics.Color.WHITE
                                    textSize = 8f * animatedScale.value
                                    textAlign = android.graphics.Paint.Align.CENTER
                                    typeface = android.graphics.Typeface.create("sans-serif", android.graphics.Typeface.BOLD)
                                    setShadowLayer(2f, 0f, 0f, android.graphics.Color.BLACK)
                                }
                                val textWidth = paint.measureText(name)
                                val pillPadding = 4f * animatedScale.value
                                val pillRect = android.graphics.RectF(
                                    pos.x - textWidth/2 - pillPadding,
                                    pos.y - 20f * animatedScale.value,
                                    pos.x + textWidth/2 + pillPadding,
                                    pos.y - 8f * animatedScale.value
                                )
                                val bgPaint = android.graphics.Paint().apply {
                                    color = android.graphics.Color.argb(255, 18, 18, 18)
                                    style = android.graphics.Paint.Style.FILL
                                }
                                drawRoundRect(pillRect, 40f, 40f, bgPaint)
                                val borderPaint = android.graphics.Paint().apply {
                                    color = if (isMe) 0xFFD4AF37.toInt() else 0xFF00E5FF.toInt()
                                    style = android.graphics.Paint.Style.STROKE
                                    strokeWidth = 1.5f * animatedScale.value.coerceAtMost(2f)
                                }
                                drawRoundRect(pillRect, 40f, 40f, borderPaint)
                                drawText(name, pos.x, pos.y - 11f * animatedScale.value, paint)
                            }
                        }
                    }
                }
            }
        }

        Box(Modifier.fillMaxWidth().padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Surface(
                    onClick = onBack,
                    color = Color.Black.copy(0.6f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(0.1f)),
                    shape = androidx.compose.foundation.shape.CircleShape,
                    modifier = Modifier.size(48.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Close, contentDescription = null, tint = Gold, modifier = Modifier.size(24.dp))
                    }
                }
                
                com.toust.casetas.ui.components.GlassmorphismCard(
                    modifier = Modifier.weight(1f).height(48.dp)
                ) {
                    Row(Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Search, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        BasicTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            textStyle = androidx.compose.ui.text.TextStyle(color = TextPrimary, fontSize = 14.sp),
                            modifier = Modifier.fillMaxWidth(),
                            decorationBox = { innerTextField ->
                                if (searchQuery.isEmpty()) Text("Buscar caseta...", color = TextSecondary, fontSize = 14.sp)
                                innerTextField()
                            }
                        )
                    }
                }
            }
        }

        // --- TOP RIGHT HUD: OUTSIDE USERS ---
        val outsideUsers = liveUsers.filter { it.isOutside }
        if (outsideUsers.isNotEmpty()) {
            Box(Modifier.align(Alignment.TopEnd).padding(16.dp).padding(top = 64.dp)) {
                Column(horizontalAlignment = Alignment.End) {
                    Surface(
                        onClick = { showOutsideUsers = !showOutsideUsers },
                        color = Color.Black.copy(0.7f),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp),
                        modifier = Modifier.height(36.dp)
                    ) {
                        Row(Modifier.padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("🛰️ ${outsideUsers.size} fuera", color = Gold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.width(4.dp))
                            Icon(
                                if (showOutsideUsers) Icons.Default.ArrowDropUp else Icons.Default.ArrowDropDown,
                                contentDescription = null,
                                tint = Gold,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                    
                    if (showOutsideUsers) {
                        Spacer(Modifier.height(8.dp))
                        AnimatedVisibility(
                            visible = showOutsideUsers,
                            enter = fadeIn() + expandVertically(),
                            exit = fadeOut() + shrinkVertically()
                        ) {
                            com.toust.casetas.ui.components.GlassmorphismCard(
                                modifier = Modifier.width(180.dp)
                            ) {
                                Column(Modifier.padding(12.dp).heightIn(max = 200.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    outsideUsers.forEach { user ->
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Box(Modifier.size(6.dp).background(Gold, androidx.compose.foundation.shape.CircleShape))
                                            Text(user.name, color = TextPrimary, fontSize = 11.sp, maxLines = 1)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Column(Modifier.align(Alignment.BottomStart).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            com.toust.casetas.ui.components.GlassmorphismCard(
                modifier = Modifier.width(140.dp)
            ) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("FILTROS", style = MaterialTheme.typography.labelSmall, color = Gold, fontWeight = FontWeight.Bold)
                    Divider(color = Color.White.copy(0.1f), modifier = Modifier.padding(vertical = 4.dp))
                    FilterItem("Privadas", visibleTypes.contains("Privada"), Color(0xFF004724)) {
                        visibleTypes = if (it) visibleTypes + "Privada" else visibleTypes - "Privada"
                    }
                    FilterItem("Públicas", visibleTypes.contains("Publica"), Color(0xFFBB242B)) {
                        visibleTypes = if (it) visibleTypes + "Publica" else visibleTypes - "Publica"
                    }
                    FilterItem("Peñas", visibleTypes.contains("Peña"), Color(0xFFD4AF37)) {
                        visibleTypes = if (it) visibleTypes + "Peña" else visibleTypes - "Peña"
                    }
                }
            }
        }
        
        Column(Modifier.align(Alignment.BottomEnd).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Surface(
                onClick = { 
                    selectedEvent = if (selectedEvent == "feria") "sanjuan" else "feria"
                    // No need to reset scale/offset here, LaunchedEffect handles animation
                },
                color = Gold,
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                modifier = Modifier.height(40.dp).padding(horizontal = 4.dp)
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(horizontal = 16.dp)) {
                    Text(if (selectedEvent == "feria") "FERIA" else "SAN JUAN", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 12.sp)
                }
            }

            FloatingActionButton(onClick = { 
                val myUser = liveUsers.find { it.id == userId }
                myUser?.let {
                    val pos = gpsToPixel(it.lat, it.lng, config.bounds)
                    val screenW = screenWidth
                    val screenH = screenHeight
                    val targetScale = 2.5f
                    val targetOffset = Offset(
                        screenW / 2f - pos.x * targetScale,
                        screenH / 2f - pos.y * targetScale
                    )
                    scope.launch {
                        animatedScale.animateTo(targetScale, tween(800))
                        animatedMapOffset.animateTo(targetOffset, tween(800))
                    }
                }
            }, containerColor = Color.Black.copy(0.7f), contentColor = Gold, modifier = Modifier.size(48.dp)) {
                Icon(Icons.Default.MyLocation, contentDescription = null)
            }

            FloatingActionButton(onClick = { 
                // Animate zoom in
                val newScale = (animatedScale.value + 0.5f).coerceAtMost(5f)
                if (animatedScale.value != newScale) {
                    // Start an animation for the scale
                    scope.launch { animatedScale.animateTo(newScale, animationSpec = tween(300)) }
                }
            }, containerColor = Color.Black.copy(0.7f), contentColor = Gold, modifier = Modifier.size(48.dp)) {
                Icon(Icons.Default.Add, contentDescription = null)
            }
            FloatingActionButton(onClick = { 
                // Animate zoom out
                val newScale = (animatedScale.value - 0.5f).coerceAtLeast(0.5f)
                if (animatedScale.value != newScale) {
                    // Start an animation for the scale
                    scope.launch { animatedScale.animateTo(newScale, animationSpec = tween(300)) }
                }
            }, containerColor = Color.Black.copy(0.7f), contentColor = Gold, modifier = Modifier.size(48.dp)) {
                Icon(Icons.Default.Remove, contentDescription = null)
            }
        }
    }
}

@Composable
fun FilterItem(label: String, checked: Boolean, dotColor: Color, onToggle: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable { onToggle(!checked) },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(Modifier.size(8.dp).background(dotColor, androidx.compose.foundation.shape.CircleShape))
        Text(label, color = if (checked) TextPrimary else TextSecondary, fontSize = 10.sp, fontWeight = if (checked) FontWeight.Bold else FontWeight.Normal, modifier = Modifier.weight(1f))
        Checkbox(
            checked = checked,
            onCheckedChange = onToggle,
            colors = CheckboxDefaults.colors(checkedColor = Gold, uncheckedColor = Color.White.copy(0.3f), checkmarkColor = Color.Black),
            modifier = Modifier.scale(0.6f).size(20.dp)
        )
    }
}

fun gpsToPixel(lat: Double, lng: Double, bounds: MapBounds): Offset {
    val latRange = bounds.north - bounds.south
    val lngRange = bounds.east - bounds.west
    val x = ((lng - bounds.west) / lngRange) * 1200f
    val y = ((bounds.north - lat) / latRange) * 950f
    return Offset(x.toFloat(), y.toFloat())
}

data class MapBounds(val north: Double, val south: Double, val west: Double, val east: Double)

// --- CONFIGURATIONS (PORTED FROM JS) ---

object FeriaConfig : MapConfig {
    override val rotondaCenter = Offset(575f, 498f)
    override val rotondaRadius = 35f
    override val bounds = MapBounds(37.365800, 37.363600, -4.856200, -4.854400)
    override val greenAreas = listOf(
        SimpleRect(160f, -130f, 60f, 1000f),
        SimpleRect(235f, -70f, 285f, 900f),
        SimpleRect(640f, 120f, 350f, 440f),
        SimpleRect(595f, 510f, 70f, 300f),
        SimpleRect(675f, 740f, 300f, 80f)
    )
    override val roads = listOf(
        SimpleRect(215f, -180f, 30f, 1000f),
        SimpleRect(552.5f, -180f, 45f, 1000f),
        SimpleRect(930f, 135f, 40f, 700f),
        SimpleRect(170f, 815f, 800f, 30f),
        SimpleRect(208f, -90f, 406f, 25f),
        SimpleRect(552.5f, 480.5f, 487.5f, 35f),
        SimpleRect(970f, 480.5f, 70f, 35f),
        SimpleRect(614f, 30f, 316f, 25f),
        SimpleRect(614f, 173f, 316f, 25f),
        SimpleRect(614f, 274f, 316f, 25f),
        SimpleRect(245f, 30f, 315f, 25f),
        SimpleRect(245f, 150f, 315f, 25f),
        SimpleRect(245f, 270f, 315f, 25f)
    )
    override val boothDefinitions = mutableListOf<MapElement>().apply {
        // Blocks from San Juan Base (Filtered in JS, manual here)
        // 137-107 (Left side)
        for (i in 0..30) add(MapElement(137 - i, 170f, -120f + i * 30f, 38f, 26f))
        // Top right 40-36
        listOf(40, 39, 38, 37, 36).forEachIndexed { i, id -> add(MapElement(id, 700f + i * 45f, 135f, 43f, 38f)) }
        listOf(45, 44, 43, 42, 41).forEachIndexed { i, id -> add(MapElement(id, 700f + i * 45f, 198f, 43f, 38f)) }
        listOf(46, 47, 48, 49, 50).forEachIndexed { i, id -> add(MapElement(id, 700f + i * 45f, 236f, 43f, 38f)) }
        listOf(55, 54, 53, 52, 51).forEachIndexed { i, id -> add(MapElement(id, 700f + i * 45f, 342f, 43f, 38f)) }
        listOf("cr-feria", 56, 57, 58, 59, 60).forEachIndexed { i, id -> 
            add(MapElement(id, 655f + i * 45f, 380f, 43f, 38f, if(id == "cr-feria") "CruzRoja" else null)) 
        }
        listOf(61, 62, 63, 64, 65).forEachIndexed { i, id -> add(MapElement(id, 700f + i * 45f, 515.5f, 43f, 38f)) }
        listOf(66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77).forEachIndexed { i, id -> add(MapElement(id, 605f, 520f + i * (250f / 11f), 55f, 20f)) }
        listOf(78, 79, 80, 81, 82, 83).forEachIndexed { i, id -> add(MapElement(id, 685f + i * 40f, 775f, 38f, 32f)) }
        listOf(84, 85, 86, 87, 88, 89, 90, 91, 92).forEachIndexed { i, id -> add(MapElement(id, 472f, 550f + i * (225f / 8f), 38f, 23f)) }
        listOf(93, 94, 95, 96, 97, 98).forEachIndexed { i, id -> add(MapElement(id, 435f - i * 38f, 775f, 35f, 26f)) }
        for (i in 0..7) add(MapElement(106 - i, 245f, 605f + i * (170f / 7f), 38f, 22f))
        listOf(1, 2, 3, 4).forEachIndexed { i, id -> add(MapElement(id, 245f + i * 45f, -60f, 43f, 32f)) }
        listOf(8, 7, 6, 5).forEachIndexed { i, id -> add(MapElement(id, 245f + i * 45f, -28f, 43f, 32f)) }
        listOf(9, 10, 11, 12, 13).forEachIndexed { i, id -> add(MapElement(id, 245f + i * 45f, 55f, 43f, 32f)) }
        listOf(18, 17, 16, 15, 14).forEachIndexed { i, id -> add(MapElement(id, 245f + i * 45f, 87f, 43f, 32f)) }
        listOf(19, 20, 21, 22, 23).forEachIndexed { i, id -> add(MapElement(id, 245f + i * 45f, 175f, 43f, 32f)) }
        listOf(29, 28, 27, 26, 25, 24).forEachIndexed { i, id -> add(MapElement(id, 245f + i * 45f, 207f, 43f, 32f)) }
        listOf(30, 31, 32, 33, 34, 35).forEachIndexed { i, id -> add(MapElement(id, 245f + i * 45f, 295f, 43f, 32f)) }
    }
    override val municipal = SimpleRect(245f, 423f, 227f, 150f, "CASETA MUNICIPAL")
    override val servicios = listOf(
        SimpleRect(170f, -180f, 115f, 40f, "WC"),
        SimpleRect(245f, 578f, 80f, 22f, "WC")
    )
    override val puertas = listOf(
        Puerta("p_prin", "P. Principal", 37.363914, -4.855338),
        Puerta("p_1", "Puerta 1", 37.363914, -4.854776),
        Puerta("p_2", "Puerta 2", 37.363914, -4.855867),
        Puerta("p_lat", "P. Lateral", 37.364645, -4.854658)
    )
}

object SanJuanConfig : MapConfig {
    override val rotondaCenter = Offset(575f, 450f)
    override val rotondaRadius = 25f
    override val bounds = MapBounds(37.365800, 37.363600, -4.856200, -4.854400)
    override val greenAreas = listOf(
        SimpleRect(160f, -100f, 60f, 930f),
        SimpleRect(235f, 250f, 320f, 550f),
        SimpleRect(680f, 450f, 350f, 120f),
        SimpleRect(595f, 510f, 70f, 300f),
        SimpleRect(675f, 740f, 300f, 80f)
    )
    override val roads = listOf(
        SimpleRect(215f, -180f, 30f, 1000f),
        SimpleRect(560f, -180f, 30f, 1000f),
        SimpleRect(930f, 460f, 40f, 420f),
        SimpleRect(170f, 790f, 800f, 30f),
        SimpleRect(208f, -90f, 406f, 25f),
        SimpleRect(560f, 498f, 456f, 22f),
        SimpleRect(970f, 498f, 70f, 22f),
        SimpleRect(245f, 293f, 315f, 25f)
    )
    override val boothDefinitions = mutableListOf<MapElement>().apply {
        for (i in 0..26) add(MapElement(89 - i, 170f, -30f + i * 30f, 38f, 26f))
        add(MapElement(90, 170f, -60f, 38f, 26f))
        add(MapElement(91, 170f, -90f, 38f, 26f))
        listOf(55, 56, 57, 60, 61, 62).forEachIndexed { i, id -> add(MapElement(id, 245f, 570f + i * 28f, 38f, 26f)) }
        listOf(12, 11, 10, 9, 8, 7).forEachIndexed { i, id -> add(MapElement(id, 290f + i * 45f, 318f, 43f, 32f)) }
        listOf(1, 2, 3, 4, 5, 6).forEachIndexed { i, id -> add(MapElement(id, 290f + i * 45f, 261f, 43f, 32f)) }
        listOf(41, 42, 43, 44, 45, 46, 47, 48, 49).forEachIndexed { i, id -> add(MapElement(id, 514.5f, 550f + i * 25f, 38f, 23f)) }
        listOf(50, 51, 52, 53, 54).forEachIndexed { i, id -> add(MapElement(id, 476.5f - i * 46.3f, 760f, 38f, 26f)) }
        listOf(23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35).forEachIndexed { i, id -> add(MapElement(id, 640f, 550f + i * 16f, 43f, 16f)) }
        for (i in 0..4) add(MapElement(36 + i, 685f + i * 40f, 750f, 38f, 32f))
        listOf("cr-sanjuan", 13, 14, 15, 16, 17).forEachIndexed { i, id -> 
            add(MapElement(id, 700f + i * 38f, 460f, 35f, 38f, if(id == "cr-sanjuan") "CruzRoja" else null)) 
        }
        listOf(22, 21, 20, 19, 18).forEachIndexed { i, id -> add(MapElement(id, 700f + i * 45f, 520f, 43f, 38f)) }
    }
    override val municipal = SimpleRect(310f, 350f, 180f, 150f, "CASETA MUNICIPAL")
    override val servicios = listOf(
        SimpleRect(170f, -180f, 115f, 40f, "WC"),
        SimpleRect(360f, 520f, 80f, 35f, "WC")
    )
    override val puertas = listOf(
        Puerta("p_prin", "P. Principal", 37.363914, -4.855338),
        Puerta("p_1", "Puerta 1", 37.363914, -4.854776),
        Puerta("p_2", "Puerta 2", 37.363914, -4.855867),
        Puerta("p_lat", "P. Lateral", 37.364645, -4.854658)
    )
}