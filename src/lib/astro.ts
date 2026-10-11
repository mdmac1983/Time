// Astronomical helpers (Jean Meeus, "Astronomical Algorithms"). Accurate to minutes,
// which is plenty for deciding which calendar day an event lands on.

const RAD = Math.PI / 180;

function jdeToDate(jde: number) {
  // JDE (TT) -> UTC Date; TT-UTC ~ 69s in the 2020s, negligible at day resolution.
  return new Date((jde - 2440587.5) * 86400000 - 69000);
}

/** Moon phase instant. k integer = new moon, k + 0.5 = full moon (k counts lunations since 2000-01-06). */
export function moonPhase(k: number): Date {
  const T = k / 1236.85;
  let jde =
    2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T) * RAD;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3) * RAD;
  const F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T) * RAD;
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T * T) * RAD;
  const full = Math.abs(k % 1) > 0.25;
  const s = Math.sin;
  if (!full) {
    jde +=
      -0.4072 * s(Mp) + 0.17241 * E * s(M) + 0.01608 * s(2 * Mp) + 0.01039 * s(2 * F) +
      0.00739 * E * s(Mp - M) - 0.00514 * E * s(Mp + M) + 0.00208 * E * E * s(2 * M) -
      0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M) -
      0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F) -
      0.00024 * E * s(2 * Mp - M) - 0.00017 * s(Om);
  } else {
    jde +=
      -0.40614 * s(Mp) + 0.17302 * E * s(M) + 0.01614 * s(2 * Mp) + 0.01043 * s(2 * F) +
      0.00734 * E * s(Mp - M) - 0.00515 * E * s(Mp + M) + 0.00209 * E * E * s(2 * M) -
      0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M) -
      0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F) -
      0.00024 * E * s(2 * Mp - M) - 0.00017 * s(Om);
  }
  return jdeToDate(jde);
}

/** All new or full moons whose instant falls in [from, to). */
export function moonsBetween(from: Date, to: Date, full: boolean): Date[] {
  const yearsSince2000 = (from.getTime() - Date.UTC(2000, 0, 6)) / (365.25 * 86400000);
  let k = Math.floor(yearsSince2000 * 12.3685) - 1;
  const out: Date[] = [];
  for (let i = 0; i < 20; i++, k++) {
    const d = moonPhase(k + (full ? 0.5 : 0));
    if (d >= to) break;
    if (d >= from) out.push(d);
  }
  return out;
}

/** Equinox/solstice instant. which: 0=March equinox, 1=June solstice, 2=September equinox, 3=December solstice. */
export function season(year: number, which: 0 | 1 | 2 | 3): Date {
  const Y = (year - 2000) / 1000;
  const base = [
    2451623.80984 + 365242.37404 * Y + 0.05169 * Y * Y - 0.00411 * Y ** 3 - 0.00057 * Y ** 4,
    2451716.56767 + 365241.62603 * Y + 0.00325 * Y * Y + 0.00888 * Y ** 3 - 0.0003 * Y ** 4,
    2451810.21715 + 365242.01767 * Y - 0.11575 * Y * Y + 0.00337 * Y ** 3 + 0.00078 * Y ** 4,
    2451900.05952 + 365242.74049 * Y - 0.06223 * Y * Y - 0.00823 * Y ** 3 + 0.00032 * Y ** 4,
  ][which];
  const T = (base - 2451545.0) / 36525;
  const W = (35999.373 * T - 2.47) * RAD;
  const dl = 1 + 0.0334 * Math.cos(W) + 0.0007 * Math.cos(2 * W);
  const A = [485, 203, 199, 182, 156, 136, 77, 74, 70, 58, 52, 50, 45, 44, 29, 18, 17, 16, 14, 12, 12, 12, 9, 8];
  const B = [324.96, 337.23, 342.08, 27.85, 73.14, 171.52, 222.54, 296.72, 243.58, 119.81, 297.17, 21.02, 247.54, 325.15, 60.93, 155.12, 288.79, 198.04, 199.76, 95.39, 287.11, 320.81, 227.73, 15.45];
  const C = [1934.136, 32964.467, 20.186, 445267.112, 45036.886, 22518.443, 65928.934, 3034.906, 9037.513, 33718.147, 150.678, 2281.226, 29929.562, 31555.956, 4443.417, 67555.328, 4562.452, 62894.029, 31436.921, 14577.848, 31931.756, 34777.259, 1222.114, 16859.074];
  let S = 0;
  for (let i = 0; i < A.length; i++) S += A[i] * Math.cos((B[i] + C[i] * T) * RAD);
  return jdeToDate(base + (0.00001 * S) / dl);
}
