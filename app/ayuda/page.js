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
    id: 'manual',
    icon: '🚀',
    title: 'Guía de Inicio Rápido (Paso a Paso)',
    color: '#3b82f6',
    content: `
¡Bienvenido a **AgroMetric Precision**! Esta guía paso a paso te enseñará a dominar todas las herramientas de la plataforma para controlar la calidad de tu producción agrícola o agroindustrial desde cero.

### Paso 1: Registrar y Administrar tus Muestras
Todo análisis comienza en el módulo **Registro de Muestras**:
- **Crear un lote:** Haz clic en **"+ Nueva Entrada"**, introduce el nombre del lote, la variable a medir (ej: Peso, Acidez), el analista, los límites de especificación (LIE y LSE) definidos por tu cliente, y el tamaño de subgrupo (n).
- **Ver y editar datos:** Haz clic en el botón de lápiz **"✏️ Editar / Ver Datos"** de cualquier registro. Se abrirá la matriz bidimensional de datos.
- **Editar valores:** Puedes escribir directamente sobre cualquier celda numérica de la matriz para corregir errores.
- **Añadir subgrupos:** Haz clic en **"+ Añadir Subgrupo"** en la parte inferior para agregar una nueva fila de mediciones.
- **Eliminar filas/lotes:** Usa los botones de papelera **"Eliminar"** para descartar subgrupos específicos o lotes enteros.
- **Guardar:** Presiona **"Guardar Cambios"** y toda la plataforma se recalculará instantáneamente.

### Paso 2: Evaluar la Estabilidad (Gráficos de Control)
Ve al módulo **Gráficos X̄-R / X̄-S** o **Gráficos P, NP, C, U**:
- **Elegir tu lote:** Selecciona tu producto en el buscador superior.
- **Configurar tu gráfico (Variables):** Usa **X̄-R (Rango)** si el tamaño de tu subgrupo es pequeño (n ≤ 10). Usa **X̄-S (Desviación)** si tu subgrupo es grande (n > 10).
- **Detectar alertas rojas (Nelson):** El sistema resaltará automáticamente en rojo brillante con etiquetas (como R1, R2, R5) cualquier punto inestable.
- **Leer el Diagnóstico:** En la parte inferior, lee el **Diagnóstico Técnico consolidado** con recomendaciones sobre qué regla se violó y su causa probable.

### Paso 3: Verificar Supuestos (Pruebas de Normalidad)
Para que los cálculos de capacidad sean 100% confiables, ve a **Pruebas de Normalidad**:
- **Revisar el valor-p (Anderson-Darling):** Si el **valor-p > 0.05** (verde), tus datos son normales. Si el **valor-p ≤ 0.05** (amarillo/rojo), tus datos no siguen la campana de Gauss.
- **¿Qué hacer si no son normales?** Marca la casilla **"Activar Transformación Box-Cox"**. La app probará automáticamente cientos de lambdas (λ) y transformará matemáticamente tus datos para hacerlos normales y válidos.

### Paso 4: Medir tu Calidad (Índices de Capacidad)
En el módulo **Índices de Capacidad** sabrás si estás cumpliendo los requisitos del cliente:
- **Analizar el Cpk:** Si **Cpk < 1.0**: Tu proceso no es capaz y producirá piezas defectuosas (PPM alto). Si **Cpk ≥ 1.33**: Tu proceso es capaz y está bajo control satisfactorio.
- **PPM estimadas:** El panel te indicará cuántos defectos se esperan producir por cada millón de unidades.

### Paso 5: Encontrar y Corregir la Causa Raíz
Cuando detectes inestabilidad o bajo Cpk, usa las herramientas de mejora:
- **Diagrama de Pareto:** Identifica cuáles defectos causan el 80% del problema (barras en rojo). Concéntrate en resolver esos.
- **Diagrama de Ishikawa:** En el panel interactivo, escribe tu problema en la cabeza del pescado y haz una lluvia de ideas con tu equipo categorizando las causas en las **6M** (Mano de Obra, Maquinaria, Materiales, Métodos, Medición y Medio Ambiente).

### Paso 6: Generar un Reporte Profesional para tu Cliente
Una vez completado el análisis:
- Haz clic en **"Generar Reporte PDF"** (disponible en variables y atributos).
- Selecciona mediante checkboxes solo las partes que quieres incluir en el documento.
- Presiona **"Imprimir / Guardar PDF"**. En el navegador, selecciona "Guardar como PDF" y activa **"Gráficos de fondo"**.
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

// COMPONENTE DE TOUR INTERACTIVO Y SIMULADOR PASO A PASO
function InteractiveTour({ onComplete }) {
  const [step, setStep] = useState(0);

  // Paso 0: Registro de muestras
  const [prodSim, setProdSim] = useState('Limón Eureka');
  const [varSim, setVarSim] = useState('Diámetro (mm)');
  const [lseSim, setLseSim] = useState(55);
  const [lieSim, setLieSim] = useState(40);
  const [lotCreated, setLotCreated] = useState(false);
  const [matrixSim, setMatrixSim] = useState([
    [45.5, 48.2, 46.1, 47.9, 44.2],
    [46.8, 47.5, 49.3, 43.1, 45.9],
    [52.1, 54.8, 50.4, 53.0, 51.5]
  ]);

  // Paso 1: Gráficos de Control y Nelson Rules
  const [hoveredPt, setHoveredPt] = useState(null);

  // Paso 2: Normalidad y Box-Cox
  const [boxCoxActive, setBoxCoxActive] = useState(false);

  // Paso 3: Capacidad del proceso
  const [cpkSlider, setCpkSlider] = useState(1.15);

  // Paso 4: Ishikawa / Pareto
  const [improveTab, setImproveTab] = useState('ishikawa');
  const [activeBone, setActiveBone] = useState(null);

  // Paso 5: PDF
  const [printSim, setPrintSim] = useState({ info: true, chart: true, diagnostic: true, table: false });

  const stepsInfo = [
    { title: '1. Registrar Muestras', desc: 'Aprende a ingresar lotes y editar celdas.' },
    { title: '2. Estabilidad de Procesos', desc: 'Identifica inestabilidad con Nelson Rules.' },
    { title: '3. Prueba de Normalidad', desc: 'Box-Cox para transformar datos no normales.' },
    { title: '4. Índices de Capacidad', desc: 'Entiende el Cpk y las Partes por Millón.' },
    { title: '5. Análisis Causa Raíz', desc: 'Diagramas de Pareto y espina de Ishikawa.' },
    { title: '6. Reporte PDF', desc: 'Exportación selectiva y profesional.' }
  ];

  const simulatePPM = (cpk) => {
    const z = 3 * cpk;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (1.8212560 + t * 1.3302744))));
    const cdf = z > 0 ? 1 - p : p;
    const rate = 2 * (1 - cdf) * 1000000;
    return Math.round(rate);
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Selector de pasos estilizado premium (Steppers) */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderRadius: 12,
        border: '1px solid var(--border)', flexWrap: 'wrap', gap: 10
      }}>
        {stepsInfo.map((s, idx) => {
          const isActive = idx === step;
          const isDone = idx < step;
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setStep(idx)}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? 'var(--green-glow)' : isDone ? 'var(--green-dark)' : 'rgba(255,255,255,0.05)',
                color: isActive || isDone ? 'var(--green-light)' : 'var(--text-muted)',
                border: `1px solid ${isActive ? 'var(--green-primary)' : isDone ? 'var(--green-primary)' : 'var(--border)'}`,
                boxShadow: isActive ? '0 0 10px rgba(16,185,129,0.3)' : 'none',
                transition: 'all 0.3s'
              }}>
                {isDone ? '✓' : idx + 1}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 11.5, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {s.title.split('. ')[1]}
                </span>
              </div>
              {idx < stepsInfo.length - 1 && (
                <div style={{
                  width: 20, height: 1, background: isDone ? 'var(--green-primary)' : 'var(--border)',
                  marginLeft: 8, display: 'block'
                }} className="no-mobile" />
              )}
            </div>
          );
        })}
      </div>

      {/* Panel principal de dos columnas */}
      <div className="grid-2" style={{ gap: 20, minHeight: 380, alignItems: 'stretch' }}>
        {/* Columna Izquierda: Instrucciones */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20, borderLeft: '3px solid var(--green-primary)' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: 12, fontSize: 10 }}>Paso {step + 1} de 6</span>
            
            {step === 0 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                  📝 Registro de Lotes y Matriz de Datos
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                  Todo control de calidad comienza registrando tus datos. En AgroMetric, puedes crear lotes de forma interactiva especificando:
                </p>
                <ul style={{ paddingLeft: 16, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 14 }}>
                  <li><strong>Límites del Cliente (LSE / LIE):</strong> Imprescindibles para el cálculo de capacidad.</li>
                  <li><strong>Estructura de Subgrupos:</strong> Tamaño del muestreo (ej. n = 5 frutos) y cantidad total de muestras.</li>
                  <li><strong>Matriz de Edición Bidimensional:</strong> Edita celdas directamente o borra/agrega filas completas en el modal si te equivocaste en un valor.</li>
                </ul>
                <div className="interpretation good" style={{ padding: '8px 12px', fontSize: 11.5, borderRadius: 6 }}>
                  💡 <strong>Tip de calibración:</strong> Mantén el tamaño de subgrupo (n) constante para asegurar que las bandas de los gráficos X̄ se mantengan estables.
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                  📊 Gráficos de Control y Reglas de Nelson
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                  Los gráficos calculan límites de control estadístico naturales (LCS y LCI) para determinar si la variación de tu proceso es estable o inestable.
                </p>
                <ul style={{ paddingLeft: 16, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 14 }}>
                  <li><strong>Estabilidad:</strong> Los puntos deben oscilar al azar alrededor de la línea central verde.</li>
                  <li><strong>Nelson Rules (Inestabilidad):</strong> La app busca automáticamente patrones inusuales (como racha de 9 puntos de un lado de la media, o tendencias).</li>
                  <li><strong>Alertas de Control (Rojo):</strong> Si un punto rompe alguna regla, se colorea de rojo. Pasa el ratón por encima en el simulador para ver la alerta.</li>
                </ul>
                <div className="interpretation warning" style={{ padding: '8px 12px', fontSize: 11.5, borderRadius: 6 }}>
                  ⚠️ <strong>¡Atención!</strong> Un punto &quot;fuera de límites&quot; no es un producto malo, sino una señal de que el proceso cambió de comportamiento. ¡Investígalo!
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                  🧪 Pruebas de Normalidad y Box‑Cox
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                  Para calcular los índices de capacidad Cp y Cpk con precisión, los datos deben comportarse estadísticamente como una Campana de Gauss (Normalidad).
                </p>
                <ul style={{ paddingLeft: 16, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 14 }}>
                  <li><strong>Anderson-Darling:</strong> Si el p-value es superior a 0.05, tus datos son normales.</li>
                  <li><strong>Transformación Box-Cox:</strong> Si tus datos no son normales (sesgados), puedes activar Box-Cox. La app encontrará el λ óptimo para normalizarlos en milisegundos.</li>
                </ul>
                <div className="interpretation good" style={{ padding: '8px 12px', fontSize: 11.5, borderRadius: 6 }}>
                  💡 Prueba el simulador de la derecha. Activa la transformación <strong>Box-Cox</strong> para ver cómo se normaliza la campana y los datos se alinean en la diagonal.
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                  📈 Índices Cp / Cpk y Defectos PPM
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                  Los índices de capacidad miden si el proceso cumple la tolerancia técnica del cliente.
                </p>
                <ul style={{ paddingLeft: 16, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 14 }}>
                  <li><strong>Cp (Potencial):</strong> Relación entre el ancho de especificación y la variación (¿Cabe la campana en los límites?).</li>
                  <li><strong>Cpk (Real):</strong> Considera el centrado de la campana. Cpk ≥ 1.33 es la meta industrial estándar.</li>
                  <li><strong>Partes por Millón (PPM):</strong> Estima cuántas unidades defectuosas producirás por cada millón de unidades cosechadas/empacadas.</li>
                </ul>
                <div className="interpretation good" style={{ padding: '8px 12px', fontSize: 11.5, borderRadius: 6 }}>
                  💡 Usa la barra de control de la derecha para mover el Cpk y observa cómo varía la tasa de defectos y cómo la curva se contrae de forma segura.
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                  🐠 Mejora Continua: Pareto e Ishikawa
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                  Cuando el proceso muestra inestabilidad o baja capacidad, usamos herramientas Kaizen:
                </p>
                <ul style={{ paddingLeft: 16, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 14 }}>
                  <li><strong>Pareto (Principio 80/20):</strong> Identifica el 20% de las tipologías de defectos que concentran el 80% de los rechazos.</li>
                  <li><strong>Diagrama de Ishikawa (6M):</strong> Divide la lluvia de ideas en 6 factores clave: Mano de obra, Maquinaria, Métodos, Materiales, Medición y Medio ambiente.</li>
                </ul>
                <div className="interpretation good" style={{ padding: '8px 12px', fontSize: 11.5, borderRadius: 6 }}>
                  💡 Haz clic en las pestañas en el simulador y presiona sobre las espinas de Ishikawa para ver ejemplos reales.
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                  📋 Generación de Reportes PDF Premium
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                  Presenta informes profesionales de calidad con un solo clic. El Constructor te permite:
                </p>
                <ul style={{ paddingLeft: 16, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 14 }}>
                  <li><strong>Selección Modular:</strong> Oculta las tablas largas o desactiva gráficos secundarios marcando los checks.</li>
                  <li><strong>Impresión Optimizada:</strong> Usa el diálogo nativo (Chrome/Edge) para conservar la alta resolución de los gráficos vectoriales SVG.</li>
                </ul>
                <div className="interpretation good" style={{ padding: '8px 12px', fontSize: 11.5, borderRadius: 6 }}>
                  💡 <strong>Tip de exportación:</strong> Asegúrate de activar &quot;Gráficos de fondo&quot; en las opciones de impresión de tu navegador para conservar la estética premium.
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {step > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={handlePrev}>← Atrás</button>
            )}
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleNext}>
              {step < 5 ? 'Siguiente Paso →' : 'Completar Tutorial ✓'}
            </button>
          </div>
        </div>

        {/* Columna Derecha: Simulador Interactivo */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 20, background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 }}>
            🎮 Simulador de Interfaz
          </div>

          {/* SIMULADOR PASO 0 */}
          {step === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-light)', marginBottom: 8 }}>Formulario de Lote</div>
                <div className="grid-2" style={{ gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Producto</label>
                    <input className="form-input" style={{ padding: '4px 8px', fontSize: 11 }} value={prodSim} onChange={e => setProdSim(e.target.value)} disabled={lotCreated} />
                  </div>
                  <div>
                    <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Variable de control</label>
                    <input className="form-input" style={{ padding: '4px 8px', fontSize: 11 }} value={varSim} onChange={e => setVarSim(e.target.value)} disabled={lotCreated} />
                  </div>
                </div>
                <div className="grid-2" style={{ gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Límite Inferior (LIE)</label>
                    <input type="number" className="form-input" style={{ padding: '4px 8px', fontSize: 11 }} value={lieSim} onChange={e => setLieSim(+e.target.value)} disabled={lotCreated} />
                  </div>
                  <div>
                    <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Límite Superior (LSE)</label>
                    <input type="number" className="form-input" style={{ padding: '4px 8px', fontSize: 11 }} value={lseSim} onChange={e => setLseSim(+e.target.value)} disabled={lotCreated} />
                  </div>
                </div>
                {!lotCreated ? (
                  <button className="btn btn-primary btn-sm" style={{ width: '100%', padding: '4px 8px', fontSize: 11 }} onClick={() => setLotCreated(true)}>
                    + Crear Registro Simulador
                  </button>
                ) : (
                  <button className="btn btn-secondary btn-sm" style={{ width: '100%', padding: '4px 8px', fontSize: 11 }} onClick={() => setLotCreated(false)}>
                    Reiniciar Formulario
                  </button>
                )}
              </div>

              {lotCreated && (
                <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)', padding: 10, borderRadius: 8, border: '1px solid var(--green-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>Matriz de Datos ({prodSim}):</div>
                    <span style={{ fontSize: 9, color: 'var(--green-light)' }}>Edita los valores:</span>
                  </div>
                  <div style={{ maxHeight: 110, overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: 11 }}>
                      <thead>
                        <tr>
                          <th>Subgrupo</th>
                          {matrixSim[0].map((_, i) => <th key={i}>X{i+1}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {matrixSim.map((row, ri) => (
                          <tr key={ri}>
                            <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Sg {ri+1}</td>
                            {row.map((cell, ci) => (
                              <td key={ci}>
                                <input type="number" style={{
                                  width: '100%', padding: 2, background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)',
                                  fontSize: 10.5, textAlign: 'center'
                                }} value={cell} onChange={e => {
                                  const next = [...matrixSim];
                                  next[ri][ci] = parseFloat(e.target.value) || 0;
                                  setMatrixSim(next);
                                }} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SIMULADOR PASO 1 */}
          {step === 1 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Gráfico Xbar Simulador (Interactivo)</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Pasa el cursor por encima del punto rojo (P3):</div>
              <div style={{ height: 160, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* SVG Chart */}
                <svg width="280" height="130" viewBox="0 0 280 130">
                  {/* Lines */}
                  <line x1="20" y1="20" x2="260" y2="20" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="262" y="24" fill="#ef4444" fontSize="8">LCS (3σ)</text>
                  
                  <line x1="20" y1="65" x2="260" y2="65" stroke="var(--green-primary)" strokeWidth="1.5" />
                  <text x="262" y="69" fill="var(--green-primary)" fontSize="8">LC (Media)</text>
                  
                  <line x1="20" y1="110" x2="260" y2="110" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="262" y="114" fill="#ef4444" fontSize="8">LCI</text>

                  {/* Points & Lines */}
                  <polyline fill="none" stroke="var(--green-light)" strokeWidth="1.5"
                    points="30,80 80,60 130,12 180,75 230,55" />
                  
                  {[
                    { x: 30, y: 80, label: 'P1', val: 22.4, status: 'ok' },
                    { x: 80, y: 60, label: 'P2', val: 23.1, status: 'ok' },
                    { x: 130, y: 12, label: 'P3', val: 32.8, status: 'ooc', alert: '⚠️ Alerta R1: Punto fuera de límites de 3σ. Posible descalibración.' },
                    { x: 180, y: 75, label: 'P4', val: 21.9, status: 'ok' },
                    { x: 230, y: 55, label: 'P5', val: 24.0, status: 'ok' }
                  ].map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={p.status === 'ooc' ? 6 : 4}
                      fill={p.status === 'ooc' ? '#ef4444' : 'var(--green-light)'}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPt(p)}
                      onMouseLeave={() => setHoveredPt(null)} />
                  ))}
                </svg>

                {/* Tooltip flotante simulado */}
                {hoveredPt && (
                  <div style={{
                    position: 'absolute', top: 10, left: 10, right: 10,
                    background: hoveredPt.status === 'ooc' ? 'rgba(239,68,68,0.95)' : 'rgba(15,23,42,0.95)',
                    color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 10,
                    border: '1px solid rgba(255,255,255,0.2)', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}>
                    <strong>Subgrupo {hoveredPt.label}:</strong> {hoveredPt.val} <br />
                    {hoveredPt.alert || 'Procesamiento estable.'}
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, fontSize: 11, border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700 }}>Diagnóstico Técnico:</span>
                <p style={{ margin: '4px 0 0', fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  P3 cruzó el LCS superior. Posible fatiga en la máquina clasificadora. Se recomienda abrir Ishikawa en espina de Maquinaria.
                </p>
              </div>
            </div>
          )}

          {/* SIMULADOR PASO 2 */}
          {step === 2 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Prueba de Normalidad</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Box-Cox:</span>
                  <button className={`btn btn-sm ${boxCoxActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '2px 8px', fontSize: 10 }} onClick={() => setBoxCoxActive(!boxCoxActive)}>
                    {boxCoxActive ? 'ACTIVO' : 'INACTIVO'}
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', gap: 12 }}>
                {/* Histograma / Curva */}
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>Distribución de Muestras</span>
                  <svg width="150" height="90" viewBox="0 0 150 90">
                    {/* Barras de Histograma */}
                    {!boxCoxActive ? (
                      /* Sesgado a la derecha */
                      <>
                        <rect x="10" y="50" width="18" height="40" fill="var(--green-dark)" opacity="0.8" />
                        <rect x="32" y="10" width="18" height="80" fill="var(--green-dark)" opacity="0.8" />
                        <rect x="54" y="30" width="18" height="60" fill="var(--green-dark)" opacity="0.8" />
                        <rect x="76" y="60" width="18" height="30" fill="var(--green-dark)" opacity="0.8" />
                        <rect x="98" y="75" width="18" height="15" fill="var(--green-dark)" opacity="0.8" />
                        <path d="M 10 70 Q 41 5, 54 45 T 120 85" fill="none" stroke="#f59e0b" strokeWidth="2" />
                      </>
                    ) : (
                      /* Simétrico */
                      <>
                        <rect x="10" y="70" width="18" height="20" fill="var(--green-light)" opacity="0.8" />
                        <rect x="32" y="35" width="18" height="55" fill="var(--green-light)" opacity="0.8" />
                        <rect x="54" y="10" width="18" height="80" fill="var(--green-light)" opacity="0.8" />
                        <rect x="76" y="35" width="18" height="55" fill="var(--green-light)" opacity="0.8" />
                        <rect x="98" y="70" width="18" height="20" fill="var(--green-light)" opacity="0.8" />
                        <path d="M 10 80 Q 64 5, 118 80" fill="none" stroke="#f59e0b" strokeWidth="2" />
                      </>
                    )}
                  </svg>
                  <span className={`badge ${boxCoxActive ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 9, marginTop: 4 }}>
                    {boxCoxActive ? 'Distribución Normal (p = 0.74)' : 'No Normal (p = 0.003)'}
                  </span>
                </div>

                {/* QQ Plot */}
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>Q-Q Plot de Cuantiles</span>
                  <svg width="100" height="90" viewBox="0 0 100 90">
                    <line x1="10" y1="80" x2="90" y2="10" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
                    {!boxCoxActive ? (
                      /* Puntos curvados */
                      <>
                        <circle cx="20" cy="85" r="2.5" fill="#f59e0b" />
                        <circle cx="35" cy="80" r="2.5" fill="#f59e0b" />
                        <circle cx="50" cy="65" r="2.5" fill="#f59e0b" />
                        <circle cx="65" cy="40" r="2.5" fill="#f59e0b" />
                        <circle cx="80" cy="15" r="2.5" fill="#f59e0b" />
                      </>
                    ) : (
                      /* Puntos alineados en diagonal */
                      <>
                        <circle cx="20" cy="71" r="2.5" fill="var(--green-light)" />
                        <circle cx="35" cy="58" r="2.5" fill="var(--green-light)" />
                        <circle cx="50" cy="45" r="2.5" fill="var(--green-light)" />
                        <circle cx="65" cy="32" r="2.5" fill="var(--green-light)" />
                        <circle cx="80" cy="19" r="2.5" fill="var(--green-light)" />
                      </>
                    )}
                  </svg>
                  <span style={{ fontSize: 8.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    {boxCoxActive ? 'Puntos alineados' : 'Desviación sistemática'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SIMULADOR PASO 3 */}
          {step === 3 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Cálculo de Capacidad del Proceso</div>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>Ajustar Cpk:</span>
                  <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'JetBrains Mono', color: cpkSlider >= 1.33 ? 'var(--green-light)' : cpkSlider >= 1 ? '#eab308' : '#ef4444' }}>
                    {cpkSlider.toFixed(2)}
                  </span>
                </div>
                <input type="range" min="0.5" max="1.8" step="0.05" value={cpkSlider} onChange={e => setCpkSlider(+e.target.value)} style={{ width: '100%', accentColor: 'var(--green-primary)' }} />
              </div>

              <div className="grid-2" style={{ gap: 8 }}>
                <div className="card" style={{ padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 8.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estado de Capacidad</div>
                  <span className={`badge ${cpkSlider >= 1.33 ? 'badge-green' : cpkSlider >= 1 ? 'badge-yellow' : 'badge-red'}`} style={{ fontSize: 10, marginTop: 4 }}>
                    {cpkSlider >= 1.33 ? 'Proceso Capaz' : cpkSlider >= 1 ? 'Capacidad Marginal' : 'Proceso No Capaz'}
                  </span>
                </div>
                <div className="card" style={{ padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 8.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Defectos PPM</div>
                  <div style={{ fontSize: 12, fontWeight: 800, fontFamily: 'JetBrains Mono', marginTop: 4 }}>
                    {simulatePPM(cpkSlider).toLocaleString()} PPM
                  </div>
                </div>
              </div>

              {/* Curva dinámica SVG */}
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="240" height="70" viewBox="0 0 240 70">
                  {/* LIE / LSE */}
                  <line x1="45" y1="5" x2="45" y2="65" stroke="#ef4444" strokeWidth="1.5" />
                  <text x="48" y="15" fill="#ef4444" fontSize="7">LIE</text>
                  <line x1="195" y1="5" x2="195" y2="65" stroke="#ef4444" strokeWidth="1.5" />
                  <text x="175" y="15" fill="#ef4444" fontSize="7">LSE</text>

                  {/* Curva Normal Dinámica (basada en Cpk slider) */}
                  {/* Mayor Cpk = menor desviación, campana más angosta y alta */}
                  {(() => {
                    const stdDev = 38 / (cpkSlider || 1);
                    const mean = 120;
                    let pathD = `M 10 65`;
                    for (let x = 10; x <= 230; x += 3) {
                      const y = 65 - 55 * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
                      pathD += ` L ${x} ${y}`;
                    }
                    return (
                      <path d={pathD} fill="rgba(16,185,129,0.15)" stroke="var(--green-primary)" strokeWidth="2" />
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}

          {/* SIMULADOR PASO 4 */}
          {step === 4 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Tabs para alternar */}
              <div className="tabs" style={{ marginBottom: 4 }}>
                <button className={`tab ${improveTab === 'ishikawa' ? 'active' : ''}`} style={{ fontSize: 10.5, padding: '4px 10px' }} onClick={() => setImproveTab('ishikawa')}>Ishikawa (Espina)</button>
                <button className={`tab ${improveTab === 'pareto' ? 'active' : ''}`} style={{ fontSize: 10.5, padding: '4px 10px' }} onClick={() => setImproveTab('pareto')}>Pareto (80/20)</button>
              </div>

              {improveTab === 'ishikawa' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Haz clic en las espinas para ver las causas:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { key: 'Mano de obra', causes: ['Falta capacitación', 'Fatiga del turno nocturno', 'Operario nuevo'] },
                      { key: 'Maquinaria', causes: ['Descalibración báscula', 'Banda transportadora sucia'] },
                      { key: 'Materiales', causes: ['Lote de cajas húmedas', 'Variabilidad del fruto'] },
                      { key: 'Métodos', causes: ['Ritmo de empaque alto', 'Error en pesaje'] }
                    ].map(bone => (
                      <button key={bone.key} className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: 10.5, textAlign: 'left', padding: '6px 8px',
                          border: activeBone?.key === bone.key ? '1px solid var(--green-primary)' : '1px solid var(--border)',
                          background: activeBone?.key === bone.key ? 'rgba(16,185,129,0.06)' : 'transparent',
                          color: activeBone?.key === bone.key ? 'var(--green-light)' : 'var(--text-secondary)'
                        }}
                        onClick={() => setActiveBone(bone)}>
                        🦴 {bone.key}
                      </button>
                    ))}
                  </div>

                  {activeBone && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 11 }}>
                      <strong style={{ color: 'var(--green-light)' }}>Causas en {activeBone.key}:</strong>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 14, fontSize: 10.5, color: 'var(--text-muted)' }}>
                        {activeBone.causes.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clasificación de defectos vitales (Pareto):</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}>
                    {/* Mini gráfico Pareto simulado */}
                    {[
                      { name: 'Manchas', count: 48, pct: 48, color: '#ef4444' },
                      { name: 'Calibre pequeño', count: 32, pct: 80, color: '#ef4444' },
                      { name: 'Deformidad', count: 12, pct: 92, color: 'var(--text-muted)' },
                      { name: 'Golpes', count: 8, pct: 100, color: 'var(--text-muted)' }
                    ].map((item, idx) => (
                      <div key={idx} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                          <span style={{ fontWeight: 600 }}>{item.name}</span>
                          <span style={{ color: item.color }}>{item.count} def. ({item.pct}%)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                            <div style={{ width: `${item.pct - (idx > 0 ? [48, 32, 12, 8][idx - 1] : 0)}%`, height: '100%', background: item.color, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 8.5, color: item.color }}>{idx < 2 ? '⚠️ Vital' : 'Trivial'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SIMULADOR PASO 5 */}
          {step === 5 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Configuración de Reporte Premium</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                {Object.keys(printSim).map(k => (
                  <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, cursor: 'pointer' }}>
                    <input type="checkbox" checked={printSim[k]} style={{ accentColor: 'var(--green-primary)' }}
                      onChange={e => setPrintSim(prev => ({ ...prev, [k]: e.target.checked }))} />
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{k === 'info' ? 'Ficha técnica' : k === 'chart' ? 'Gráfico de control' : k === 'diagnostic' ? 'Diagnóstico Nelson' : 'Tabla de datos'}</span>
                  </label>
                ))}
              </div>

              {/* Vista miniatura de hoja */}
              <div style={{ flex: 1, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
                <div style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 7, fontWeight: 800, color: '#1e293b' }}>📄 AgroMetric PDF Report</span>
                  <span style={{ fontSize: 6, color: '#64748b' }}>2026-05-21</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, opacity: 0.85 }}>
                  <div style={{ height: 10, background: '#e2e8f0', borderRadius: 2, display: 'flex', alignItems: 'center', padding: '0 4px', opacity: printSim.info ? 1 : 0.15, transition: 'all 0.3s' }}>
                    <div style={{ width: '40%', height: 4, background: '#475569', borderRadius: 1 }} />
                  </div>
                  <div style={{ height: 26, background: '#f1f5f9', borderRadius: 4, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: printSim.chart ? 1 : 0.15, transition: 'all 0.3s' }}>
                    <span style={{ fontSize: 7, color: '#475569', fontWeight: 700 }}>📈 Gráfico de Control</span>
                  </div>
                  <div style={{ height: 16, background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2, padding: 3, opacity: printSim.diagnostic ? 1 : 0.15, transition: 'all 0.3s' }}>
                    <div style={{ width: '70%', height: 3, background: '#ef4444', borderRadius: 1 }} />
                    <div style={{ width: '90%', height: 3, background: '#475569', borderRadius: 1 }} />
                  </div>
                  <div style={{ height: 14, background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2, padding: 3, opacity: printSim.table ? 1 : 0.15, transition: 'all 0.3s' }}>
                    <div style={{ width: '100%', height: 3, background: '#cbd5e1', borderRadius: 1 }} />
                    <div style={{ width: '100%', height: 3, background: '#cbd5e1', borderRadius: 1 }} />
                  </div>
                </div>

                <div style={{ position: 'absolute', bottom: 4, right: 8, fontSize: 6, color: '#64748b' }}>Página 1 de 1</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AyudaPage() {
  const [active, setActive] = useState('manual'); // Iniciar por defecto en el Manual Interactivo
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

              {/* Contenido renderizado: Si es manual de inicio rápido, muestra el InteractiveTour */}
              <div style={{ lineHeight: 1.7 }}>
                {active === 'manual' ? (
                  <InteractiveTour onComplete={() => setActive('intro')} />
                ) : (
                  renderMarkdown(section.content)
                )}
              </div>

              {/* Navegación entre secciones (sólo para la parte teórica común) */}
              {active !== 'manual' && (
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
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
