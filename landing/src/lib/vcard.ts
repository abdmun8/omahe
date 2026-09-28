/**
 * AGEN-OMAHE-05 — vCard 3.0 kartu nama agen ("Simpan kontak"). Teks bebas
 * di-escape sesuai RFC 2426 (`\`, `,`, `;`, baris baru).
 */
function esc(v: string): string {
	return v
		.replace(/\\/g, '\\\\')
		.replace(/[,;]/g, (m) => `\\${m}`)
		.replace(/\r?\n/g, '\\n');
}

export function buatVCard(d: {
	nama: string;
	kodeAgen: string;
	kantorNama: string;
	whatsapp: string | null;
	url: string;
}): string {
	return [
		'BEGIN:VCARD',
		'VERSION:3.0',
		`FN:${esc(d.nama)}`,
		`N:${esc(d.nama)};;;;`,
		`ORG:Omahe;${esc(d.kantorNama)}`,
		`TITLE:Agen Omahe (${esc(d.kodeAgen)})`,
		...(d.whatsapp ? [`TEL;TYPE=CELL:+${d.whatsapp.replace(/\D/g, '')}`] : []),
		`URL:${d.url}`,
		'END:VCARD',
		''
	].join('\r\n');
}
