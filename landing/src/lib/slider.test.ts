import { describe, expect, test } from 'bun:test';
import { jedaSlideMs } from './slider';

describe('MONET-07 jedaSlideMs', () => {
	test('durasi banner berbayar dipakai; selain itu jeda global (min 2 dtk)', () => {
		expect(jedaSlideMs({ durasiDetik: 6 }, 3)).toBe(6000);
		expect(jedaSlideMs({ durasiDetik: null }, 4)).toBe(4000);
		expect(jedaSlideMs({}, 1)).toBe(2000);
		expect(jedaSlideMs(undefined, 3)).toBe(3000);
		expect(jedaSlideMs({ durasiDetik: 99 }, 3)).toBe(3000);
	});
});
