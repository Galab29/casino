import type { DadosBetType } from '~/types/dados'

export const CHIP_OPTIONS = [5, 25, 100, 500, 1000] as const

export const CHIP_CONFIG: Record<
  number,
  { color: string; border: string; textColor: string; label: string }
> = {
  5: { color: '#c62828', border: '#ef5350', textColor: '#ffffff', label: '5' },
  25: { color: '#2e7d32', border: '#4caf50', textColor: '#ffffff', label: '25' },
  100: { color: '#1565c0', border: '#42a5f5', textColor: '#ffffff', label: '100' },
  500: { color: '#4a148c', border: '#ab47bc', textColor: '#ffffff', label: '500' },
  1000: { color: '#d48800', border: '#ffd54f', textColor: '#000000', label: '1K' },
}

export interface BetDefinition {
  type: DadosBetType
  name: string
  shortName: string
  payoutLabel: string
  category: 'line' | 'place' | 'field' | 'hardway' | 'prop' | 'range'
  description: string
  minPhase?: 'come_out' | 'point' | 'any'
}

export const DADOS_BET_DEFINITIONS: Record<DadosBetType, BetDefinition> = {
  pass_line: {
    type: 'pass_line',
    name: 'Línea de Pase (Pass Line)',
    shortName: 'PASS LINE',
    payoutLabel: '1:1',
    category: 'line',
    description: 'En Tirada de Salida: gana con 7 u 11, pierde con 2, 3 o 12. Con 4, 5, 6, 8, 9 o 10 se fija el Punto y gana si se repite antes de un 7.',
    minPhase: 'come_out',
  },
  dont_pass: {
    type: 'dont_pass',
    name: 'Barra de No Pase (Don\'t Pass)',
    shortName: 'DON\'T PASS',
    payoutLabel: '1:1 (Push en 12)',
    category: 'line',
    description: 'En Tirada de Salida: gana con 2 o 3, empata con 12, pierde con 7 u 11. Con Punto, gana si sale 7 antes que el Punto.',
    minPhase: 'come_out',
  },
  field: {
    type: 'field',
    name: 'El Campo (Field)',
    shortName: 'FIELD (2, 3, 4, 9, 10, 11, 12)',
    payoutLabel: '1:1 (2 paga 2:1, 12 paga 3:1)',
    category: 'field',
    description: 'Apuesta a 1 tiro. Gana si el total es 2, 3, 4, 9, 10, 11 o 12. 2 paga el doble y 12 paga el triple. Pierde con 5, 6, 7 y 8.',
  },
  place_4: {
    type: 'place_4',
    name: 'Sitio al 4',
    shortName: 'PLACE 4',
    payoutLabel: '9:5',
    category: 'place',
    description: 'Gana si sale un 4 antes que un 7. Paga 9 a 5.',
  },
  place_5: {
    type: 'place_5',
    name: 'Sitio al 5',
    shortName: 'PLACE 5',
    payoutLabel: '7:5',
    category: 'place',
    description: 'Gana si sale un 5 antes que un 7. Paga 7 a 5.',
  },
  place_6: {
    type: 'place_6',
    name: 'Sitio al 6',
    shortName: 'PLACE 6',
    payoutLabel: '7:6',
    category: 'place',
    description: 'Gana si sale un 6 antes que un 7. Paga 7 a 6.',
  },
  place_8: {
    type: 'place_8',
    name: 'Sitio al 8',
    shortName: 'PLACE 8',
    payoutLabel: '7:6',
    category: 'place',
    description: 'Gana si sale un 8 antes que un 7. Paga 7 a 6.',
  },
  place_9: {
    type: 'place_9',
    name: 'Sitio al 9',
    shortName: 'PLACE 9',
    payoutLabel: '7:5',
    category: 'place',
    description: 'Gana si sale un 9 antes que un 7. Paga 7 a 5.',
  },
  place_10: {
    type: 'place_10',
    name: 'Sitio al 10',
    shortName: 'PLACE 10',
    payoutLabel: '9:5',
    category: 'place',
    description: 'Gana si sale un 10 antes que un 7. Paga 9 a 5.',
  },
  hard_4: {
    type: 'hard_4',
    name: 'Hard 4 (Doble 2)',
    shortName: 'HARD 4 (2-2)',
    payoutLabel: '7:1',
    category: 'hardway',
    description: 'Gana si sale 2+2 antes de cualquier otro 4 (1+3, 3+1) o un 7.',
  },
  hard_6: {
    type: 'hard_6',
    name: 'Hard 6 (Doble 3)',
    shortName: 'HARD 6 (3-3)',
    payoutLabel: '9:1',
    category: 'hardway',
    description: 'Gana si sale 3+3 antes de cualquier otro 6 o un 7.',
  },
  hard_8: {
    type: 'hard_8',
    name: 'Hard 8 (Doble 4)',
    shortName: 'HARD 8 (4-4)',
    payoutLabel: '9:1',
    category: 'hardway',
    description: 'Gana si sale 4+4 antes de cualquier otro 8 o un 7.',
  },
  hard_10: {
    type: 'hard_10',
    name: 'Hard 10 (Doble 5)',
    shortName: 'HARD 10 (5-5)',
    payoutLabel: '7:1',
    category: 'hardway',
    description: 'Gana si sale 5+5 antes de cualquier otro 10 o un 7.',
  },
  any_7: {
    type: 'any_7',
    name: 'Cualquier 7 (Any 7)',
    shortName: 'ANY 7',
    payoutLabel: '4:1',
    category: 'prop',
    description: 'Apuesta a 1 tiro. Gana si la tirada suma exactamente 7. Paga 4 a 1.',
  },
  any_craps: {
    type: 'any_craps',
    name: 'Cualquier Craps (2, 3 o 12)',
    shortName: 'ANY CRAPS (2,3,12)',
    payoutLabel: '7:1',
    category: 'prop',
    description: 'Apuesta a 1 tiro. Gana si sale 2, 3 o 12. Paga 7 a 1.',
  },
  craps_2: {
    type: 'craps_2',
    name: 'Ojos de Serpiente (Snake Eyes - 2)',
    shortName: 'SNAKE EYES (1-1)',
    payoutLabel: '30:1',
    category: 'prop',
    description: 'Apuesta a 1 tiro. Gana si los dados muestran exactamente 1 y 1 (suma 2). ¡Paga un premio masivo de 30 a 1!',
  },
  craps_12: {
    type: 'craps_12',
    name: 'Vagones (Boxcars - 12)',
    shortName: 'BOXCARS (6-6)',
    payoutLabel: '30:1',
    category: 'prop',
    description: 'Apuesta a 1 tiro. Gana si los dados muestran exactamente 6 y 6 (suma 12). ¡Paga un premio masivo de 30 a 1!',
  },
  craps_3: {
    type: 'craps_3',
    name: 'As y Dos (Ace-Deuce - 3)',
    shortName: 'ACE-DEUCE (3)',
    payoutLabel: '15:1',
    category: 'prop',
    description: 'Apuesta a 1 tiro. Gana si la tirada suma 3 (1+2 o 2+1). Paga 15 a 1.',
  },
  eleven: {
    type: 'eleven',
    name: 'Yo-Eleven (Once - 11)',
    shortName: 'YO-11 (11)',
    payoutLabel: '15:1',
    category: 'prop',
    description: 'Apuesta a 1 tiro. Gana si la tirada suma 11 (5+6 o 6+5). Paga 15 a 1.',
  },
  under_7: {
    type: 'under_7',
    name: 'Bajo 7 (Bajos: 2 al 6)',
    shortName: 'UNDER 7 (2 al 6)',
    payoutLabel: '1:1',
    category: 'range',
    description: 'Apuesta a 1 tiro. Gana si la suma es del 2 al 6. Pierde con 7 o más.',
  },
  over_7: {
    type: 'over_7',
    name: 'Alto 7 (Altos: 8 al 12)',
    shortName: 'OVER 7 (8 al 12)',
    payoutLabel: '1:1',
    category: 'range',
    description: 'Apuesta a 1 tiro. Gana si la suma es del 8 al 12. Pierde con 7 o menos.',
  },
}

export const VALID_POINTS = [4, 5, 6, 8, 9, 10] as const
export type ValidPoint = (typeof VALID_POINTS)[number]

/**
 * Nombres y apodos tradicionales de las tiradas en los casinos de Las Vegas
 */
export function getRollNickname(d1: number, d2: number): string {
  const sum = d1 + d2
  if (d1 === 1 && d2 === 1) return '¡Snake Eyes! (2)'
  if (sum === 3) return '¡Ace-Deuce! (3)'
  if (d1 === 2 && d2 === 2) return '¡Hard 4 (Ballerina)! (4)'
  if (sum === 4) return 'Fever Four (4)'
  if (sum === 5) return 'Little Phoebe (5)'
  if (d1 === 3 && d2 === 3) return '¡Hard 6! (6)'
  if (sum === 6) return 'Easy Six (6)'
  if (sum === 7) return '¡Natural Seven! (7)'
  if (d1 === 4 && d2 === 4) return '¡Hard 8 (Square Pair)! (8)'
  if (sum === 8) return 'Easy Eight (8)'
  if (sum === 9) return 'Center Field Nine (9)'
  if (d1 === 5 && d2 === 5) return '¡Hard 10 (Puppy Paws)! (10)'
  if (sum === 10) return 'Easy Ten (10)'
  if (sum === 11) return '¡Yo-Eleven! (11)'
  if (d1 === 6 && d2 === 6) return '¡Boxcars / Midnight! (12)'
  return `Tirada: ${sum}`
}
