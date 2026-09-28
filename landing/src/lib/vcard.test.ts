import { describe, expect, test } from 'bun:test';
import { buatVCard } from './vcard';

describe('AGEN-OMAHE-05 vCard', () => {
	test('isi & escape, telepon hanya bila ada', () => {
		const v = buatVCard({
			nama: 'Widya; Pratama',
			kodeAgen: 'OMHA-A0001',
			kantorNama: 'Omahe Bogor, Jawa Barat',
			whatsapp: '6281100000901',
			url: 'https://www.omahe.co.id/agen-omahe/OMHA-A0001'
		});
		expect(v).toContain('FN:Widya\; Pratama');
		expect(v).toContain('ORG:Omahe;Omahe Bogor\\, Jawa Barat');
		expect(v).toContain('TEL;TYPE=CELL:+6281100000901');
		expect(v.endsWith('END:VCARD\r\n')).toBe(true);
		expect(
			buatVCard({ nama: 'X', kodeAgen: 'OMHA-A0002', kantorNama: 'K', whatsapp: null, url: 'u' })
		).not.toContain('TEL');
	});
});
