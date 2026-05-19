// Astronomical helpers for projecting catalog stars onto the page.
// All angles in degrees except where noted. RA is in hours.

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export function julianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// Greenwich Mean Sidereal Time, in degrees (Meeus, simplified).
export function gmstDeg(jd) {
  const T = (jd - 2451545.0) / 36525;
  const d = jd - 2451545.0;
  const g = 280.46061837 + 360.98564736629 * d + T * T * 0.000387933 - (T * T * T) / 38710000;
  return ((g % 360) + 360) % 360;
}

export function lstDeg(jd, lonDeg) {
  return ((gmstDeg(jd) + lonDeg) % 360 + 360) % 360;
}

// Equatorial → horizontal. ra in hours, dec/lat in degrees, lst in degrees.
export function equatorialToHorizon(raHours, decDeg, latDeg, lstD) {
  const ha = (lstD - raHours * 15) * D2R;
  const dec = decDeg * D2R;
  const lat = latDeg * D2R;
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAlt = Math.cos(alt);
  const denom = cosAlt * Math.cos(lat);
  let az;
  if (Math.abs(denom) < 1e-9) {
    az = 0;
  } else {
    const cosAz = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / denom;
    az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (Math.sin(ha) > 0) az = 2 * Math.PI - az;
  }
  return { alt: alt * R2D, az: az * R2D };
}

// Stereographic projection from nadir, centered on zenith.
// Returns null if star is below the horizon.
// Output (x, y) in dimensionless units: r=0 at zenith, r=1 at horizon.
// Convention: looking up while facing south.
//   az  =   0  (N)  → ( 0, -r)   top of view
//   az  =  90  (E)  → (-r,  0)   left of view
//   az  = 180  (S)  → ( 0, +r)   bottom of view
//   az  = 270  (W)  → (+r,  0)   right of view
export function projectStar(alt, az) {
  if (alt < 0) return null;
  const azRad = (az - 180) * D2R;
  const altRad = alt * D2R;
  const r = Math.tan((Math.PI / 2 - altRad) / 2);
  return {
    x: r * Math.sin(azRad),
    y: r * Math.cos(azRad),
  };
}
