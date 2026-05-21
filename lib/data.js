// Datos simulados centralizados — AgroMetric Precision
// Aguacate (Variable), Manzanilla (Atributos), Aloe Vera (Variable + Atributo)

// ─── CONSTANTES PARA GRÁFICOS X̄-R ────────────────────────────────────────────
const A2 = { 2:1.880, 3:1.023, 4:0.729, 5:0.577, 6:0.483, 7:0.419, 8:0.373, 9:0.337, 10:0.308 };
const D3 = { 2:0,     3:0,     4:0,     5:0,     6:0,     7:0.076, 8:0.136, 9:0.184, 10:0.223 };
const D4 = { 2:3.267, 3:2.575, 4:2.282, 5:2.115, 6:2.004, 7:1.924, 8:1.864, 9:1.816, 10:1.777 };
const d2Factor = { 2:1.128, 3:1.693, 4:2.059, 5:2.326, 6:2.534, 7:2.704, 8:2.847, 9:2.970, 10:3.078, 11:3.173, 12:3.258, 13:3.336, 14:3.407, 15:3.472 };


// ─── CONSTANTES PARA GRÁFICOS X̄-S ────────────────────────────────────────────
const A3 = { 2:2.659, 3:1.954, 4:1.628, 5:1.427, 6:1.287, 7:1.182, 8:1.099, 9:1.032, 10:0.975, 11:0.927, 12:0.886, 13:0.850, 14:0.817, 15:0.789 };
const B3 = { 2:0,     3:0,     4:0,     5:0,     6:0.030, 7:0.118, 8:0.185, 9:0.239, 10:0.284, 11:0.321, 12:0.354, 13:0.382, 14:0.406, 15:0.428 };
const B4 = { 2:3.267, 3:2.568, 4:2.266, 5:2.089, 6:1.970, 7:1.882, 8:1.815, 9:1.761, 10:1.716, 11:1.679, 12:1.646, 13:1.618, 14:1.594, 15:1.572 };
const c4Factor = { 2:0.7979, 3:0.8862, 4:0.9213, 5:0.9400, 6:0.9515, 7:0.9594, 8:0.9650, 9:0.9693, 10:0.9727, 11:0.9754, 12:0.9776, 13:0.9794, 14:0.9810, 15:0.9823 };

// ─── AGUACATE — Variable: Peso (g), n=5, 25 subgrupos ─────────────────────────
const aguacatePeso = {
  producto: 'Aguacate Hass',
  tipo: 'Fruta',
  variable: 'Peso',
  unidad: 'g',
  lse: 280,
  lie: 180,
  n: 5,
  analista: 'Carlos Mendoza',
  fecha: '2026-05-01',
  subgrupos: [
    [225, 230, 220, 235, 228], [210, 215, 220, 218, 212], [245, 240, 238, 242, 250],
    [198, 205, 200, 195, 202], [260, 255, 258, 262, 257], [230, 228, 225, 232, 235],
    [185, 190, 188, 192, 186], [242, 238, 245, 240, 243], [220, 215, 218, 222, 216],
    [265, 270, 268, 272, 260], [205, 210, 208, 212, 206], [250, 245, 248, 252, 247],
    [235, 240, 238, 232, 237], [195, 200, 198, 202, 197], [215, 220, 218, 212, 217],
    [258, 262, 255, 260, 257], [228, 230, 225, 232, 227], [240, 245, 242, 238, 243],
    [202, 198, 205, 200, 203], [270, 265, 268, 272, 267], [218, 222, 220, 215, 219],
    [255, 250, 252, 258, 253], [185, 188, 190, 186, 187], [232, 235, 230, 238, 233],
    [248, 245, 250, 252, 247],
  ],
};

// ─── ALOE VERA — Variable: Altura planta (cm), n=4, 25 subgrupos ──────────────
const aloeAltura = {
  producto: 'Aloe Vera',
  tipo: 'Planta Medicinal',
  variable: 'Altura de Planta',
  unidad: 'cm',
  lse: 55,
  lie: 25,
  n: 4,
  analista: 'Laura Gómez',
  fecha: '2026-05-05',
  subgrupos: [
    [38, 42, 40, 39], [45, 48, 44, 46], [32, 35, 33, 34], [50, 52, 49, 51],
    [28, 30, 29, 31], [43, 41, 44, 42], [36, 38, 37, 35], [47, 50, 48, 46],
    [33, 31, 34, 32], [52, 54, 51, 53], [40, 42, 39, 41], [27, 29, 28, 30],
    [44, 46, 43, 45], [37, 39, 36, 38], [49, 51, 48, 50], [35, 33, 36, 34],
    [41, 43, 40, 42], [26, 28, 27, 29], [46, 48, 45, 47], [38, 40, 37, 39],
    [53, 55, 52, 54], [31, 33, 30, 32], [44, 42, 45, 43], [39, 41, 38, 40],
    [48, 50, 47, 49],
  ],
};

// ─── MANZANILLA — Atributo: flores defectuosas, n=100, 25 subgrupos ───────────
const manzanillaP = {
  producto: 'Manzanilla Alemana',
  tipo: 'Planta Medicinal',
  atributo: 'Flores con defectos',
  tipoGrafico: 'p',
  analista: 'Ana Torres',
  fecha: '2026-05-10',
  subgrupos: Array.from({ length: 25 }, (_, i) => {
    const n = 100;
    const np = [8,5,12,3,9,6,14,4,7,11,5,8,10,3,6,9,13,4,7,8,5,11,6,9,7][i];
    return { n, np };
  }),
};

// ─── TOMATE — Atributo: manchas (defectos por unidad), tipo C ─────────────────
const tomateDefectos = {
  producto: 'Tomate Chonto',
  tipo: 'Hortaliza',
  atributo: 'Manchas / Lesiones',
  tipoGrafico: 'c',
  analista: 'Pedro Rivas',
  fecha: '2026-05-12',
  unidadInspeccion: 10,
  subgrupos: [3,7,2,5,8,4,6,1,9,3,5,7,2,4,6,8,3,5,1,7,4,6,2,5,8].map(c => ({ n: 1, c })),
};

// ─── FUNCIONES DE CÁLCULO ──────────────────────────────────────────────────────
export function calcXbarR(subgrupos) {
  const n = subgrupos[0].length;
  const stats = subgrupos.map(sg => {
    const mean = sg.reduce((a, b) => a + b, 0) / n;
    const range = Math.max(...sg) - Math.min(...sg);
    return { mean, range, values: sg };
  });
  const Xbarbar = stats.reduce((a, s) => a + s.mean, 0) / stats.length;
  const Rbar = stats.reduce((a, s) => a + s.range, 0) / stats.length;
  const UCL_X = Xbarbar + A2[n] * Rbar;
  const LCL_X = Xbarbar - A2[n] * Rbar;
  const UCL_R = D4[n] * Rbar;
  const LCL_R = Math.max(0, D3[n] * Rbar);
  return { stats, Xbarbar, Rbar, UCL_X, LCL_X, UCL_R, LCL_R, n };
}

export function calcP(subgrupos) {
  const totalNP = subgrupos.reduce((a, s) => a + s.np, 0);
  const totalN = subgrupos.reduce((a, s) => a + s.n, 0);
  const pbar = totalNP / totalN;
  return subgrupos.map((s, i) => {
    const p = s.np / s.n;
    const ucl = pbar + 3 * Math.sqrt(pbar * (1 - pbar) / s.n);
    const lcl = Math.max(0, pbar - 3 * Math.sqrt(pbar * (1 - pbar) / s.n));
    return { sg: i + 1, p, np: s.np, n: s.n, ucl, lcl, pbar, ooc: p > ucl || p < lcl };
  });
}

export function calcC(subgrupos) {
  const cbar = subgrupos.reduce((a, s) => a + s.c, 0) / subgrupos.length;
  const ucl = cbar + 3 * Math.sqrt(cbar);
  const lcl = Math.max(0, cbar - 3 * Math.sqrt(cbar));
  return subgrupos.map((s, i) => ({
    sg: i + 1, c: s.c, cbar, ucl, lcl, ooc: s.c > ucl || s.c < lcl,
  }));
}

export function calcCapability(subgrupos, lse, lie) {
  if (!subgrupos || subgrupos.length === 0) {
    return { mean: 0, sigma: 1, sigmaWithin: 1, Cp: 0, Cpk: 0, Cpu: 0, Cpl: 0, Pp: 0, Ppk: 0, allValues: [], lse, lie };
  }

  const allValues = subgrupos.flat();
  const N = allValues.length;
  const mean = allValues.reduce((a, b) => a + b, 0) / N;
  
  // Desviación estándar total (Overall Sigma - para Pp/Ppk)
  const varianceOverall = allValues.reduce((a, b) => a + (b - mean) ** 2, 0) / (N - 1);
  const sigmaOverall = Math.sqrt(varianceOverall);

  // Estimación de la Desviación Estándar a Corto Plazo (Within Sigma - para Cp/Cpk)
  let sigmaWithin = sigmaOverall; // Por defecto
  const k = subgrupos.length;
  const n = subgrupos[0]?.length || 1;

  if (n > 1) {
    // Estimación por Rango Promedio (Rbar / d2)
    const rangos = subgrupos.map(sg => Math.max(...sg) - Math.min(...sg));
    const Rbar = rangos.reduce((a, b) => a + b, 0) / k;
    const d2 = d2Factor[n] || (d2Factor[10] + (n - 10) * 0.08); // fallback lineal simple
    sigmaWithin = Rbar / d2;
  } else {
    // Si n = 1 (observaciones individuales), usamos el Rango Móvil de orden 2 (MRbar / d2)
    let sumMR = 0;
    for (let i = 1; i < N; i++) {
      sumMR += Math.abs(allValues[i] - allValues[i - 1]);
    }
    const MRbar = sumMR / (N - 1);
    sigmaWithin = MRbar / 1.128; // d2 para n=2 es 1.128
  }

  // Evitar divisiones por cero o valores negativos indeseados
  if (sigmaWithin <= 0) sigmaWithin = 0.0001;
  const safeSigmaOverall = sigmaOverall > 0 ? sigmaOverall : 0.0001;

  // Cp y Cpk usando sigmaWithin (corto plazo / dentro de subgrupos)
  const Cp = (lse - lie) / (6 * sigmaWithin);
  const Cpu = (lse - mean) / (3 * sigmaWithin);
  const Cpl = (mean - lie) / (3 * sigmaWithin);
  const Cpk = Math.min(Cpu, Cpl);

  // Pp y Ppk usando safeSigmaOverall (largo plazo / total global)
  const Pp = (lse - lie) / (6 * safeSigmaOverall);
  const Ppu = (lse - mean) / (3 * safeSigmaOverall);
  const Ppl = (mean - lie) / (3 * safeSigmaOverall);
  const Ppk = Math.min(Ppu, Ppl);

  return { mean, sigma: safeSigmaOverall, sigmaWithin, Cp, Cpk, Cpu, Cpl, Pp, Ppk, allValues, lse, lie };
}


export function normalityTest(values) {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const s = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const sorted = [...values].sort((a, b) => a - b);
  // Skewness & Kurtosis
  const skew = values.reduce((a, b) => a + ((b - mean) / s) ** 3, 0) / n;
  const kurt = values.reduce((a, b) => a + ((b - mean) / s) ** 4, 0) / n - 3;
  // Simplified Anderson-Darling statistic (approximation)
  function normCDF(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
    return z > 0 ? 1 - p : p;
  }
  const A2stat = (() => {
    const z = sorted.map(x => {
      const zval = (x - mean) / s;
      return Math.max(0.001, Math.min(0.999, normCDF(zval)));
    });
    let s2 = 0;
    for (let i = 0; i < n; i++) {
      s2 += (2 * (i + 1) - 1) * (Math.log(z[i]) + Math.log(1 - z[n - 1 - i]));
    }
    return -n - s2 / n;
  })();
  const pvalue = A2stat < 0.5 ? 0.42 : A2stat < 1.0 ? 0.18 : A2stat < 1.5 ? 0.07 : 0.02;
  const normal = pvalue > 0.05;
  return { mean, s, skew, kurt, A2: A2stat, pvalue, normal, n, sorted };
}

export function histogram(values, bins = 8) {
  const min = Math.min(...values), max = Math.max(...values);
  const w = (max - min) / bins;
  return Array.from({ length: bins }, (_, i) => {
    const lo = min + i * w, hi = lo + w;
    const count = values.filter(v => i === bins - 1 ? v >= lo && v <= hi : v >= lo && v < hi).length;
    return { lo: +lo.toFixed(2), hi: +hi.toFixed(2), mid: +((lo + hi) / 2).toFixed(2), count };
  });
}

export function calcXbarS(subgrupos) {
  const n = subgrupos[0].length;
  // Factores por defecto si n excede 15
  const a3 = A3[n] || 3 / (Math.sqrt(n));
  const b3 = B3[n] !== undefined ? B3[n] : 0;
  const b4 = B4[n] !== undefined ? B4[n] : 2;

  const stats = subgrupos.map(sg => {
    const mean = sg.reduce((a, b) => a + b, 0) / n;
    const variance = sg.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
    const sd = Math.sqrt(variance);
    return { mean, range: sd, values: sg }; // Reusamos campo range para la visualización unificada si es necesario, o lo llamamos sd
  });

  const Xbarbar = stats.reduce((a, s) => a + s.mean, 0) / stats.length;
  const Sbar = stats.reduce((a, s) => a + s.range, 0) / stats.length; // Sbar es el promedio de desviaciones estándar

  const UCL_X = Xbarbar + a3 * Sbar;
  const LCL_X = Xbarbar - a3 * Sbar;
  const UCL_S = b4 * Sbar;
  const LCL_S = b3 * Sbar;

  return { stats, Xbarbar, Sbar, UCL_X, LCL_X, UCL_S, LCL_S, n };
}

export function optimizeBoxCox(values) {
  const minVal = Math.min(...values);
  if (minVal <= 0) {
    throw new Error("Box-Cox requiere valores estrictamente positivos (>0)");
  }

  let bestLambda = 1.0;
  let minA2 = Infinity;
  let bestTransformed = [];

  // Barrido de lambda de -2.0 a 2.0 con paso de 0.1
  for (let l = -2.0; l <= 2.0; l = +(l + 0.1).toFixed(1)) {
    const transformed = values.map(y => {
      if (l === 0) return Math.log(y);
      return (Math.pow(y, l) - 1) / l;
    });

    try {
      const res = normalityTest(transformed);
      if (res.A2 < minA2) {
        minA2 = res.A2;
        bestLambda = l;
        bestTransformed = transformed;
      }
    } catch (e) {
      // Ignorar errores en lambdas inestables
    }
  }

  return { lambda: bestLambda, transformed: bestTransformed };
}

export function calcDescriptiveStats(values) {
  if (!values || values.length === 0) {
    return {
      n: 0, mean: 0, median: 0, q1: 0, q3: 0, iqr: 0,
      min: 0, max: 0, rango: 0, varMuestral: 0, sdMuestral: 0,
      varPoblacional: 0, sdPoblacional: 0, cv: 0, errorEstandar: 0,
      skew: 0, kurt: 0
    };
  }

  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  // Percentil (Excel INC / R Tipo 7)
  const getPercentile = (p) => {
    if (n === 1) return sorted[0];
    const idx = p * (n - 1);
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    if (low === high) return sorted[low];
    return sorted[low] + (sorted[high] - sorted[low]) * (idx - low);
  };
  
  const median = getPercentile(0.5);
  const q1 = getPercentile(0.25);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;
  
  const min = sorted[0];
  const max = sorted[n - 1];
  const rango = max - min;
  
  const sumSqDiff = values.reduce((a, b) => a + (b - mean) ** 2, 0);
  
  const varMuestral = n > 1 ? sumSqDiff / (n - 1) : 0;
  const sdMuestral = Math.sqrt(varMuestral);
  
  const varPoblacional = sumSqDiff / n;
  const sdPoblacional = Math.sqrt(varPoblacional);
  
  const cv = mean !== 0 ? (sdMuestral / mean) * 100 : 0;
  const errorEstandar = n > 0 ? sdMuestral / Math.sqrt(n) : 0;
  
  // Asimetría y Curtosis
  const s = sdMuestral || 0.0001;
  const skew = s > 0 ? (values.reduce((a, b) => a + ((b - mean) / s) ** 3, 0) / n) : 0;
  const kurt = s > 0 ? (values.reduce((a, b) => a + ((b - mean) / s) ** 4, 0) / n - 3) : 0;
  
  return {
    n,
    mean,
    median,
    q1,
    q3,
    iqr,
    min,
    max,
    rango,
    varMuestral,
    sdMuestral,
    varPoblacional,
    sdPoblacional,
    cv,
    errorEstandar,
    skew,
    kurt
  };
}

export { aguacatePeso, aloeAltura, manzanillaP, tomateDefectos, A2, D3, D4, A3, B3, B4, c4Factor, d2Factor };


