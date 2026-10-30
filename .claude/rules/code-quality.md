---
paths:
  - "src/**/*.{js,jsx}"
---

# Clean Code y SOLID (según se aplica en este repo)

- **Responsabilidad única:** un archivo, una razón de cambio. Separa dato (`constants/`), lógica pura (`engine3d/`, funciones sin DOM), efecto/estado (`hooks/`) y presentación (`components/`).
- **Abierto/cerrado por datos:** añadir un servicio, escena o modelo = añadir una entrada a `HERO_SERVICES`, `SCENE_REGISTRY` o `MODEL_ASSETS`, no tocar condicionales (ver `sceneRegistry.js`).
- **Dependencias hacia abstracciones:** los componentes consumen contexto (`useGraphicsQuality`) y hooks; no leen `navigator`/`window` dispersos si ya existe un módulo que lo encapsula (`graphicsCapabilities.js`).
- **Nombres que explican el porqué;** constantes con nombre en lugar de números mágicos (`RETRY_DELAY_MS`, `SHADER_COMPILE_TIMEOUT_MS`). Comentarios en español solo para intención y decisiones no obvias.
- Funciones cortas; sin duplicar lógica (busca antes de crear); sin código muerto ni `console.log` residual.
- Efectos y listeners con limpieza; sin `any` implícitos ni estado derivado guardado (derívalo).
- Seguridad frontend: no uses `dangerouslySetInnerHTML` con contenido no controlado, no incluyas secretos ni claves en el repo, valida URLs externas y atributos `rel` en enlaces `target="_blank"`.
- Refactor solo si lo pide la tarea; cambios mínimos y reversibles.
