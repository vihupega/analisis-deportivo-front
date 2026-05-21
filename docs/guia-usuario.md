# Guía de usuario — Soccer Prediction Engine

Esta guía explica cómo usar cada sección de la aplicación desde el navegador. No se requieren conocimientos técnicos.

## Índice

- [Conceptos clave](#conceptos-clave)
- [Navegación](#navegación)
- [Fixtures — Buscar partidos próximos](#fixtures--buscar-partidos-próximos)
- [Predecir — Ligas de clubes](#predecir--ligas-de-clubes)
- [Mundial — Torneos internacionales](#mundial--torneos-internacionales)
- [Historial — Predicciones pasadas](#historial--predicciones-pasadas)
- [Admin — Panel de administración](#admin--panel-de-administración)
- [Problemas comunes](#problemas-comunes)

---

## Conceptos clave

| Término | Significado |
|---|---|
| **Fixture** | Partido programado con fecha, equipos y liga conocidos |
| **Predicción** | Estimación del resultado de un partido expresada en probabilidades |
| **Modelo de clubes** | Modelo ML entrenado con datos de ligas de clubes (La Liga, Premier League, etc.) |
| **Modelo internacional** | Modelo ML entrenado con datos de selecciones nacionales (Mundial, Copa América, etc.) |
| **Colección de datos** | Proceso de descarga de resultados históricos de partidos para entrenar los modelos |
| **Probabilidad** | Valor entre 0 % y 100 % que indica la chance de cada resultado (victoria local, empate, victoria visitante) |

---

## Navegación

La aplicación tiene cinco secciones accesibles desde la barra de navegación superior:

| Tab | Para qué sirve |
|---|---|
| **Fixtures** | Consultar partidos programados por fecha |
| **Predecir** | Obtener predicción para un partido de clubes |
| **Mundial** | Obtener predicción para un partido de selecciones nacionales |
| **Historial** | Ver y filtrar todas las predicciones realizadas |
| **Admin** | Recolectar datos y reentrenar los modelos |

El color de la barra de navegación cambia según la sección activa para facilitar la orientación.

---

## Fixtures — Buscar partidos próximos

Muestra los partidos programados en una fecha determinada y permite enviar cualquiera directamente al formulario de predicción.

### Cómo buscar partidos

1. Haz clic en la tab **Fixtures**.
2. En el campo **Fecha**, escribe o selecciona la fecha que quieres consultar.
3. Opcionalmente, escribe el nombre de una liga en el campo **Liga** para filtrar los resultados.
4. Haz clic en **Buscar**.

La lista mostrará todos los partidos encontrados con sus equipos, liga, país y hora.

### Cómo predecir desde un fixture

1. Encuentra el partido que te interesa en la lista.
2. Haz clic en el botón **Predecir** sobre esa tarjeta.
   - El botón es **azul** para partidos de clubes.
   - El botón es **naranja** para partidos internacionales.
3. La aplicación te llevará automáticamente a la tab **Predecir** o **Mundial** con el formulario ya completado.

> Solo tienes que revisar los datos y hacer clic en **Obtener predicción**.

---

## Predecir — Ligas de clubes

Calcula la probabilidad de victoria local, empate y victoria visitante para un partido entre equipos de club.

### Ligas disponibles

- La Liga
- Premier League
- Liga MX
- Serie A
- Bundesliga
- Ligue 1

### Cómo obtener una predicción

1. Haz clic en la tab **Predecir**.
2. Completa los campos:
   - **Liga** — escribe o selecciona la liga del partido.
   - **Equipo local** — el equipo que juega de local. El campo sugiere equipos de la liga seleccionada.
   - **Equipo visitante** — el equipo que juega de visitante.
   - **Fecha** — la fecha del partido.
   - **Temporada** *(opcional)* — año de la temporada (p.ej. `2025`). Si lo dejas vacío, el modelo usa la temporada más reciente disponible.
3. Haz clic en **Obtener predicción**.

### Interpretar el resultado

El resultado muestra tres probabilidades expresadas como barras:

- **Victoria local** — probabilidad de que gane el equipo de casa.
- **Empate** — probabilidad de que el partido termine sin goles de diferencia.
- **Victoria visitante** — probabilidad de que gane el equipo visitante.

La barra **resaltada en verde** indica el resultado más probable según el modelo.

Debajo de las probabilidades, si el modelo lo incluye, aparece una sección de **estadísticas esperadas** con valores proyectados de xG, faltas, tarjetas amarillas y corners para ambos equipos.

### Limpiar el formulario

Haz clic en **Limpiar** para borrar el resultado actual y el formulario, y comenzar una nueva predicción.

---

## Mundial — Torneos internacionales

Funciona igual que la tab Predecir, pero con selecciones nacionales y torneos internacionales.

### Torneos disponibles

- World Cup (Copa del Mundo FIFA)
- Copa America
- Euro Championship
- UEFA Nations League
- World Cup - Qualification South America
- World Cup - Qualification Europe

### Cómo obtener una predicción

1. Haz clic en la tab **Mundial**.
2. Completa los campos:
   - **Torneo** — escribe o selecciona el torneo.
   - **Selección local** — el equipo que juega de local.
   - **Selección visitante** — el equipo que juega de visitante.
   - **Fecha** — la fecha del partido.
   - **Temporada** *(opcional)*.
3. Haz clic en **Obtener predicción**.

La interpretación del resultado es idéntica a la de la tab Predecir.

---

## Historial — Predicciones pasadas

Muestra todas las predicciones realizadas con opciones de filtrado, estadísticas de fiabilidad y exportación.

### Estadísticas generales

Al entrar a la tab, verás un resumen con:

- **Total resueltas** — predicciones con resultado real conocido.
- **Correctas** — cuántas predicciones acertaron.
- **% Fiabilidad** — porcentaje de aciertos sobre el total resuelto.
- Desglose por modelo (Clubes / Copa Mundial).

### Cómo filtrar el historial

Usa los campos de la barra de filtros antes de hacer clic en **Buscar**:

| Campo | Opciones |
|---|---|
| **Estado** | Todos / Pendientes / Resueltos / Cancelados |
| **Resultado** *(solo si Estado = Resueltos)* | Todos / Correctos / Incorrectos |
| **Modelo** | Todos / Clubes / Copa Mundial |
| **Liga** | Texto libre (búsqueda parcial) |
| **Desde / Hasta** | Rango de fechas |

### Entender una tarjeta de predicción

Cada predicción muestra:

- Equipos y liga del partido.
- Fecha de la predicción.
- Probabilidades predichas.
- **Badge de estado:**
  - `PENDIENTE` — el partido aún no se ha jugado o el resultado no fue registrado.
  - `RESUELTO` — el resultado real fue registrado y la predicción fue evaluada.
  - `CANCELADO` — el partido fue cancelado.
- Si está resuelta: el resultado real y un indicador visual de si fue correcta o no.

### Descargar el historial a Excel

Haz clic en **Descargar Excel** para exportar el historial con los filtros actuales a un archivo `.xlsx`.

### Eliminar una predicción

Haz clic en el ícono de papelera en la tarjeta de la predicción. Si está pendiente, el sistema pedirá confirmación antes de eliminarla.

---

## Admin — Panel de administración

Esta sección es para usuarios técnicos. Permite gestionar los datos de entrenamiento y los modelos de predicción.

> ⚠️ Las acciones de este panel afectan los datos del sistema. Úsalo solo si sabes lo que estás haciendo.

### Recolección de datos

Descarga resultados históricos de partidos para alimentar el entrenamiento de los modelos.

**Campos del formulario:**

| Campo | Descripción |
|---|---|
| **Tipo de torneo** | Clubes o Internacional |
| **Liga / Torneo** | Nombre de la liga (escribe para ver sugerencias) |
| **Mín. partidos previos** *(solo internacional)* | Cantidad mínima de partidos anteriores que debe tener un equipo para incluirse |
| **ID de liga** *(opcional)* | ID numérico de la liga en la fuente de datos |
| **País** *(opcional)* | País de la liga (útil para ligas con nombre genérico) |
| **Temporadas** | Años a descargar. Escribe un año y presiona Enter para agregar más |
| **Forzar re-procesado** | Si está activo, reprocesa datos ya descargados |

Haz clic en **Iniciar recolección** para comenzar. Puedes seguir el estado de cada job en la sección **Estado de jobs** que aparece debajo, con actualizaciones automáticas cada pocos segundos.

### Entrenamiento de modelos

Reentrena los modelos con los datos ya recolectados.

- **Entrenar modelo Clubes** — entrena con los datos de ligas de clubes.
- **Entrenar modelo WC** — entrena con los datos de torneos internacionales.

El entrenamiento puede tardar varios minutos. Espera el mensaje de confirmación antes de cerrar la página.

### Resolver predicciones

Consulta los resultados reales de partidos recientes y actualiza el estado de las predicciones pendientes.

| Campo | Descripción |
|---|---|
| **Últimos N días** | Cuántos días hacia atrás buscar (1–30) |
| **Modelo** | Ambos, Clubes o Copa Mundial |
| **Dry run** | Si está activo, muestra qué se actualizaría sin guardar cambios |

Haz clic en **Resolver predicciones** para ejecutar el proceso.

### Ligas entrenadas

Haz clic en **Ver ligas entrenadas** para cargar una tabla con todas las ligas que tienen datos de entrenamiento registrados, incluyendo el tipo y la cantidad de fixtures disponibles.

### Búsqueda de ligas

Escribe al menos 3 caracteres para buscar ligas en la fuente de datos externa. Útil para encontrar el nombre exacto y el ID de una liga antes de recolectar datos.

---

## Problemas comunes

### No aparecen partidos en Fixtures

- Verifica que el backend esté corriendo. El indicador **SISTEMA ACTIVO** en la parte superior derecha confirma la conectividad.
- Prueba con otra fecha. No todas las ligas tienen partidos todos los días.
- Si filtraste por liga, intenta sin filtro para descartar que el problema sea el nombre de la liga.

### El formulario de predicción no muestra sugerencias de equipos

- Asegúrate de seleccionar primero la **liga**. Las sugerencias de equipos dependen de la liga seleccionada.
- Las sugerencias provienen de una lista local. Si el equipo no aparece, escribe el nombre completo manualmente.

### La predicción devuelve un error

- El modelo necesita datos históricos del partido (equipos y liga). Si el par de equipos o la liga no tiene datos suficientes, el backend devolverá un error explicativo.
- Verifica que los nombres de los equipos coincidan exactamente con los registros del sistema. Usa los fixtures del tab Fixtures como referencia de los nombres correctos.

### El entrenamiento no termina

- El entrenamiento puede tardar varios minutos dependiendo del volumen de datos.
- Si el proceso lleva más de 15 minutos sin respuesta, verifica los logs del backend.

### No puedo exportar a Excel

- La exportación aplica los mismos filtros que la búsqueda actual. Si no hay predicciones con esos filtros, el archivo estará vacío.
- Verifica que el backend esté disponible.
