# People Pulse

PROMPT MAESTRO — FASE 1 DE 3
People & Culture Intelligence Hub

Quiero construir una aplicación web interna de People & Culture que funcione como un People Intelligence Hub.

IMPORTANTE: esta es únicamente la FASE 1 de 3. No construyas todavía funcionalidades de fases posteriores (Fase 2: sesiones 1:1 completas, entrevista semiestructurada, indicadores durante sesión, bienestar, bloqueos y notas. Fase 3: IA, cierre automático, compromisos, desarrollo, People Insights, alertas inteligentes e integraciones).

En esta primera fase construir y validar únicamente: arquitectura general, navegación, diseño visual, dashboard principal, gestión de colaboradores, ficha individual, indicadores, historial visual básico, formación, y la estructura de base de datos necesaria para soportar todo esto.

1. OBJETIVO GENERAL
La app debe permitir a People & Culture gestionar de forma centralizada: colaboradores, conversaciones 1:1, desempeño, indicadores, bienestar, formación, compromisos, desarrollo profesional y seguimiento. Aunque en esta fase no se construye todo, la arquitectura debe quedar preparada para incorporarlo después. Flujo futuro de la experiencia: Preparar → Conversar → Analizar → Acordar → Hacer seguimiento → Aprender. La app debe sentirse como un copiloto operativo de People & Culture, no como un software tradicional de RRHH.

2. USUARIO PRINCIPAL
MVP con un único usuario administrativo "People & Culture" con acceso completo. No desarrollar autenticación compleja por roles todavía, pero dejar la arquitectura preparada para futuros roles: People & Culture, Responsable directo, CEO, Colaborador. En futuras versiones el colaborador solo verá sus compromisos, plan de desarrollo, indicadores y formación (no notas internas completas).

3. NAVEGACIÓN PRINCIPAL
Sidebar izquierdo simple con: Inicio, Personas, 1:1, Seguimientos, Desarrollo, People Insights. Abajo: Configuración, Perfil. En esta Fase 1, los módulos 1:1, Seguimientos, Desarrollo y People Insights deben aparecer en el menú pero como páginas placeholder limpias con mensaje: "Este módulo se construirá en la siguiente fase." No desarrollar su funcionalidad profunda todavía.

4. DISEÑO UX/UI
Estética minimalista, moderna, cercana, operativa, intuitiva, profesional, editorial, SaaS premium. Inspiración: Linear, Notion, Stripe Dashboard. No debe parecer software tradicional de RRHH. Usar: mucho espacio blanco, tarjetas limpias, excelente jerarquía tipográfica, gráficos simples, iconografía lineal, bordes suaves, sombras sutiles, radios moderados, microinteracciones discretas. Evitar: exceso de colores, ilustraciones infantiles, grandes degradados, interfaces saturadas, dashboards sin jerarquía, estética genérica de HR software.

5. PALETA: blanco, gris muy claro, negro/casi negro, gris medio, azul eléctrico como color principal. Estados: verde (positivo), amarillo/naranja (atención), rojo (crítico), usados con moderación.

6. TIPOGRAFÍA: Inter, Geist o Manrope. Debe sentirse extremadamente limpia.

7. COMPONENTES REUTILIZABLES a crear desde esta fase: KPI Card, Status Badge, Progress Bar, Tabs, Tables, Search Bar, Filters, Avatar con iniciales, Charts, Empty State, Modal, Drawer, Timeline, Alert Card. Deben ser reutilizables en fases siguientes.

8. DASHBOARD PRINCIPAL (ruta Inicio)
Título "People Overview", subtítulo "Una vista clara de conversaciones, bienestar, desempeño y desarrollo." Selector de periodo: Este mes / Últimos 3 meses / Últimos 6 meses / Personalizado. Filtros: área, líder, cargo, periodo de evaluación.

9. KPIs DEL DASHBOARD (datos mock/seed, sin lógica real de compromisos ni IA):
Colaboradores: 24. 1:1 realizados: 18/24. 1:1 pendientes: 6. Compromisos abiertos: 32. Compromisos vencidos: 5. Cumplimiento promedio: 84%. Bienestar promedio: 4.1/5. Planes de mejora activos: 3.

10. SECCIÓN "Necesitan atención": máximo 5 personas, ejemplo Laura Gómez (Bienestar ↓16%, mismo bloqueo durante 3 sesiones, 2 compromisos vencidos, Estado: Seguimiento recomendado, botón "Ver ficha"). Estados posibles: Normal, Seguimiento recomendado, Seguimiento prioritario. No usar etiquetas clínicas. Datos simulados; la lógica automática se construirá después.

11. TARJETA "Próximas conversaciones": ejemplo Laura Gómez (Senior UX Designer, Hoy 10:00 AM, botón "Preparar 1:1" → placeholder de 1:1), Juan Pérez (Backend Developer, Mañana 3:00 PM), Camila Torres (Account Manager, Viernes 11:00 AM).

12. DASHBOARD DE BIENESTAR: gráfico con dimensiones bienestar general, motivación, energía, carga laboral, estrés percibido, relación con líder, pertenencia, crecimiento, balance trabajo/vida. Escala 1-5. Mostrar promedio y tendencia respecto al periodo anterior (ej. Bienestar general 4.1 ↑+0.3). Datos simulados.

13. "Principales bloqueos": gráfico horizontal. Ejemplo: Priorización 7, Cliente 5, Procesos 4, Carga laboral 4, Comunicación 3, Conocimiento 2. Sin lógica de detección todavía.

14. DASHBOARD DE FORMACIÓN: tarjeta "Formación" con Cursos asignados 18, Cursos completados 12, Formación autónoma 8, Finalización 67%. Visual simple asignados vs autónomos. La formación autónoma debe verse como señal positiva de iniciativa.

15. MÓDULO PERSONAS (ruta Personas): título, buscador, filtros (Área, Líder, Cargo, Periodo de evaluación), botón "Nueva persona". Tabla/listado con columnas: colaborador, cargo, área, líder, periodo, bienestar, cumplimiento, último 1:1, próximo seguimiento, estado.

16. DATOS DE EJEMPLO — crear al menos 5 colaboradores:
- Laura Gómez, Senior UX Designer, Design, líder Ana Martínez, Q3 2026, Bienestar 4.2, Cumplimiento 87%, Último 1:1 hace 24 días, Estado Normal.
- Juan Pérez, Backend Developer, Technology, líder Carlos Medina, Q3 2026, Bienestar 3.4, Cumplimiento 78%, Estado Seguimiento recomendado.
- Camila Torres, Account Manager, Client Services, líder María López, Bienestar 4.4, Cumplimiento 92%, Estado Normal.
- Andrés Ruiz, Project Manager, Delivery, líder Carlos Medina, Bienestar 2.9, Cumplimiento 72%, Estado Seguimiento prioritario, plan de mejora activo.
- Valentina Rojas, Marketing Specialist, Marketing, líder Ana Martínez, Bienestar 4.0, Cumplimiento 85%, Estado Normal.

17-18. "Nueva persona": botón + formulario con sección "Información general" (Nombre completo, Cargo, Área, Líder/responsable directo, Periodo a evaluar, Responsabilidades generales como textarea amplio con placeholder "Describe las responsabilidades principales asociadas al rol.") y sección "Indicadores" permitiendo agregar múltiples indicadores dinámicamente ("+ Añadir indicador"), cada uno con: nombre, descripción, meta, resultado actual, unidad, peso opcional. Ejemplo: Cumplimiento de entregas / Entregables realizados dentro del plazo acordado / Meta 95 / Resultado 88 / Unidad % / Peso 30%.

19-20. FICHA INDIVIDUAL: al hacer clic en una persona, abrir ficha con nombre, cargo, área, "Responsable: [líder]", periodo, avatar con iniciales, botón "Preparar 1:1" (placeholder) y botón secundario "Nuevo seguimiento" (placeholder). Tabs: Resumen, 1:1, Indicadores, Compromisos, Desarrollo, Formación, Bienestar. Desarrollar completamente: Resumen, Indicadores, Formación, visualización básica de Bienestar, historial básico dentro de 1:1. Los demás tabs (Compromisos, Desarrollo) deben mostrar empty states preparados para fases siguientes.

21. TAB RESUMEN: tarjetas Bienestar actual (4.2/5 ↑0.4), Cumplimiento (87%), Compromisos (6 abiertos, 2 vencidos), Índice de Desarrollo (78/100 ↑11 puntos), Último 1:1 (hace 24 días), Próximo recomendado (6 días). Datos simulados.

22. BLOQUE DE CONTEXTO destacado: "Lo que debes saber antes de hablar con Laura" con texto mock: "Durante las últimas conversaciones, Laura ha mencionado dificultades relacionadas con priorización y comunicación con el cliente. Su percepción de carga laboral ha mejorado y sus indicadores presentan una tendencia positiva. Además, completó dos formaciones autónomas adicionales a las asignadas." Botón "Preparar conversación" (se conectará en Fase 2/3).

23. TIMELINE DE SESIONES dentro del tab 1:1, historial visual, ejemplo: 28 julio 2026 (1:1 mensual, Bienestar 3.8, Cumplimiento 82%, 3 compromisos), 26 junio 2026 (Bienestar 3.3, Cumplimiento 78%, 4 compromisos), 29 mayo 2026 (Bienestar 3.6, Cumplimiento 75%). No desarrollar el formulario completo de sesión, solo la visualización histórica.

24-26. TAB INDICADORES: mostrar indicadores de la persona con meta, resultado, % de cumplimiento y estado visual (🟢 Cumplido, 🟡 En riesgo, 🔴 No cumplido) con progreso visual. Ejemplos: Cumplimiento de entregas (Meta 95%, Resultado 87%, Cumplimiento 91.6%, En riesgo), Satisfacción del cliente (Meta 4.5/5, Resultado 4.7/5, Cumplido). Historial del indicador: gráfico simple mensual (Mayo 75%, Junio 78%, Julio 82%, Agosto 87%), preparado para alimentarse de sesiones reales después.

27. RESPONSABILIDADES GENERALES: mostrar en tab Indicadores o Resumen. Ejemplo (Laura): "Diseñar experiencias digitales alineadas con necesidades del usuario. Liderar procesos de research. Mantener consistencia del Design System. Coordinar handoff con desarrollo. Participar en conversaciones con cliente."

28-29. TAB FORMACIÓN: separar Formación asignada y Formación autónoma. Cada curso muestra: curso, plataforma, tipo, avance, estado, fecha inicio, fecha finalización, competencia relacionada. Ejemplos: Advanced Design Systems (Udemy, Asignado, 100%, Completado, Design Systems); AI for Designers (Udemy, Autónomo, 75%, En curso, IA aplicada al diseño); Stakeholder Management (Udemy, Autónomo, 40%, En curso, Comunicación).

30. TAB BIENESTAR: visualización inicial con bienestar, motivación, energía, carga, estrés, relación con líder, equipo, pertenencia, crecimiento, balance, autonomía. Usar radar chart solo si queda limpio y legible, si no preferir barras horizontales. Mostrar histórico simple. Datos mock.

31. ÍNDICE DE DESARROLLO: mostrar 78/100 ↑11 puntos con tooltip: "Este indicador resume evolución observable en desempeño y desarrollo. No representa una evaluación psicológica." La fórmula definitiva se implementará después.

32-46. BASE DE DATOS (usar Lovable Cloud/Supabase): crear desde ahora todas las tablas necesarias para no reconstruir la arquitectura después:
- users: id, name, email, role, created_at
- employees: id, full_name, job_title, area, leader_name, evaluation_period, general_responsibilities, created_at, updated_at
- indicators: id, employee_id, name, description, target_value, unit, weight, created_at
- indicator_results: id, indicator_id, employee_id, session_id, result_value, compliance_percentage, status, notes, created_at
- courses: id, employee_id, course_name, platform, course_type (assigned/autonomous), start_date, completion_date, progress, status, related_competency, created_at
- sessions: id, employee_id, session_date, session_type, general_notes, ai_summary, approved, created_at (crear la tabla aunque el módulo completo no se construya aún)
- wellbeing_responses: id, session_id, employee_id, dimension, score, notes, created_at
- blockers: id, session_id, employee_id, category, description, severity, status, created_at
- commitments: id, employee_id, session_id, description, responsible, due_date, priority, effort_level, origin, status, created_at, completed_at
- development_goals: id, employee_id, title, category, description, current_state, target_state, progress, status, created_at
- competencies: id, employee_id, name, category, current_level, target_level, notes, created_at
- alerts: id, employee_id, alert_type, severity, title, description, recommendation, resolved, created_at

Relaciones: employee → sessions, indicators, courses, commitments, development_goals, competencies, alerts. indicator → indicator_results. session → indicator_results, wellbeing_responses, blockers, commitments.

Crear seed data suficiente para probar toda la Fase 1 sin ingresar datos manualmente: los 5 colaboradores descritos, sus indicadores, datos históricos, cursos, bienestar y sesiones previas simuladas.

47. RESPONSIVE: priorizar desktop first, funcionar bien en desktop/laptop/tablet. Mobile funcional pero no prioritario.

48. VALIDACIONES: no permitir crear una persona sin nombre, cargo, área, líder y periodo. Los indicadores deben validar valores numéricos cuando corresponda. Mostrar errores de forma clara y no invasiva.

49. ESTADOS VACÍOS: diseñar empty states profesionales, ej. "Todavía no hay indicadores" / "Agrega los indicadores definidos para este rol para comenzar a realizar seguimiento." con botón "Añadir indicador". Evitar pantallas completamente vacías.

50. NO CONSTRUIR TODAVÍA (dejar solo la arquitectura preparada, sin funcionalidad real): generación de preguntas por IA, entrevistas 1:1 completas, cierre con IA, generación automática de compromisos, seguimiento intensivo, alertas inteligentes reales, People Insights generado por IA, recomendaciones de desarrollo por IA, integraciones con Google Calendar, Gmail, Drive, Sheets, Slack, Udemy API, ni portal del colaborador.

INSTRUCCIÓN FINAL: construir únicamente la FASE 1, priorizando en este orden: UX/UI, navegación funcional, arquitectura limpia, componentes reutilizables, base de datos escalable, datos de prueba realistas, claridad visual y consistencia. El producto debe sentirse como un SaaS profesional de People & Culture. Al finalizar, no continuar automáticamente con nuevas funcionalidades: la Fase 2 se entregará en un prompt separado.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b4542724-0f5e-4a61-96d9-de12b94aecbd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
