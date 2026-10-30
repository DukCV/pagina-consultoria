---
name: handoff
description: Deja un resumen de continuidad en .claude/docs/DECISIONS.md (decisiones, pendientes, registro) para retomar el trabajo tras compactar o en otra sesión. Solo manual; invócala con /handoff al terminar un bloque grande.
disable-model-invocation: true
---

# Resumen de continuidad

Objetivo: que la próxima sesión no tenga que re-explorar. Sé breve y factual.

1. Revisa lo hecho en esta sesión (`git status`, `git diff --stat` y la conversación). No releas archivos completos.
2. Edita `.claude/docs/DECISIONS.md`:
   - **Decisiones técnicas:** una fila por decisión que no se deduzca del código (qué + por qué + dónde).
   - **Pendientes:** lista actualizada (marca como hechos y bórralos; añade bloqueos, comandos o datos necesarios para retomar).
   - **Registro de cambios:** una línea con fecha (`AAAA-MM-DD`), qué cambió y qué se verificó.
3. Si añadiste módulos reutilizables, anótalos en `.claude/docs/COMPONENTS.md`.
4. Corrige o elimina entradas que ya no sean ciertas; no acumules historial.
5. Responde con 3–6 líneas: qué quedó hecho, qué falta y el primer paso para retomar. No inventes resultados: indica lo que no se verificó.

Cuándo compactar: al cambiar de tarea, tras cerrar un bloque grande o cuando el contexto se llene de salidas de comandos. Tras compactar, lee solo `DECISIONS.md` y los archivos del siguiente paso.
