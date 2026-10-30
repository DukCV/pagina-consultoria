---
paths:
  - "src/**/*.{js,jsx}"
---

# Frontend (React 19 + Vite)

- Componentes función con `export default`; hooks `useX` en `src/hooks/` (o junto al componente si solo él los usa, como `useScenePreloader`).
- Textos, listas y parámetros viven en `src/constants/` (patrón de `heroServicesData.js`, `modelAssets.js`); el JSX solo los pinta.
- Valor que cambia por fotograma o por scroll/puntero: escribe en refs o variables CSS (`style.setProperty`), como `useSpatialParallax`; `useState` solo para cambios discretos.
- Carga diferida con `lazy`/`Suspense` y un marcador de las mismas dimensiones (ver `sceneRegistry.js`, `HeroSceneViewport.jsx`); un fallo de chunk se reintenta una vez.
- El estado compartido de calidad gráfica se consume con `useGraphicsQuality()`; no recalcules capacidades ni crees otro monitor de fps.
- Enlaces internos: usa `followSectionLink` para que el header resalte la sección aunque aún no exista.
- Efectos con limpieza completa (listeners, rAF, observers, timers, contextos WebGL); `StrictMode` está activo.
- No introduzcas librerías de animación/3D: el proyecto resuelve movimiento con CSS, rAF y el motor propio.
- Lint: `npm run lint`. `react/rules-of-hooks` es error; `only-export-components` es aviso.
