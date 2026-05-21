/**
 * Motor de Reglas de Nelson (Western Electric) - AgroMetric Precision
 * Analiza una serie de puntos en base a sus Z-Scores estandarizados para detectar inestabilidad.
 */

export const NELSON_RULES_INFO = {
  rule1: { id: 1, name: 'Punto Fuera de Control', desc: '1 punto fuera de los límites ±3σ (fuera de control directo).' },
  rule2: { id: 2, name: 'Racha de Media', desc: '9 puntos seguidos del mismo lado de la línea central (cambio de media).' },
  rule3: { id: 3, name: 'Tendencia Progresiva', desc: '6 puntos seguidos creciendo o decreciendo continuamente (desgaste o cambio gradual).' },
  rule4: { id: 4, name: 'Alternancia Sistemática', desc: '14 puntos consecutivos alternando arriba y abajo (inestabilidad cíclica).' },
  rule5: { id: 5, name: 'Desviación Zona A', desc: '2 de 3 puntos seguidos más allá de ±2σ del mismo lado (alerta de cambio medio).' },
  rule6: { id: 6, name: 'Desviación Zona B', desc: '4 de 5 puntos seguidos más allá de ±1σ del mismo lado (alerta temprana).' }
};

/**
 * Aplica las Reglas de Nelson a una lista de Z-Scores.
 * @param {Array<number>} zScores - Z-Scores de cada punto ( (x - media) / sigma ).
 * @returns {Array<Object>} Lista de resultados por punto, indicando qué reglas se infringen.
 */
export function analyzeNelsonRules(zScores) {
  const n = zScores.length;
  const analysis = Array.from({ length: n }, (_, i) => ({
    sg: i + 1,
    z: zScores[i],
    rulesViolated: [], // IDs de reglas violadas (1 a 6)
  }));

  for (let i = 0; i < n; i++) {
    const z = zScores[i];

    // ─── REGLA 1: |Z| > 3 ───────────────────────────────────────────────────
    if (Math.abs(z) > 3) {
      analysis[i].rulesViolated.push(1);
    }

    // ─── REGLA 2: 9 puntos seguidos del mismo lado (Z > 0 o Z < 0) ───────────
    if (i >= 8) {
      const slice = zScores.slice(i - 8, i + 1);
      const allPositive = slice.every(v => v > 0);
      const allNegative = slice.every(v => v < 0);
      if (allPositive || allNegative) {
        analysis[i].rulesViolated.push(2);
      }
    }

    // ─── REGLA 3: 6 puntos seguidos creciendo o decreciendo ──────────────────
    if (i >= 5) {
      const slice = zScores.slice(i - 5, i + 1);
      let increasing = true;
      let decreasing = true;
      for (let j = 1; j < 6; j++) {
        if (slice[j] <= slice[j - 1]) increasing = false;
        if (slice[j] >= slice[j - 1]) decreasing = false;
      }
      if (increasing || decreasing) {
        analysis[i].rulesViolated.push(3);
      }
    }

    // ─── REGLA 4: 14 puntos alternando arriba y abajo ────────────────────────
    if (i >= 13) {
      const slice = zScores.slice(i - 13, i + 1);
      let alternating = true;
      for (let j = 1; j < 14; j++) {
        const diffCurrent = slice[j] - slice[j - 1];
        const diffPrev = slice[j - 1] - (slice[j - 2] !== undefined ? slice[j - 2] : slice[j - 1]);
        if (j > 1 && (diffCurrent * diffPrev >= 0)) {
          alternating = false;
          break;
        }
      }
      if (alternating) {
        analysis[i].rulesViolated.push(4);
      }
    }

    // ─── REGLA 5: 2 de 3 puntos seguidos en Zona A o más allá (> 2 o < -2) del mismo lado ──
    if (i >= 2) {
      const slice = zScores.slice(i - 2, i + 1);
      const upperA = slice.filter(v => v > 2).length;
      const lowerA = slice.filter(v => v < -2).length;
      if (upperA >= 2 || lowerA >= 2) {
        analysis[i].rulesViolated.push(5);
      }
    }

    // ─── REGLA 6: 4 de 5 puntos seguidos en Zona B o más allá (> 1 o < -1) del mismo lado ──
    if (i >= 4) {
      const slice = zScores.slice(i - 4, i + 1);
      const upperB = slice.filter(v => v > 1).length;
      const lowerB = slice.filter(v => v < -1).length;
      if (upperB >= 4 || lowerB >= 4) {
        analysis[i].rulesViolated.push(6);
      }
    }
  }

  return analysis;
}

/**
 * Genera un diagnóstico textual y estructurado consolidado basado en el análisis Nelson.
 * @param {Array<Object>} analysis - Resultado de analyzeNelsonRules.
 * @returns {Object} Resumen consolidado para visualización en UI.
 */
export function getNelsonDiagnostic(analysis) {
  const violationsMap = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  let totalViolations = 0;

  analysis.forEach(pt => {
    pt.rulesViolated.forEach(ruleId => {
      violationsMap[ruleId].push(pt.sg);
      totalViolations++;
    });
  });

  const activeAlerts = Object.entries(violationsMap)
    .filter(([_, subgrupos]) => subgrupos.length > 0)
    .map(([ruleId, subgrupos]) => ({
      ruleId: parseInt(ruleId),
      name: NELSON_RULES_INFO[`rule${ruleId}`].name,
      desc: NELSON_RULES_INFO[`rule${ruleId}`].desc,
      subgrupos,
    }));

  return {
    isControlled: totalViolations === 0,
    totalViolations,
    violationsMap,
    activeAlerts,
  };
}
