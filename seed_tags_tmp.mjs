import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const categories = [
  { name: 'По главному ингредиенту', slug: 'ingredient',    icon: '🥩', displayOrder: 0 },
  { name: 'По стране кухни',         slug: 'cuisine',       icon: '🌍', displayOrder: 1 },
  { name: 'По типу блюда',           slug: 'type',          icon: '🍽️', displayOrder: 2 },
  { name: 'По сложности',            slug: 'difficulty',    icon: '⭐', displayOrder: 3 },
  { name: 'По стоимости',            slug: 'cost',          icon: '💰', displayOrder: 4 },
  { name: 'По популярности',         slug: 'popularity',    icon: '🔥', displayOrder: 5 },
  { name: 'По способу приготовления',slug: 'method',        icon: '🔧', displayOrder: 6 },
  { name: 'По температуре',          slug: 'temperature',   icon: '🌡️', displayOrder: 7 },
  { name: 'По формату',              slug: 'format',        icon: '🏷️', displayOrder: 8 },
  { name: 'По калориям',             slug: 'calories',      icon: '📊', displayOrder: 9 },
]

const tags = [
  { name: 'Говядина',        slug: 'beef',          category: 'ingredient'  },
  { name: 'США',             slug: 'usa',           category: 'cuisine'     },
  { name: 'Горячее',         slug: 'hot-dish',      category: 'type'        },
  { name: 'Среднее',         slug: 'medium-diff',   category: 'difficulty'  },
  { name: 'Дорогое',         slug: 'expensive',     category: 'cost'        },
  { name: 'Популярное',      slug: 'popular',       category: 'popularity'  },
  { name: 'Жареное',         slug: 'fried',         category: 'method'      },
  { name: 'Теплое',          slug: 'warm',          category: 'temperature' },
  { name: 'Ресторанное',     slug: 'restaurant',    category: 'format'      },
  { name: 'Высококалорийное',slug: 'high-calorie',  category: 'calories'    },
]

async function main() {
  // Создаём категории (upsert чтобы не падать если уже есть)
  for (const cat of categories) {
    await prisma.tagCategoryGroup.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    console.log('Category:', cat.slug)
  }

  // Создаём теги
  const tagIds = []
  for (const tag of tags) {
    const created = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: { name: tag.name, slug: tag.slug, category: tag.category, imageUrl: '' },
    })
    tagIds.push(created.id)
    console.log('Tag:', tag.slug, '->', created.id)
  }

  // Обновляем рецепт ribeye-steak
  const recipe = await prisma.recipe.findUnique({ where: { slug: 'ribeye-steak' } })
  if (!recipe) { console.error('Recipe not found!'); return }

  const description = `Рибай вырезается из реберной части туши (от 6-го по 12-е ребро), именно там сосредоточена самая обильная мраморность — жировые прожилки, которые при жарке тают и насыщают мясо изнутри. Само название происходит от английских слов rib (ребро) и eye (глаз) — "глазок" жира в центре среза является фирменным знаком этого отруба. Американские ковбои считали рибай лучшим куском и жарили его исключительно на открытом огне. Ключевое правило хорошего рибая: чем больше мраморность — тем сочнее результат, поэтому ищи говядину с оценкой не ниже Choice. Степени прожарки (стейк 3 см): Rare — 1,5 мин, Medium Rare — 2,5 мин, Medium — 3,5 мин, Medium Well — 5 мин. Классика для рибая — Medium Rare: внутренняя температура 54–57°C. Используй термометр-щуп, никогда не прокалывай вилкой.`

  await prisma.recipe.update({
    where: { slug: 'ribeye-steak' },
    data: { description },
  })
  console.log('Updated description')

  // Привязываем теги
  await prisma.recipeTag.deleteMany({ where: { recipeId: recipe.id } })
  await prisma.recipeTag.createMany({
    data: tagIds.map(tagId => ({ recipeId: recipe.id, tagId })),
    skipDuplicates: true,
  })
  console.log('Linked', tagIds.length, 'tags to recipe')
  console.log('DONE')
}

main().catch(console.error).finally(() => prisma.$disconnect())
