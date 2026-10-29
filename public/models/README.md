# Modelos 3D de Overlayer (`public/models`)

Vite sirve esta carpeta tal cual desde `/models/...`. Todo lo que hay aquí **se publica**, así que solo
debe contener lo que el navegador realmente carga.

## Estructura

| Carpeta | Contenido | ¿Se carga? |
| --- | --- | --- |
| `overlayer-optimized/` | GLB listos para el visor WebGL2 (`meta-quest-3.glb`, `ai-character-overlayer.glb`). | Sí (bajo demanda) |
| `renders-2d/` | Alternativa 2D de cada modelo: WebP de 360 / 720 / 1080 px y un PNG de respaldo. | Sí |
| `oculus-quest-3/`, `Mannequin Character/` | Modelos fuente originales (OBJ/FBX/GLB). | **No** |

Los GLB originales previos a la optimización están en `models-source/` (en la raíz del proyecto, fuera
de `public/` para que no viajen en el despliegue).

> Las carpetas fuente `oculus-quest-3/` y `Mannequin Character/` (~17 MB) no las usa el runtime y se
> incluyen en cada build. Conviene moverlas fuera de `public/` (por ejemplo a `models-source/`).

## Cómo se decide entre 3D y 2D

El hero elige un nivel de calidad (`src/hooks/useGraphicsGovernor.js`):

1. **Capacidades reales** (`src/engine3d/graphicsCapabilities.js`): WebGL2 disponible, que no sea render
   por software, límite de texturas y red (ahorro de datos / 2G → 2D). Nunca se decide por «móvil o escritorio».
2. **Rendimiento medido**: si los fotogramas son lentos de forma sostenida baja un nivel
   (`full` → `balanced` → `static`). A `static` los modelos se sustituyen por los renders 2D.
3. **Fallos**: error de inicialización del motor → 2D global; contexto perdido → un nivel menos; fallo al
   descargar un modelo → solo ese modelo usa su render 2D.
4. `prefers-reduced-motion` siempre fuerza `static`.

Para QA o soporte, el parámetro `?ov-quality=` fija el nivel:
`full`, `balanced` o `static` (sin adaptación automática) y `adaptive` (arranca en `full`, ignora el
veredicto de capacidades y mantiene la degradación automática). El nivel vigente y su motivo están en
los atributos `data-ov-quality` y `data-ov-quality-reason` del elemento `.ov-hero`.

## Regenerar los activos

Las herramientas están en `tools/` y sus dependencias **no** forman parte del proyecto
(`npm i --no-save …`, ver la cabecera de cada script).

```bash
# 1. Optimizar un GLB (simplificación guiada por atributos + texturas a 512 px)
node tools/optimize-models.mjs models-source/overlayer-optimized-originals/meta-quest-3.glb \
  public/models/overlayer-optimized/meta-quest-3.glb --tex 512 \
  --plan '{"Quest3_Headset":{"ratio":0.25,"error":0.002},"Quest3_Controller":{"ratio":0.5,"error":0.0012}}'

# 2. Regenerar los renders 2D con el propio motor (pose de reposo y mismo encuadre que el canvas)
npm run dev                        # en otra terminal
node tools/render-posters.mjs --url http://localhost:5173
```

Tras regenerar los GLB o los renders, incrementa `MODELS_ASSET_VERSION` en
`src/constants/modelAssets.js` para invalidar la caché HTTP.

## Formatos

- **`.glb`** glTF 2.0 plano: el motor propio no implementa Draco, Meshopt ni cuantización.
- Texturas embebidas a 512 px como máximo (JPEG para color, PNG para mapas con canal alfa o datos).
