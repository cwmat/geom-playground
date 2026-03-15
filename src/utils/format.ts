export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function formatCoord(n: number): string {
  return n.toFixed(6);
}

export function formatArea(sqUnits: number): string {
  if (sqUnits >= 1_000_000) {
    return `${(sqUnits / 1_000_000).toFixed(2)} km²`;
  }
  if (sqUnits >= 1) {
    return `${sqUnits.toFixed(2)} m²`;
  }
  return `${sqUnits.toExponential(2)} m²`;
}

export function formatLength(units: number): string {
  if (units >= 1000) {
    return `${(units / 1000).toFixed(2)} km`;
  }
  return `${units.toFixed(2)} m`;
}
