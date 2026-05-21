'use client';
import { useState } from 'react';

const sections = [
  {
    id: 'intro',
    icon: '🌿',
    title: '¿Qué es el Control Estadístico de Calidad?',
    color: '#10b981',
    content: `
El **Control Estadístico de Procesos (CEP o SPC)** es un conjunto de técnicas matemáticas que permiten monitorear si un proceso está funcionando de manera estable y predecible.

### ¿Por qué es importante en agricultura?
Cuando se producen frutas, hortalizas o plantas medicinales, cada pieza es diferente: una manzana pesa más que otra, una planta crece más alta, etc. El CEP nos ayuda a determinar si esas diferencias son **normales** (por causas aleatorias del proceso) o si hay algo **anormal** (una máquina dañada, una plaga, un error del operario) que hay que corregir.

### Dos tipos de variación:
| Tipo | Nombre técnico | ¿Qué hacer? |
|------|---------------|-------------|
| Variación esperada, aleatoria | Causa común | No intervenir |
| Variación inesperada, puntual | Causa especial | Investigar y corregir |

### Flujo de trabajo de la app:
1. **Registrar muestras** → Ingresar datos de tu proceso
2. **Graficar** → Ver si el proceso está bajo control
3. **Analizar normalidad** → Verificar supuestos estadísticos
4. **Calcular capacidad** → ¿El proceso cumple especificaciones?
5. **Identificar defectos** → Diagrama de Pareto
    `,
  },
  {
    id: 'xbarr',
    icon: '📊',
    title: 'Gráficos X̄-R (Variables Continuas)',
    color: '#10b981',
    content: `
Los gráficos **X̄-R** se usan cuando tienes **mediciones numéricas** (peso, tamaño, pH, etc.). Son los gráficos de control más comunes.

### ¿Cuándo usarlos?
- Variable: Peso del aguacate, altura de la planta, grados Brix del tomate
- Tamaño de subgrupo: **n = 2 a 10** muestras por subgrupo
- Mínimo recomendado: **25 subgrupos**

### ¿Qué calcula?
**Gráfico X̄ (Media):** Monitorea el promedio de cada subgrupo.
- Línea Central (LC) = X̄̄ (gran media)
- LCS = X̄̄ + A₂ × R̄
- LCI = X̄̄ − A₂ × R̄

**Gráfico R (Rango):** Monitorea la variabilidad dentro de cada subgrupo.
- LC = R̄ (rango promedio)
- LCS = D₄ × R̄
- LCI = D₃ × R̄

### ¿Cómo interpretar?
- ✅ **Proceso bajo control:** Todos los puntos dentro de los límites, sin patrones
- ❌ **Punto fuera de control (OOC):** Un punto cruza LCS o LCI → investigar causa especial
- ⚠️ **Patrones anormales:** 8 puntos seguidos del mismo lado de la LC, tendencia, ciclos

### Ejemplo práctico:
Tomas 5 aguacates cada hora (subgrupo n=5), mides el peso de cada uno, calculas la media y el rango del subgrupo, y graficas. Si la línea sube progresivamente, puede indicar que la calibración de la báscula se está perdiendo.
    `,
  },
  {
    id: 'xbars',
    icon: '📈',
    title: 'Gráficos X̄-S (Desviación Estándar)',
    color: '#059669',
    content: `
Los gráficos **X̄-S** son el estándar de oro para el control de variables continuas cuando el tamaño de subgrupo es mediano o grande. A diferencia de los gráficos X̄-R (que usan el Rango), los gráficos X̄-S utilizan la **Desviación Estándar (S)** para medir la variabilidad del proceso de forma mucho más precisa.

### ¿Cuándo preferir X̄-S sobre X̄-R?
El rango es sumamente fácil de calcular a mano, pero pierde mucha eficiencia conforme el tamaño del subgrupo (n) aumenta. La desviación estándar considera *todos* los datos del subgrupo, no solo el máximo y el mínimo.

| Criterio | Gráfico X̄-R | Gráfico X̄-S |
|----------|-------------|-------------|
| Tamaño de subgrupo (n) | Pequeño (n ≤ 10) | Grande (n > 10, recomendado) |
| Eficiencia de cálculo | Baja en muestras grandes | Alta (aprovecha todos los datos) |
| Sensibilidad a atípicos | Muy afectado por extremos | Más robusto y representativo |

### Fórmulas del Gráfico X̄-S:
**Gráfico X̄ (Media):** Monitorea el promedio del proceso.
- Línea Central (LC) = X̄̄ (gran media)
- LCS = X̄̄ + A₃ × S̄
- LCI = X̄̄ − A₃ × S̄

**Gráfico S (Desviación Estándar):** Monitorea la variabilidad interna.
- Línea Central (LC) = S̄ (desviación estándar promedio)
- LCS = B₄ × S̄
- LCI = B₃ × S̄

*Nota:* Las constantes estadísticas A₃, B₃ y B₄ se obtienen de tablas normalizadas según el tamaño n del subgrupo. Además, la desviación estándar real del proceso se estima como σ = S̄ / c₄.
    `,
  },
  {
    id: 'atributos',
    icon: '🔢',
    title: 'Gráficos de Atributos (P, NP, C, U)',
    color: '#3b82f6',
    content: `
Los gráficos de **atributos** se usan cuando NO mides un número continuo, sino que **clasificas** cada unidad: buena/mala, tiene defecto/no tiene, cuántos defectos tiene.

### Los 4 tipos de gráficos:

| Gráfico | Mide | Ejemplo | n constante? |
|---------|------|---------|-------------|
| **P** | Proporción defectuosos | % flores con mancha | No necesita serlo |
| **NP** | Número defectuosos | # flores con mancha | Sí, n fijo |
| **C** | Número de defectos | # manchas por fruta | Sí, 1 unidad |
| **U** | Defectos por unidad | # manchas / kg | Tamaño variable |

### ¿Cuándo usar cada uno?
- **Gráfico P:** Inspecciono 100 manzanillas, ¿cuántas tienen defecto? → p = 8/100 = 0.08 (8%)
- **Gráfico C:** Inspecciono 1 cajón de tomates, ¿cuántas manchas tiene en total? → c = 5 manchas
- **Gráfico U:** Inspecciono cajones de diferente tamaño → u = manchas / # unidades en cajón

### Fórmulas del Gráfico P:
- p̄ = total defectuosos / total inspeccionados
- LCS = p̄ + 3√(p̄(1−p̄)/n)
- LCI = p̄ − 3√(p̄(1−p̄)/n) (mínimo 0)

### Interpretación:
- Un punto por encima del LCS indica que en ese subgrupo hubo **más defectos de lo esperado** → investigar
- Un punto muy por debajo del LCI puede indicar una **mejora real** en el proceso → ¡estudiar esa causa!
    `,
  },
  {
    id: 'nelson',
    icon: '🚨',
    title: 'Reglas de Nelson e Inestabilidad',
    color: '#dc2626',
    content: `
Las **Reglas de Nelson** son un conjunto de 6 reglas estadísticas aplicadas en control de calidad para identificar inestabilidad, tendencias o "causas especiales" de variación en los gráficos de control.

Para aplicarlas, el gráfico de control se divide en tres zonas a ambos lados de la media (Línea Central):
- **Zona A (Externa):** Más allá de ±2σ hasta ±3σ
- **Zona B (Media):** Más allá de ±1σ hasta ±2σ
- **Zona C (Interna):** Desde la media hasta ±1σ

### Las 6 Reglas de Nelson Implementadas:

| Regla | Nombre y Descripción | Causa Típica Posible |
|-------|----------------------|----------------------|
| **Regla 1** | Un punto fuera de los límites de control (±3σ) | Perturbación grave, error de medida |
| **Regla 2** | 9 puntos consecutivos del mismo lado de la media | Cambio sostenido en el promedio |
| **Regla 3** | 6 puntos consecutivos en orden ascendente o descendente | Desgaste de herramienta, calentamiento |
| **Regla 4** | 14 puntos alternando consecutivamente arriba y abajo | Oscilación, mezcla de dos poblaciones |
| **Regla 5** | 2 de 3 puntos consecutivos en Zona A o más allá (±2σ) | Advertencia de cambio de nivel |
| **Regla 6** | 4 de 5 puntos consecutivos en Zona B o más allá (±1σ) | Variación sistemática del proceso |

### Diagnóstico de Causas Especiales:
Cuando se activa una regla de Nelson, no significa necesariamente que el producto esté defectuoso, sino que el **proceso ha cambiado** y ya no es estadísticamente estable. Esto requiere una detención para investigar e identificar la causa raíz antes de que se produzcan unidades fuera de especificación.
    `,
  },
  {
    id: 'normalidad',
    icon: '🧪',
    title: 'Pruebas de Normalidad',
    color: '#f59e0b',
    content: `
Muchos métodos estadísticos (como los índices de capacidad Cp y Cpk) **asumen** que los datos siguen una **distribución normal** (campana de Gauss). Por eso, antes de calcularlos, debemos verificar ese supuesto.

### ¿Qué es la distribución normal?
Es una distribución simétrica en forma de campana. La mayoría de los datos están cerca de la media, y muy pocos están muy alejados. En la naturaleza, muchas variables biológicas siguen esta distribución: peso de frutas, altura de plantas, etc.

### Estadísticos descriptivos que calcula la app:
| Estadístico | ¿Qué indica? | Valor ideal |
|-------------|-------------|-------------|
| **Media (X̄)** | Centro de los datos | — |
| **Desv. Estándar (S)** | Dispersión de los datos | Lo menor posible |
| **Asimetría** | ¿Qué tan sesgada está la distribución? | Cerca de 0 |
| **Curtosis** | ¿Qué tan "picuda" o "plana" es? | Cerca de 0 |

### Prueba de Anderson-Darling:
Es una de las pruebas más potentes para normalidad. Funciona así:
- **H₀ (hipótesis nula):** Los datos SÍ siguen una distribución normal
- **H₁ (hipótesis alternativa):** Los datos NO siguen distribución normal
- Si el **valor-p > 0.05** → No rechazamos H₀ → Los datos son normales ✅
- Si el **valor-p ≤ 0.05** → Rechazamos H₀ → Los datos NO son normales ⚠️

### Gráfico Q-Q Plot:
Compara los cuantiles teóricos de una normal con los cuantiles reales de tus datos.
- Si los puntos se alinean sobre la diagonal → datos normales ✅
- Si se curvan como una "S" o se desvían mucho → no son normales ❌

### ¿Qué hago si mis datos NO son normales?
- Verificar si hay datos atípicos (outliers) y eliminar si hay causa especial
- Aplicar transformación matemática (logaritmo, raíz cuadrada)
- Usar métodos no paramétricos alternativos
    `,
  },
  {
    id: 'boxcox',
    icon: '🔄',
    title: 'Transformación Box-Cox',
    color: '#3b82f6',
    content: `
Cuando los datos recolectados no siguen una distribución normal (fallan la prueba de Anderson-Darling con valor-p ≤ 0.05), no podemos calcular de forma directa y confiable la capacidad del proceso (Cp, Cpk). Para solucionarlo, aplicamos la **Transformación Box-Cox**.

### ¿Qué hace la transformación?
Box-Cox es una transformación matemática paramétrica que busca un valor óptimo para un parámetro llamado **Lambda (λ)**. Modifica cada dato original (Y) mediante una fórmula de potencia para estabilizar la varianza y aproximar los datos a una curva normal perfecta.

### Fórmula de Transformación:
- Si λ ≠ 0: W = (Y^λ − 1) / λ
- Si λ = 0: W = ln(Y) (logaritmo natural)

### Barrido del λ Óptimo:
Nuestra plataforma realiza un barrido automático de Lambdas en un rango de -2 a 2. Para cada λ, calcula el estadístico de Anderson-Darling y selecciona el λ que maximiza el valor-p (es decir, el que hace que los datos transformados sean **lo más normales posible**).

### Lambdas Comunes en Ingeniería:
| Valor de λ | Transformación Equivalente | Ejemplo de Aplicación |
|------------|----------------------------|-----------------------|
| **λ = 1.0** | Ninguna (Datos originales) | Ya son normales |
| **λ = 0.5** | Raíz cuadrada (√Y) | Datos de conteos y áreas |
| **λ = 0.0** | Logaritmo natural (ln Y) | Datos sesgados a la derecha |
| **λ = -1.0** | Inversa (1/Y) | Tiempos de ciclo o espera |

### Capacidad con Datos Transformados:
Una vez transformados los datos y aprobado el supuesto de normalidad (valor-p > 0.05 en los datos transformados), los límites de especificación (LIE y LSE) se transforman usando el mismo λ óptimo. Los índices Cp, Cpk, Pp y Ppk se calculan en base a esta escala transformada, garantizando precisión absoluta en el reporte.
    `,
  },
  {
    id: 'capacidad',
    icon: '📈',
    title: 'Índices de Capacidad del Proceso',
    color: '#8b5cf6',
    content: `
Los índices de capacidad responden la pregunta: **¿El proceso cumple con los requisitos del cliente (especificaciones)?**

### Especificaciones:
Son los límites que define el cliente o la norma:
- **LSE (Límite Superior de Especificación):** Máximo aceptable. Ej: aguacate no puede pesar más de 280g
- **LIE (Límite Inferior de Especificación):** Mínimo aceptable. Ej: aguacate no puede pesar menos de 180g

⚠️ **Importante:** Los límites de especificación (LSE, LIE) los define el cliente. Los límites de control (LCS, LCI) los calcula el proceso estadísticamente. ¡Son cosas diferentes!

### Los 4 índices principales:

**Cp — Capacidad Potencial:**
Mide si el proceso PODRÍA caber dentro de las especificaciones, sin importar si está centrado.
- Cp = (LSE − LIE) / (6σ)

**Cpk — Capacidad Real:**
Mide si el proceso realmente está dentro de las especificaciones, considerando el centrado.
- Cpk = mín(Cpu, Cpl)
- Cpu = (LSE − X̄) / (3σ)
- Cpl = (X̄ − LIE) / (3σ)

**Pp y Ppk:** Similares a Cp y Cpk pero usan la desviación estándar total (a largo plazo).

### Escala de interpretación:
| Valor | Interpretación | Estado |
|-------|---------------|--------|
| Cpk < 1.00 | Proceso NO capaz | ❌ Urgente |
| 1.00 ≤ Cpk < 1.33 | Proceso marginalmente capaz | ⚠️ Mejorar |
| 1.33 ≤ Cpk < 1.67 | Proceso capaz | ✅ Satisfactorio |
| Cpk ≥ 1.67 | Proceso excelente | 🏆 Clase mundial |

### Relación Cp vs Cpk:
- Si **Cp = Cpk** → El proceso está perfectamente centrado
- Si **Cp > Cpk** → El proceso está descentrado (más cerca de un límite que del otro)
- Si **Cp < 1** → El proceso es muy variable, no hay forma de centrarlo para que cumpla

### PPM (Partes Por Millón defectuosas):
Con Cpk = 1.33 esperamos aprox. 63 defectos por millón de unidades producidas. Con Cpk = 1.67 son solo 0.6 defectos por millón (nivel Six Sigma).
    `,
  },
  {
    id: 'pareto',
    icon: '📉',
    title: 'Diagrama de Pareto',
    color: '#ef4444',
    content: `
El Diagrama de Pareto se basa en el **Principio de Pareto** (también llamado regla 80/20): en la mayoría de los problemas, el **80% de los defectos** son causados por solo el **20% de las causas**.

### ¿Para qué sirve?
Ayuda a **priorizar** en qué problemas concentrar los esfuerzos de mejora. In lugar de atacar todos los defectos al mismo tiempo (lo que es ineficiente), identificamos los "pocos vitales" que generan la mayoría del problema.

### Cómo leer el gráfico:
1. **Barras (eje izquierdo):** Frecuencia de cada tipo de defecto, ordenado de mayor a menor
2. **Línea acumulada (eje derecho):** Porcentaje acumulado de defectos
3. **Línea roja al 80%:** Todo lo que esté a la izquierda son los defectos "vitales"

### Clasificación:
- 🔴 **Defectos Vitales** (≤80% acumulado): Los pocos que causan la mayoría del problema → **ATACAR PRIMERO**
- 🟡 **Defectos Triviales** (>80% acumulado): Muchos tipos pero poca frecuencia → Atender después

### Ejemplo práctico:
Para la Manzanilla Alemana se registraron 7 tipos de defectos. El Pareto muestra que "Flores manchadas" (45 casos) y "Tamaño irregular" (32 casos) representan el 51% del total. Estos dos solos son los vitales. Si los resolvemos, reduciremos más de la mitad de todos los defectos.

### Pasos para construir un Pareto:
1. Identificar y clasificar todos los tipos de defectos
2. Contar la frecuencia de cada uno durante un período
3. Ordenar de mayor a menor frecuencia
4. Calcular el porcentaje acumulado
5. Graficar barras + línea acumulada
6. Trazar línea al 80% e identificar los vitales
    `,
  },
  {
    id: 'ishikawa',
    icon: '🐟',
    title: 'Diagrama de Ishikawa (6M)',
    color: '#a855f7',
    content: `
El **Diagrama de Ishikawa**, también conocido como diagrama de espina de pescado o de causa-efecto, es una herramienta estructurada para identificar, organizar y analizar de forma visual todas las posibles causas raíz de un problema específico o desviación de calidad.

### El Método de las 6M:
Para asegurar que se analicen todas las dimensiones posibles del proceso, las causas se agrupan en **6 categorías clave (las 6M)**:

1. **Mano de Obra (Personal):** Competencia del operario, entrenamiento, fatiga, apego a los procedimientos, supervisión.
2. **Maquinaria (Equipos):** Calibración de básculas, desgaste de herramientas, mantenimiento de tractores o sistemas de riego.
3. **Materiales:** Calidad de las semillas, fertilizantes, humedad de las cajas, homogeneidad de la materia prima, insumos.
4. **Métodos:** Procedimientos de cosecha, técnicas de muestreo, velocidad de la línea de empaque, estándares de trabajo.
5. **Medición:** Precisión del instrumento, calibración de sensores de temperatura, diferencias de criterio entre inspectores.
6. **Medio Ambiente:** Clima externo, humedad relativa en almacén, exposición al sol, temperatura del campo, iluminación.

### Pasos para realizar un análisis de Causa-Efecto:
1. **Definir el Efecto:** Escribir el problema claramente en la "cabeza" del pescado (ej: "Alto % de aguacates con daños en piel").
2. **Lluvia de ideas:** El equipo multidisciplinario propone posibles causas raíz.
3. **Clasificar en las 6M:** Colocar cada causa en la espina correspondiente.
4. **Preguntar "¿Por qué?" consecutivamente:** Para profundizar hasta llegar a la verdadera causa raíz de cada espina.
5. **Priorizar y corregir:** Tomar acciones sobre las causas más probables y medir el impacto con los gráficos de control.
    `,
  },
  {
    id: 'muestras',
    icon: '📝',
    title: 'Registro de Muestras y Trazabilidad',
    color: '#06b6d4',
    content: `
La **trazabilidad** es la capacidad de rastrear el origen y recorrido de un producto. En control de calidad es fundamental para poder investigar causas especiales cuando aparecen.

### ¿Qué información registrar?
Para que el análisis sea confiable y auditable, cada muestreo debe incluir:

| Campo | ¿Por qué importa? |
|-------|------------------|
| **Producto** | Saber exactamente qué se mide |
| **Variable** | Qué característica de calidad se controla |
| **Fecha/Hora** | Para detectar variación en el tiempo (turnos, estaciones) |
| **Analista** | Para identificar variabilidad entre personas |
| **LSE / LIE** | Para calcular índices de capacidad |
| **Número de subgrupos** | ≥25 para gráficos confiables |
| **Tamaño de subgrupo (n)** | n=4 o 5 es lo más común |
| **Notas** | Condiciones especiales: lluvia, nueva cosecha, etc. |

### ¿Cómo tomar las muestras correctamente?
- Las muestras de cada subgrupo deben tomarse en el **mismo momento** (no mezclar turnos)
- El intervalo entre subgrupos debe ser **constante** (ej: cada hora)
- Deben tomarse **al azar** dentro del lote de ese momento
- Registrar cualquier anomalía en notas

### Tamaño recomendado de subgrupo:
| n | Ventaja |
|---|---------|
| 2-3 | Detecta cambios grandes, fácil de medir |
| 4-5 | **El más común**, buen balance costo/efectividad |
| 8-10 | Detecta cambios pequeños, más caro |

### ¿Por qué mínimo 25 subgrupos?
Con menos de 25 subgrupos, los límites de control calculados son poco confiables (tienen mucha incertidumbre). Con 25+ subgrupos, los límites se estabilizan y representan bien el proceso.
    `,
  },
  {
    id: 'pdf_reports',
    icon: '📋',
    title: 'Constructor de Reportes PDF',
    color: '#06b6d4',
    content: `
La plataforma cuenta con un **Constructor Visual de Reportes** que permite documentar los análisis de control de calidad de forma profesional y personalizada para su posterior entrega a gerencia o clientes.

### ¿Cómo funciona la Selección de Componentes?
Antes de exportar el PDF, se abre un panel interactivo que te permite elegir qué partes del análisis actual deseas incluir en el documento:
- **Metadatos y General:** Nombre del analista, fecha del lote, producto y límites de especificación.
- **Gráficos de Control:** Visualización limpia de la media y la variabilidad (X̄-R, X̄-S o Atributos).
- **Diagnóstico y Alertas:** Listado explícito de las Reglas de Nelson que se activaron durante el período.
- **Tabla de Muestras:** Matriz completa de las mediciones registradas para plena auditoría.

### Uso del Diálogo de Impresión Nativo:
Para evitar los errores comunes de renderizado, pérdida de fuentes y pixelado de gráficos SVG que sufren las librerías web tradicionales, la app utiliza un motor optimizado basado en el diálogo de impresión nativo del navegador (window.print()).

### Pasos para guardar como PDF perfecto:
1. Haz clic en **"Generar Reporte PDF"** en la página de análisis.
2. Selecciona las casillas de los componentes que deseas incluir en el modal.
3. Presiona el botón **"Imprimir / Guardar PDF"**.
4. En la ventana emergente de impresión de tu navegador (Chrome, Edge, Safari, etc.):
   - Selecciona **"Guardar como PDF"** en la sección de Destino.
   - En *Más configuraciones*, asegúrate de marcar **"Gráficos de fondo"** para que los colores premium de AgroMetric se vean espectaculares.
   - Desmarca *Cabeceras y pies de página* para una presentación limpia sin URLs del navegador.
5. Guarda el archivo en tu dispositivo. ¡Listo para compartir!
    `,
  },
  {
    id: 'glosario',
    icon: '📚',
    title: 'Glosario de Términos',
    color: '#10b981',
    content: `
### Términos clave ordenados alfabéticamente:

**A₂, A₃, B₃, B₄:** Constantes tabuladas que dependen del tamaño de subgrupo (n). Se usan para calcular los límites de control en los gráficos X̄-R y X̄-S.

**Anderson-Darling (A²):** Prueba estadística para evaluar si los datos siguen una distribución normal. Un valor-p > 0.05 indica normalidad.

**Atributo:** Característica de calidad que se clasifica (defectuoso/bueno, número de defectos). Contrario a "variable".

**Box-Cox:** Transformación matemática paramétrica que busca un λ óptimo para normalizar datos no normales y estabilizar su varianza.

**Causa común:** Variación aleatoria e inherente al proceso. Normal, no requiere intervención.

**Causa especial:** Variación no esperada, tiene una causa identificable. Requiere investigación y corrección.

**Cp:** Índice de capacidad potencial. Compara el ancho de la especificación con la variabilidad del proceso (6σ). No considera el centrado.

**Cpk:** Índice de capacidad real. Considera tanto la variabilidad como el centrado del proceso.

**Curtosis:** Medida de qué tan "puntiaguda" es una distribución. Normal tiene curtosis ≈ 0.

**Distribución normal:** Distribución simétrica en forma de campana. Fundamental en estadística.

**Ishikawa (6M):** Diagrama de causa-efecto que agrupa las causas raíz de un problema en 6 dimensiones principales (Mano de obra, Maquinaria, Materiales, Métodos, Medición, Medio ambiente).

**LC (Línea Central):** La media del estadístico graficado. Es la línea central del gráfico de control.

**LCI (Límite de Control Inferior):** LC − 3σ. Límite inferior del gráfico de control.

**LCS (Límite de Control Superior):** LC + 3σ. Límite superior del gráfico de control.

**LIE:** Límite Inferior de Especificación. Definido por el cliente o la norma.

**LSE:** Límite Superior de Especificación. Definido por el cliente o la norma.

**Nelson (Reglas):** Conjunto de 6 reglas estadísticas aplicadas sobre gráficos de control para detectar inestabilidad y causas especiales.

**OOC (Out of Control):** Punto fuera de control. Un punto que supera LCS o LCI.

**p̄:** Proporción media de defectuosos. Se usa como línea central en el gráfico P.

**Pareto:** Principio que dice que el 80% de los efectos provienen del 20% de las causas.

**PPM:** Partes Por Millón. Estimación de cuántos defectos se producirían por cada millón de unidades.

**Q-Q Plot:** Gráfico de cuantiles. Compara los datos reales con una distribución teórica. Si es normal, los puntos se alinean en una diagonal.

**R̄ (R-bar):** Rango promedio de todos los subgrupos. Línea central del gráfico R.

**Sigma (σ):** Desviación estándar del proceso. Mide la variabilidad.

**Subgrupo:** Conjunto de n observaciones tomadas en condiciones similares (mismo momento, mismo operario, etc.).

**Variable:** Característica de calidad medible numéricamente (peso, longitud, temperatura). Contrario a "atributo".

**X̄ (X-bar):** Media aritmética de un subgrupo. Punto graficado en el gráfico X̄.

**X̄̄ (X-double-bar):** Gran media. Promedio de todas las medias de subgrupos. Línea central del gráfico X̄.
    `,
  },
];

function renderMarkdown(text) {
  const lines = text.trim().split('\n');
  const elements = [];
  let tableBuffer = [];
  let inTable = false;

  const flushTable = () => {
    if (tableBuffer.length < 2) { tableBuffer = []; inTable = false; return; }
    const headers = tableBuffer[0].split('|').map(h => h.trim()).filter(Boolean);
    const rows = tableBuffer.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean));
    elements.push(
      <div key={elements.length} className="table-container" style={{ marginBottom: 16 }}>
        <table>
          <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
    tableBuffer = []; inTable = false;
  };

  lines.forEach((line, i) => {
    if (line.trim().startsWith('|')) {
      inTable = true;
      tableBuffer.push(line.trim());
      return;
    }
    if (inTable) flushTable();

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-light)', margin: '18px 0 8px' }}>{line.slice(4)}</h3>);
    } else if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
      elements.push(<div key={i} style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', margin: '10px 0 4px' }}>{line.slice(2, -2)}</div>);
    } else if (line.startsWith('- ')) {
      const text = line.slice(2).replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong style="color:var(--text-primary)">${t}</strong>`);
      elements.push(<li key={i} style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: text }} />);
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 8 }} />);
    } else {
      const text = line.replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong style="color:var(--text-primary)">${t}</strong>`);
      elements.push(<p key={i} style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: text }} />);
    }
  });

  if (inTable) flushTable();
  return elements;
}

export default function AyudaPage() {
  const [active, setActive] = useState('intro');
  const section = sections.find(s => s.id === active);

  return (
    <>
      <div className="header">
        <div>
          <div className="header-title">📚 Centro de Ayuda y Guía Teórica</div>
          <div className="header-subtitle">Aprende los conceptos de Control Estadístico de Calidad — desde cero</div>
        </div>
      </div>
      <div className="page-content fade-in" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Sidebar de secciones */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <div className="card" style={{ padding: '12px 8px', position: 'sticky', top: 80 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px', marginBottom: 8 }}>
              Contenido
            </div>
            {sections.map(s => (
              <button key={s.id}
                onClick={() => setActive(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 8,
                  background: active === s.id ? 'var(--green-glow)' : 'transparent',
                  border: `1px solid ${active === s.id ? 'var(--green-dark)' : 'transparent'}`,
                  color: active === s.id ? 'var(--green-light)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 12.5, fontWeight: 500, marginBottom: 2,
                  fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                }}>
                <span>{s.icon}</span>
                <span style={{ lineHeight: 1.3 }}>{s.title.length > 30 ? s.title.slice(0, 30) + '…' : s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {section && (
            <div className="card">
              {/* Header de la sección */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, fontSize: 26,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${section.color}20`, border: `1px solid ${section.color}40`,
                }}>
                  {section.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{section.title}</h2>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    Sección {sections.findIndex(s => s.id === section.id) + 1} de {sections.length}
                  </div>
                </div>
              </div>

              {/* Contenido renderizado */}
              <div style={{ lineHeight: 1.7 }}>
                {renderMarkdown(section.content)}
              </div>

              {/* Navegación entre secciones */}
              <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                {sections.findIndex(s => s.id === active) > 0 ? (
                  <button className="btn btn-secondary"
                    onClick={() => setActive(sections[sections.findIndex(s => s.id === active) - 1].id)}>
                    ← Anterior
                  </button>
                ) : <div />}
                {sections.findIndex(s => s.id === active) < sections.length - 1 ? (
                  <button className="btn btn-primary"
                    onClick={() => setActive(sections[sections.findIndex(s => s.id === active) + 1].id)}>
                    Siguiente →
                  </button>
                ) : (
                  <div className="interpretation good" style={{ padding: '8px 16px', fontSize: 13 }}>
                    ✅ ¡Has completado la guía teórica!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
