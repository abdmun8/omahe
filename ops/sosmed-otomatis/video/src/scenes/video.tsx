/**
 * Satu scene generik: memutar daftar adegan dari `data` (hasil siapkan.ts) +
 * narasi + subtitle per kata. Template (T1/T2/…) cukup memilih jenis adegan.
 *
 * Koordinat Revideo berpusat di tengah kanvas (1080×1920 → x ±540, y ±960).
 * Zona aman TikTok/Reels: atas ±150 px & bawah ±400 px tertutup UI aplikasi.
 */
import {Audio, Gradient, Img, Layout, makeScene2D, Node, Rect, Txt} from '@revideo/2d';
import {
  all,
  createRef,
  delay,
  easeOutBack,
  easeOutCubic,
  linear,
  sequence,
  useScene,
  waitFor,
  type ThreadGenerator,
} from '@revideo/core';
import type {Adegan, DataVideo, Foto, Kata} from '../tipe';

const W = 1080;
const H = 1920;
const C = {
  hijau: '#0B3D28',
  hijauGelap: '#062015',
  hijauTerang: '#1B5E3A',
  emas: '#B8862F',
  emasTerang: '#F0D9A0',
  putih: '#FFFFFF',
};
const JUDUL = 'Plus Jakarta Sans';
const BADAN = 'Inter';
const FADE = 0.3;

export default makeScene2D('video', function* (view) {
  const data = useScene().variables.get('data', null)() as DataVideo;

  yield Promise.all([
    document.fonts.load(`800 80px "${JUDUL}"`),
    document.fonts.load(`700 80px "${JUDUL}"`),
    document.fonts.load(`600 40px "${BADAN}"`),
    document.fonts.load(`500 40px "${BADAN}"`),
  ]);

  view.fill(C.hijauGelap);

  const panggung = createRef<Node>();
  const badge = createRef<Rect>();
  const kaki = createRef<Txt>();
  const subtitle = createRef<Layout>();

  view.add(<Node ref={panggung} />);
  view.add(
    <Rect
      ref={badge}
      layout
      padding={[12, 28]}
      radius={40}
      fill={'rgba(6,32,21,0.78)'}
      x={-W / 2 + 56}
      y={-H / 2 + 175}
      offsetX={-1}
    >
      <Txt text={'omahe.co.id'} fill={C.emasTerang} fontFamily={JUDUL} fontWeight={800} fontSize={34} />
    </Rect>,
  );
  view.add(
    <Layout
      ref={subtitle}
      layout
      direction={'row'}
      wrap={'wrap'}
      justifyContent={'center'}
      alignItems={'center'}
      gap={16}
      width={960}
      y={420}
    />,
  );
  view.add(
    <Txt
      ref={kaki}
      text={data.catatanKaki ?? ''}
      fill={'rgba(255,255,255,0.85)'}
      fontFamily={BADAN}
      fontWeight={500}
      fontSize={24}
      lineHeight={32}
      textAlign={'center'}
      textWrap
      width={920}
      y={560}
      shadowColor={'rgba(0,0,0,0.8)'}
      shadowBlur={8}
    />,
  );
  view.add(<Audio src={data.audio} play={true} />);

  yield* all(
    jalankanAdegan(panggung(), data.adegan, badge(), kaki()),
    jalankanSubtitle(subtitle(), data.kata),
  );
});

function* jalankanAdegan(panggung: Node, adegan: Adegan[], badge: Rect, kaki: Txt): ThreadGenerator {
  let sebelumnya: Node | null = null;
  for (const a of adegan) {
    const wadah = createRef<Node>();
    panggung.add(<Node ref={wadah} opacity={0} />);
    const animasi = bangun(a, wadah());
    const lama = sebelumnya;
    const penutup = a.jenis === 'penutup';
    yield* all(
      wadah().opacity(1, FADE),
      animasi(a.durasi),
      penutup ? all(badge.opacity(0, FADE), kaki.opacity(0, FADE)) : waitFor(0),
      delay(FADE + 0.05, () => lama?.remove()),
    );
    sebelumnya = wadah();
  }
}

type Animasi = (durasi: number) => ThreadGenerator;

function bangun(a: Adegan, wadah: Node): Animasi {
  if (a.jenis === 'penutup') return bangunPenutup(a, wadah);
  const latar = latarFoto(wadah, a.foto ?? [], a.jenis === 'foto' ? 0 : 0.35);
  const isi =
    a.jenis === 'poin' ? isiPoin(a, wadah) : a.jenis === 'angka' ? isiAngka(a, wadah) : isiFoto(a, wadah);
  return function* (durasi) {
    yield* all(latar(durasi), isi(durasi));
  };
}

/** Foto memenuhi layar, geser pelan (Ken Burns) + gradasi gelap atas/bawah untuk keterbacaan. */
function latarFoto(wadah: Node, foto: Foto[], gelapTambahan: number): Animasi {
  const daftar = foto.map((f) => {
    const skala = Math.max(W / f.w, H / f.h);
    const lebar = f.w * skala;
    const tinggi = f.h * skala;
    const geser = Math.min((lebar - W) / 2, 420) * 0.8;
    const ref = createRef<Img>();
    wadah.add(<Img ref={ref} src={f.src} width={lebar} height={tinggi} x={geser} opacity={0} />);
    return {ref, geser};
  });
  wadah.add(
    <Rect
      width={W}
      height={H}
      fill={
        new Gradient({
          type: 'linear',
          from: [0, -H / 2],
          to: [0, H / 2],
          stops: [
            {offset: 0, color: 'rgba(6,32,21,0.88)'},
            {offset: 0.38, color: 'rgba(6,32,21,0.10)'},
            {offset: 0.55, color: 'rgba(6,32,21,0.20)'},
            {offset: 1, color: 'rgba(6,32,21,0.92)'},
          ],
        })
      }
    />,
  );
  if (gelapTambahan > 0) wadah.add(<Rect width={W} height={H} fill={`rgba(6,32,21,${gelapTambahan})`} />);

  return function* (durasi) {
    if (daftar.length === 0) {
      yield* waitFor(durasi);
      return;
    }
    const per = durasi / daftar.length;
    yield* sequence(
      per,
      ...daftar.map(({ref, geser}, i) =>
        all(
          ref().opacity(1, i === 0 ? 0 : 0.45),
          // Item terakhir berhenti tepat di akhir adegan; yang lain sedikit melewati batas supaya crossfade mulus.
          ref().x(-geser, i < daftar.length - 1 ? per + 0.5 : per, linear),
          ref().scale(1.07, i < daftar.length - 1 ? per + 0.5 : per, linear),
        ),
      ),
    );
  };
}

function blokJudul(a: Adegan, wadah: Node, y: number) {
  const ref = createRef<Layout>();
  const chip: ReturnType<typeof createRef<Rect>>[] = [];
  wadah.add(
    <Layout ref={ref} layout direction={'column'} alignItems={'center'} gap={22} width={980} y={y} opacity={0} scale={0.88}>
      {a.judul ? (
        <Txt
          text={a.judul}
          fill={C.putih}
          fontFamily={JUDUL}
          fontWeight={800}
          fontSize={84}
          lineHeight={98}
          textAlign={'center'}
          textWrap
          width={980}
          shadowColor={'rgba(0,0,0,0.55)'}
          shadowBlur={24}
        />
      ) : null}
      {a.sub ? (
        <Rect layout fill={C.emas} radius={20} padding={[14, 34]}>
          <Txt text={a.sub} fill={C.hijauGelap} fontFamily={JUDUL} fontWeight={800} fontSize={60} />
        </Rect>
      ) : null}
      {a.chip?.length ? (
        <Layout layout direction={'row'} wrap={'wrap'} justifyContent={'center'} gap={16} width={980}>
          {a.chip.map((c) => {
            const r = createRef<Rect>();
            chip.push(r);
            return (
              <Rect ref={r} layout fill={'rgba(255,255,255,0.94)'} radius={40} padding={[12, 30]} opacity={0}>
                <Txt text={c} fill={C.hijau} fontFamily={JUDUL} fontWeight={700} fontSize={42} />
              </Rect>
            );
          })}
        </Layout>
      ) : null}
    </Layout>,
  );
  return function* (): ThreadGenerator {
    yield* all(ref().opacity(1, 0.35), ref().scale(1, 0.5, easeOutBack));
    if (chip.length) yield* sequence(0.18, ...chip.map((r) => r().opacity(1, 0.25)));
  };
}

function isiFoto(a: Adegan, wadah: Node): Animasi {
  const judul = blokJudul(a, wadah, -500);
  return function* (durasi) {
    yield* all(judul(), waitFor(durasi));
  };
}

function isiPoin(a: Adegan, wadah: Node): Animasi {
  const judul = blokJudul(a, wadah, -600);
  const baris: ReturnType<typeof createRef<Layout>>[] = [];
  wadah.add(
    <Rect layout direction={'column'} gap={30} padding={[44, 48]} radius={36} fill={'rgba(6,32,21,0.86)'} width={940} y={-90}>
      {(a.poin ?? []).map((p) => {
        const r = createRef<Layout>();
        baris.push(r);
        return (
          <Layout ref={r} layout direction={'row'} alignItems={'center'} gap={28} opacity={0} x={-30}>
            <Rect width={26} height={26} radius={6} rotation={45} fill={C.emas} />
            <Txt text={p} fill={C.putih} fontFamily={BADAN} fontWeight={600} fontSize={48} textWrap width={760} />
          </Layout>
        );
      })}
    </Rect>,
  );
  return function* (durasi) {
    const jeda = Math.min(0.9, (durasi - 0.8) / Math.max(1, baris.length));
    yield* all(
      judul(),
      delay(0.35, sequence(jeda, ...baris.map((r) => all(r().opacity(1, 0.3), r().x(0, 0.3, easeOutCubic))))),
      waitFor(durasi),
    );
  };
}

function isiAngka(a: Adegan, wadah: Node): Animasi {
  const judul = blokJudul(a, wadah, -600);
  const baris: ReturnType<typeof createRef<Rect>>[] = [];
  wadah.add(
    <Layout layout direction={'column'} gap={22} width={940} y={-90}>
      {(a.angka ?? []).map((n) => {
        const r = createRef<Rect>();
        baris.push(r);
        return (
          <Rect
            ref={r}
            layout
            direction={'row'}
            justifyContent={'space-between'}
            alignItems={'center'}
            padding={[30, 40]}
            radius={30}
            fill={n.sorot ? C.emas : 'rgba(6,32,21,0.86)'}
            opacity={0}
            scale={0.9}
          >
            <Txt
              text={n.label}
              fill={n.sorot ? C.hijauGelap : C.emasTerang}
              fontFamily={BADAN}
              fontWeight={600}
              fontSize={42}
              textWrap
              width={430}
            />
            <Txt
              text={n.nilai}
              fill={n.sorot ? C.hijauGelap : C.putih}
              fontFamily={JUDUL}
              fontWeight={800}
              fontSize={n.sorot ? 70 : 58}
              textAlign={'right'}
            />
          </Rect>
        );
      })}
    </Layout>,
  );
  return function* (durasi) {
    const jeda = Math.min(1.4, (durasi - 0.8) / Math.max(1, baris.length));
    yield* all(
      judul(),
      delay(0.35, sequence(jeda, ...baris.map((r) => all(r().opacity(1, 0.3), r().scale(1, 0.45, easeOutBack))))),
      waitFor(durasi),
    );
  };
}

function bangunPenutup(a: Adegan, wadah: Node): Animasi {
  const logo = createRef<Img>();
  const teks = createRef<Txt>();
  const url = createRef<Rect>();
  wadah.add(<Rect width={W} height={H} fill={C.putih} />);
  wadah.add(<Img ref={logo} src={'/aset/omahe-logo.jpg'} width={700} y={-400} scale={0.85} />);
  wadah.add(
    <Txt
      ref={teks}
      text={a.judul ?? ''}
      fill={C.hijau}
      fontFamily={JUDUL}
      fontWeight={800}
      fontSize={66}
      lineHeight={80}
      textAlign={'center'}
      textWrap
      width={900}
      y={70}
      opacity={0}
    />,
  );
  wadah.add(
    <Rect ref={url} layout fill={C.hijau} radius={70} padding={[26, 60]} y={270} opacity={0} scale={0.8}>
      <Txt text={a.url ?? 'omahe.co.id'} fill={C.emasTerang} fontFamily={JUDUL} fontWeight={800} fontSize={72} />
    </Rect>,
  );
  if (a.kredit) {
    wadah.add(
      <Txt
        text={a.kredit}
        fill={'#5b6b62'}
        fontFamily={BADAN}
        fontWeight={500}
        fontSize={26}
        lineHeight={34}
        textAlign={'center'}
        textWrap
        width={900}
        y={470}
      />,
    );
  }
  return function* (durasi) {
    yield* all(
      logo().scale(1, 0.6, easeOutBack),
      delay(0.25, teks().opacity(1, 0.35)),
      delay(0.5, all(url().opacity(1, 0.3), url().scale(1, 0.5, easeOutBack))),
      waitFor(durasi),
    );
  };
}

/** Subtitle 1–3 kata per potongan; kata yang sedang diucapkan disorot emas. */
function* jalankanSubtitle(wadah: Layout, kata: Kata[]): ThreadGenerator {
  const potongan: Kata[][] = [];
  for (const k of kata) {
    const akhir = potongan.at(-1);
    const prev = akhir?.at(-1);
    const putus =
      !akhir ||
      akhir.length >= 3 ||
      (prev && /[.,!?;:]$/.test(prev.teks)) ||
      (prev && k.a - prev.b > 0.45) ||
      (prev && k.adegan !== prev.adegan);
    if (putus) potongan.push([k]);
    else akhir!.push(k);
  }

  let t = 0;
  const tunggu = function* (sampai: number): ThreadGenerator {
    if (sampai > t) {
      yield* waitFor(sampai - t);
      t = sampai;
    }
  };

  for (let i = 0; i < potongan.length; i++) {
    const p = potongan[i];
    yield* tunggu(p[0].a);
    wadah.removeChildren();
    const refs = p.map((k) => {
      const r = createRef<Txt>();
      wadah.add(
        <Txt
          ref={r}
          text={k.teks}
          fill={C.putih}
          fontFamily={JUDUL}
          fontWeight={800}
          fontSize={76}
          stroke={'#03140c'}
          lineWidth={14}
          strokeFirst
          lineJoin={'round'}
        />,
      );
      return r;
    });
    for (let j = 0; j < p.length; j++) {
      yield* tunggu(p[j].a);
      refs.forEach((r, x) => r().fill(x === j ? C.emasTerang : C.putih));
    }
    const selesai = p.at(-1)!.b;
    const berikut = potongan[i + 1]?.[0].a ?? selesai + 0.5;
    if (berikut - selesai > 0.35) {
      yield* tunggu(selesai + 0.15);
      wadah.removeChildren();
    }
  }
}
