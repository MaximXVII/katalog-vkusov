/**
 * Запуск: npx tsx scripts/add-recipe.ts
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } })

const RECIPE = {
  title: 'Рамен сёю классический',
  slug: 'ramen-soyu-klassicheskiy',
  description: 'Рамен сёю (Shoyu Ramen / 醤油ラーメン) — одно из самых сложных блюд японской кухни, несмотря на то что воспринимается как простая лапша с бульоном. Основа рамена — тарэ (концентрированная приправа) и богатый бульон, которые варятся часами. В Японии существуют целые школы рамена с региональными различиями: хаката-рамен из Фукуоки отличается от саппоро-рамена так же, как борщ от окрошки. Рецепт — классический сёю-рамен (соевый), самый распространённый стиль в Токио.\n\nNOTES: Рамен — это сборка из нескольких отдельно приготовленных элементов. Всё можно сделать заранее: бульон и чашу хранятся в холодильнике до 3 дней. Комбу нельзя кипятить — даёт горечь, только медленное томление. Яйца аджицукэ должны мариноваться минимум 4 часа, идеально — ночь. Лапшу варят отдельно и кладут в тарелку последней — она не должна разбухать в бульоне до подачи.',
  prepTime: 30,
  cookTime: 150,
  difficulty: 'hard' as 'easy' | 'medium' | 'hard',
  published: false,
  isOriginal: false,
  imageUrl: '',
  ingredients: [
    { name: 'Куриные каркасы (спинка, крылья, шея)', amount: '400', unit: 'г' },
    { name: 'Вода', amount: '1', unit: 'л' },
    { name: 'Чеснок (целая головка)', amount: '0.5', unit: 'шт.' },
    { name: 'Имбирь свежий', amount: '15', unit: 'г' },
    { name: 'Комбу (сушёная водоросль)', amount: '1', unit: 'г' },
    { name: 'Свиная грудинка (чашу)', amount: '200', unit: 'г' },
    { name: 'Соевый соус (чашу)', amount: '30', unit: 'мл' },
    { name: 'Мирин (чашу)', amount: '15', unit: 'мл' },
    { name: 'Сахар (чашу)', amount: '7.5', unit: 'г' },
    { name: 'Яйца куриные (аджицукэ)', amount: '2', unit: 'шт.' },
    { name: 'Соевый соус (тарэ)', amount: '25', unit: 'мл' },
    { name: 'Мирин (тарэ)', amount: '10', unit: 'мл' },
    { name: 'Чеснок (тарэ)', amount: '1', unit: 'зубчик' },
    { name: 'Лапша рамен', amount: '90', unit: 'г' },
    { name: 'Нори (морская капуста)', amount: '1', unit: 'шт.' },
    { name: 'Зелёный лук', amount: '1', unit: 'шт.' },
    { name: 'Кунжут (менкома или наруто)', amount: '0.5', unit: 'ч.л.' },
  ],
  steps: [
    { type: 'divider', emoji: '🥘', text: 'Бульон' },
    { type: 'step', text: 'Залей **куриные каркасы** холодной водой и доведи до кипения. Слей воду, промой кости и залей чистой. Снова залей 2 л свежей воды, добавь **чеснок** целиком и **имбирь**. Доведи до кипения, затем добавь **комбу** и убавь огонь до минимального. Томи **1,5–2 часа** без кипения. Процеди через мелкое сито.' },
    { type: 'divider', emoji: '🫙', text: 'Чашу' },
    { type: 'step', text: 'Смешай **соевый соус**, **мирин** и **сахар** в кастрюле и доведи до кипения. Убавь огонь, положи **свиную грудинку** и томи **45 минут**. Дай остыть, нарежь поперёк волокон пластами **1 см**. Маринад оставь для яиц.' },
    { type: 'divider', emoji: '⏲️', text: 'Яйца аджицукэ' },
    { type: 'step', text: 'Свари **яйца** в кипящей воде ровно **7 минут**. Переложи в ледяную воду на **5 минут**, затем очисти. Положи в зип-пакет вместе с маринадом от чашу. Маринуй минимум **4 часа**, идеально — ночь.' },
    { type: 'divider', emoji: '🧂', text: 'Сёю тарэ' },
    { type: 'step', text: 'Разогрей сковороду без масла. Обжарь **чеснок** **30 секунд**. Добавь **соевый соус** и **мирин**, прогрей **2 минуты**. Сними с огня — тарэ должна быть ароматной и насыщенной.' },
    { type: 'divider', emoji: '🍳', text: 'Лапша' },
    { type: 'step', text: 'Отвари **лапшу рамен** согласно инструкции на упаковке **до альденте**. Промой холодной водой.' },
    { type: 'divider', emoji: '🍽️', text: 'Сборка' },
    { type: 'step', text: 'В каждую тарелку налей 2 ст.л. тарэ, затем 300 мл горячего **бульона** и перемешай. Выложи **лапшу**. Сверху разложи пласты **чашу**, половинку **яйца** разрезанного вдоль, лист **нори**, **зелёный лук** и **кунжут**. Подавай немедленно.' },
  ],
  tagSlugs: [
    'svinina', 'yaponskaya', 'sup', 'slozhnoe', 'srednyaya-cena',
    'populyarnoe', 'varenoe', 'teploe', 'restorannoe', 'vysokokalorijnoe',
  ],
}

async function main() {
  console.log(`\n➕ Добавляю рецепт: "${RECIPE.title}"`);
  const existing = await prisma.recipe.findUnique({ where: { slug: RECIPE.slug } });
  if (existing) { console.error(`❌ slug "${RECIPE.slug}" уже существует`); process.exit(1); }
  let tagIds: string[] = [];
  if (RECIPE.tagSlugs.length > 0) {
    const tags = await prisma.tag.findMany({ where: { slug: { in: RECIPE.tagSlugs } }, select: { id: true, slug: true } });
    const missing = RECIPE.tagSlugs.filter(s => !tags.map(t => t.slug).includes(s));
    if (missing.length > 0) console.warn(`⚠️  Теги не найдены: ${missing.join(', ')}`);
    tagIds = tags.map(t => t.id);
  }
  const recipe = await prisma.$transaction(async (tx) => {
    const created = await tx.recipe.create({ data: {
      title: RECIPE.title, slug: RECIPE.slug, description: RECIPE.description,
      imageUrl: RECIPE.imageUrl, prepTime: RECIPE.prepTime, cookTime: RECIPE.cookTime,
      difficulty: RECIPE.difficulty, ingredients: RECIPE.ingredients,
      steps: RECIPE.steps, published: RECIPE.published, isOriginal: RECIPE.isOriginal,
    }});
    if (tagIds.length > 0) await tx.recipeTag.createMany({ data: tagIds.map(tagId => ({ recipeId: created.id, tagId })), skipDuplicates: true });
    return created;
  });
  console.log(`✅ Готово! slug=${recipe.slug} | теги=${tagIds.length} | http://localhost:3000/recipe/${recipe.slug}\n`);
}
main().catch(e => { console.error('❌', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
