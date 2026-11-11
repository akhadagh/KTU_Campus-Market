export function formatPesewas(pesewas: number): string {
  return `GH₵${(pesewas / 100).toFixed(2)}`;
}

export function cedisToPesewas(cedis: number): number {
  return Math.round(cedis * 100);
}

export function pesewasToCedis(pesewas: number): number {
  return Math.round(pesewas) / 100;
}

export function formatCedis(cedis: number): string {
  return `GH₵${cedis.toFixed(2)}`;
}
