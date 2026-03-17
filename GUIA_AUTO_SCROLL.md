# 🎯 Guía Rápida: Auto-Scroll en Tu Proyecto

## ¿Qué Se Implementó?

Un sistema que **automáticamente** guarda y restaura tu posición en la lista de productos cuando navegas hacia un producto específico y regresas.

## Flujo Visual

```
┌─────────────────────────┐
│   LISTA DE PRODUCTOS    │
│  [Cerezas]  ← TÚ ESTÁS  │
│  [Brevas]               │
│  [Manzanas]             │
└─────────────────────────┘
          ↓
    (Haces click)
          ↓
┌─────────────────────────┐
│  DETALLES DE CEREZAS    │
│  Registros de producción│
│  Registros de embalaje  │
│  [Volver] ← Haces click │
└─────────────────────────┘
          ↓
    (Se guarda tu posición)
          ↓
┌─────────────────────────┐
│   LISTA DE PRODUCTOS    │
│  [Cerezas]  ← ¡VUELVES! │
│  [Brevas]               │
│  [Manzanas]             │
└─────────────────────────┘
   ✨ En la misma posición
```

## Archivos Modificados

```
src/
├── hooks/
│   └── useScrollRestoration.ts      ← NUEVO HOOK
├── components/supervisores/
│   └── product-list.tsx             ← ACTUALIZADO
└── app/
    ├── supervisores/[type]/[id]/page.tsx
    │   └── ACTUALIZADO
    └── dashboard/supervisores/
        ├── product/[id]/records/page.tsx
        │   └── ACTUALIZADO
        └── embalaje-record/[id]/page.tsx
            └── ACTUALIZADO
```

## Cómo Funciona Internamente

### Paso 1: Cuando Haces Click en Un Producto
- La lista desaparece
- Tu posición de scroll se guarda automáticamente en memoria del navegador

### Paso 2: Cuando Haces Click "Volver"
- Se ejecuta `saveScrollPosition(productId)`
- Guarda Y del scroll + ID del producto en `sessionStorage`

### Paso 3: Cuando Regresas a La Lista
- Se ejecuta `restoreScrollPosition()`
- Lee los datos guardados
- Restaura el scroll automáticamente
- ¡Vuelves exactamente donde estabas!

## Detalles Técnicos

### SessionStorage (Memoria Local Temporal)
```javascript
// Datos guardados
{
  'product-list-scroll-position': {
    scrollY: 1234,           // Píxeles desde el top
    productId: 'prod_001',   // Producto que viste
    timestamp: 1708775400000 // Cuándo se guardó
  }
}
```

### Validaciones
- ✅ Verifica que sessionStorage esté disponible
- ✅ Valida que los datos sean válidos JSON
- ✅ Descarta datos más antiguos de 7 días
- ✅ Funciona incluso si hay errores

## Casos de Uso Cubiertos

| Caso | Funciona? | Detalles |
|------|-----------|----------|
| Ir y volver una vez | ✅ | Flujo básico completo |
| Ir y volver múltiples veces | ✅ | Cada vez restaura la posición |
| Búsqueda + ir y volver | ✅ | Mantiene el contexto de búsqueda |
| Abrir en pestaña nueva | ✅ | No afecta la otra pestaña |
| Cambiar de navegador | ❌ | sessionStorage es local al navegador |
| Recargar página | ✅ | La posición se mantiene |

## Mejoras Futuras Opcionales

Si en el futuro quieres mejorar aún más, puedes:

### 1. Persistencia Entre Sesiones
```typescript
// Cambiar de sessionStorage a localStorage
localStorage.setItem('product-list-scroll-position', JSON.stringify(state));
```

### 2. Historial Completo
```typescript
// Guardar un historial de múltiples posiciones
const history = [
  { scrollY: 100, productId: 'prod1' },
  { scrollY: 500, productId: 'prod2' },
  // ... más
];
```

### 3. Sincronización Multi-Pestaña
```typescript
// Usar StorageEvent para sincronizar entre pestañas
window.addEventListener('storage', (e) => {
  if (e.key === 'product-list-scroll-position') {
    restoreScrollPosition();
  }
});
```

## Testing Local

Para verificar que funciona:

1. **Abre DevTools** (F12)
2. **Ve a Application → Session Storage**
3. **Navega:** Lista → Producto → Vuelve
4. **Verifica:** La clave `product-list-scroll-position` se guarda y se restaura

## Troubleshooting

| Problema | Solución |
|----------|----------|
| No restaura scroll | Verifica que sessionStorage no esté bloqueado |
| Datos no se guardan | Comprueba permisos del navegador |
| Restaura mal | Intenta limpiar cache (Ctrl+Shift+Del) |
| Lento en algunos casos | El delay de 150ms es configurable |

## Notas de Desarrollo

- 🔒 **Seguro:** Los datos se borran al cerrar navegador
- 📱 **Responsive:** Funciona en mobile y desktop
- ⚡ **Eficiente:** Sin llamadas a API extras
- 🧹 **Limpio:** Se auto-limpia después de una semana

---

**¿Preguntas?** El código está completamente comentado en `src/hooks/useScrollRestoration.ts`
