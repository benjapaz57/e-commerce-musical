// Datos iniciales: categorías, marcas y configuración editable.
// Es idempotente: se puede correr varias veces sin duplicar nada.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Taxonomía inicial: categoría → subcategorías. Se amplía desde el panel sin rediseñar.
const CATEGORIES: Record<string, string[]> = {
  Guitarras: ['Guitarras eléctricas', 'Guitarras acústicas', 'Guitarras electroacústicas', 'Guitarras clásicas'],
  Bajos: ['Bajos eléctricos', 'Bajos acústicos'],
  'Teclados y sintetizadores': ['Teclados', 'Sintetizadores', 'Pianos digitales', 'Controladores MIDI'],
  'Baterías y percusión': ['Baterías acústicas', 'Baterías electrónicas', 'Platillos', 'Percusión'],
  Vientos: ['Vientos de madera', 'Vientos de metal', 'Armónicas'],
  'Cuerdas orquestales': ['Violines', 'Violas', 'Violonchelos', 'Contrabajos'],
  'Instrumentos folklóricos': ['Charangos', 'Bombos legüeros', 'Quenas y sikus', 'Otros folklóricos'],
  Amplificadores: ['Amplificadores de guitarra', 'Amplificadores de bajo', 'Cabezales', 'Cajas y gabinetes'],
  'Pedales y efectos': ['Pedales', 'Pedaleras multiefecto', 'Procesadores'],
  'Estudio y grabación': ['Interfaces de audio', 'Monitores de estudio', 'Consolas', 'Auriculares'],
  'Sonido en vivo y micrófonos': ['Micrófonos', 'Bafles y parlantes', 'Potencias'],
  DJ: ['Controladoras', 'Bandejas', 'Mixers de DJ'],
  Accesorios: ['Estuches y fundas', 'Soportes', 'Cables', 'Repuestos y partes'],
};

const BRANDS = [
  'Fender', 'Squier', 'Gibson', 'Epiphone', 'Gretsch', 'PRS', 'Ibanez', 'ESP', 'LTD', 'Jackson',
  'Yamaha', 'Cort', 'Washburn', 'Takamine', 'Music Man', 'Warwick', 'Faim', 'Fonseca', 'Gracia',
  'Marshall', 'Vox', 'Orange', 'Peavey', 'Ampeg', 'Hartke', 'Fender Amps',
  'Boss', 'Line 6', 'Zoom', 'Electro-Harmonix', 'MXR', 'TC Electronic',
  'Roland', 'Korg', 'Casio', 'Nord', 'Arturia', 'Novation',
  'Pearl', 'Tama', 'Ludwig', 'Mapex', 'Zildjian', 'Sabian', 'Paiste',
  'Shure', 'Sennheiser', 'Audio-Technica', 'Behringer', 'Focusrite', 'PreSonus', 'Pioneer DJ',
];

// Valores iniciales editables desde el panel de administración (RF-9.7).
const SETTINGS: Record<string, unknown> = {
  arancel: { amountUsd: 2 },
  cotizacion: { provider: 'dolarapi', kind: 'blue', refreshMinutes: 30 },
  // Valores iniciales propuestos, a ajustar con uso real.
  limitesCuentasNuevas: { diasCuentaNueva: 30, publicacionesPorDia: 3, conversacionesPorDia: 10 },
};

async function main() {
  let order = 0;
  for (const [parentName, children] of Object.entries(CATEGORIES)) {
    const parent = await prisma.category.upsert({
      where: { slug: slugify(parentName) },
      update: { name: parentName, order },
      create: { name: parentName, slug: slugify(parentName), order },
    });
    order++;
    let childOrder = 0;
    for (const childName of children) {
      await prisma.category.upsert({
        where: { slug: slugify(childName) },
        update: { name: childName, parentId: parent.id, order: childOrder },
        create: { name: childName, slug: slugify(childName), parentId: parent.id, order: childOrder },
      });
      childOrder++;
    }
  }

  for (const name of BRANDS) {
    await prisma.brand.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) },
    });
  }

  for (const [key, value] of Object.entries(SETTINGS)) {
    // Solo crea: no pisa valores que un administrador ya haya cambiado.
    await prisma.appSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as object },
    });
  }

  const [cats, brands] = await Promise.all([prisma.category.count(), prisma.brand.count()]);
  console.log(`Seed listo: ${cats} categorías, ${brands} marcas, ${Object.keys(SETTINGS).length} ajustes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
