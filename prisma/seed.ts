import { PrismaClient, Difficulty, TagCategorySlug } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаю заполнение базы данных...')

  // ============================================================
  // 1. Категории для Netflix-меню
  // ============================================================
  await prisma.tagCategoryGroup.deleteMany()
  const categories = [
    { name: 'По главному ингредиенту', slug: TagCategorySlug.ingredient, displayOrder: 1, icon: '🥩' },
    { name: 'По стране кухни',         slug: TagCategorySlug.cuisine,    displayOrder: 2, icon: '🌍' },
    { name: 'По типу блюда',           slug: TagCategorySlug.type,       displayOrder: 3, icon: '🍽️' },
    { name: 'По сложности',            slug: TagCategorySlug.difficulty,  displayOrder: 4, icon: '⭐' },
    { name: 'По стоимости',            slug: TagCategorySlug.cost,       displayOrder: 5, icon: '💰' },
  ]
  for (const cat of categories) {
    await prisma.tagCategoryGroup.create({ data: cat })
  }
  console.log('✅ Категории созданы')

  // ============================================================
  // 2. Теги (последовательно — избегаем конфликт PgBouncer)
  // ============================================================
  await prisma.recipeTag.deleteMany()
  await prisma.tag.deleteMany()

  const tagsData = [
    { slug: 'svinina',        name: 'Свинина',       category: TagCategorySlug.ingredient },
    { slug: 'govyadina',      name: 'Говядина',      category: TagCategorySlug.ingredient },
    { slug: 'kurica',         name: 'Курица',        category: TagCategorySlug.ingredient },
    { slug: 'ryba',           name: 'Рыба',          category: TagCategorySlug.ingredient },
    { slug: 'ovoshi',         name: 'Овощи',         category: TagCategorySlug.ingredient },
    { slug: 'moreproduktы',   name: 'Морепродукты',  category: TagCategorySlug.ingredient },
    { slug: 'tvorog',         name: 'Творог',        category: TagCategorySlug.ingredient },
    { slug: 'yajtsa',         name: 'Яйца',          category: TagCategorySlug.ingredient },
    { slug: 'russkaya',       name: 'Русская',       category: TagCategorySlug.cuisine },
    { slug: 'italyanskaya',   name: 'Итальянская',   category: TagCategorySlug.cuisine },
    { slug: 'francuzskaya',   name: 'Французская',   category: TagCategorySlug.cuisine },
    { slug: 'yaponskaya',     name: 'Японская',      category: TagCategorySlug.cuisine },
    { slug: 'tajskaya',       name: 'Тайская',       category: TagCategorySlug.cuisine },
    { slug: 'amerikanskaya',  name: 'Американская',  category: TagCategorySlug.cuisine },
    { slug: 'grecheskaya',    name: 'Греческая',     category: TagCategorySlug.cuisine },
    { slug: 'kitajskaya',     name: 'Китайская',     category: TagCategorySlug.cuisine },
    { slug: 'sup',            name: 'Суп',           category: TagCategorySlug.type },
    { slug: 'salat',          name: 'Салат',         category: TagCategorySlug.type },
    { slug: 'goryachee',      name: 'Горячее',       category: TagCategorySlug.type },
    { slug: 'desert',         name: 'Десерт',        category: TagCategorySlug.type },
    { slug: 'zakuska',        name: 'Закуска',       category: TagCategorySlug.type },
    { slug: 'pasta',          name: 'Паста',         category: TagCategorySlug.type },
    { slug: 'prostoe',        name: 'Простое',       category: TagCategorySlug.difficulty },
    { slug: 'srednee',        name: 'Среднее',       category: TagCategorySlug.difficulty },
    { slug: 'slozhnoe',       name: 'Сложное',       category: TagCategorySlug.difficulty },
    { slug: 'deshevoe',       name: 'Дешёвое',       category: TagCategorySlug.cost },
    { slug: 'srednyaya-cena', name: 'Средняя цена',  category: TagCategorySlug.cost },
    { slug: 'dorogoe',        name: 'Дорогое',       category: TagCategorySlug.cost },
  ]

  const tag: Record<string, { id: string }> = {}
  for (const t of tagsData) {
    const created = await prisma.tag.create({ data: t })
    tag[t.slug] = created
  }
  console.log(`✅ Создано тегов: ${tagsData.length}`)

  // ============================================================
  // 3. Рецепты
  // ============================================================
  await prisma.recipeTag.deleteMany()
  await prisma.recipe.deleteMany()

  const recipes = [
    {
      slug: 'borsh-klassicheskij',
      title: 'Борщ классический',
      description: 'Наваристый украинский борщ со свининой, свёклой и сметаной. Согревает душу и тело.',
      imageUrl: '',
      prepTime: 30, cookTime: 90,
      difficulty: Difficulty.medium, published: true,
      ingredients: [
        { name: 'Свинина на кости', amount: '500', unit: 'г' },
        { name: 'Свёкла', amount: '2', unit: 'шт' },
        { name: 'Капуста белокочанная', amount: '300', unit: 'г' },
        { name: 'Картофель', amount: '3', unit: 'шт' },
        { name: 'Морковь', amount: '1', unit: 'шт' },
        { name: 'Лук репчатый', amount: '1', unit: 'шт' },
        { name: 'Томатная паста', amount: '2', unit: 'ст. л.' },
        { name: 'Чеснок', amount: '3', unit: 'зубчика' },
        { name: 'Сметана', amount: '100', unit: 'г' },
      ],
      steps: [
        { stepNumber: 1, text: 'Залей свинину холодной водой (2.5 л), доведи до кипения, сними пену. Вари на малом огне 1 час.' },
        { stepNumber: 2, text: 'Свёклу нарежь соломкой, обжарь на масле 5 минут, добавь томатную пасту и уксус. Туши ещё 10 минут.' },
        { stepNumber: 3, text: 'Достань мясо из бульона, разбери на куски. В бульон добавь нарезанный картофель, вари 10 минут.' },
        { stepNumber: 4, text: 'Добавь нашинкованную капусту, морковь и лук. Вари 7 минут.' },
        { stepNumber: 5, text: 'Добавь тушёную свёклу и мясо. Провари 5 минут. Добавь чеснок, лавровый лист, соль и перец.' },
        { stepNumber: 6, text: 'Выключи огонь, накрой крышкой. Дай настояться 20 минут. Подавай со сметаной.' },
      ],
      tagSlugs: ['svinina', 'ovoshi', 'russkaya', 'sup', 'srednee', 'deshevoe'],
    },
    {
      slug: 'pasta-karbonara',
      title: 'Паста Карбонара',
      description: 'Классическая римская паста с гуанчале, яйцами и Пекорино Романо. Никаких сливок.',
      imageUrl: '',
      prepTime: 10, cookTime: 20,
      difficulty: Difficulty.medium, published: true,
      ingredients: [
        { name: 'Спагетти', amount: '400', unit: 'г' },
        { name: 'Гуанчале или панчетта', amount: '200', unit: 'г' },
        { name: 'Яйца', amount: '4', unit: 'шт' },
        { name: 'Пекорино Романо', amount: '100', unit: 'г' },
        { name: 'Чёрный перец', amount: '', unit: 'по вкусу' },
      ],
      steps: [
        { stepNumber: 1, text: 'Отвари спагетти в подсоленной воде до аль денте. Сохрани стакан воды от варки.' },
        { stepNumber: 2, text: 'Нарежь гуанчале кубиками, обжарь на сухой сковороде до хрустящей корочки. Убери с огня.' },
        { stepNumber: 3, text: 'Смешай яйца, тёртый Пекорино и много чёрного перца в миске.' },
        { stepNumber: 4, text: 'Переложи горячие спагетти в сковороду к гуанчале (огонь выключен!). Добавь немного воды от варки.' },
        { stepNumber: 5, text: 'Вылей яично-сырную смесь, быстро перемешай до кремового соуса. Подавай немедленно.' },
      ],
      tagSlugs: ['svinina', 'yajtsa', 'italyanskaya', 'pasta', 'srednee', 'srednyaya-cena'],
    },
    {
      slug: 'salat-tsezar-s-kuritsej',
      title: 'Салат Цезарь с курицей',
      description: 'Хрустящий романо с сочной куриной грудкой, крутонами и классическим соусом с анчоусами.',
      imageUrl: '',
      prepTime: 20, cookTime: 15,
      difficulty: Difficulty.easy, published: true,
      ingredients: [
        { name: 'Куриная грудка', amount: '2', unit: 'шт' },
        { name: 'Салат Романо', amount: '1', unit: 'кочан' },
        { name: 'Пармезан', amount: '50', unit: 'г' },
        { name: 'Хлеб для крутонов', amount: '2', unit: 'ломтика' },
        { name: 'Майонез', amount: '3', unit: 'ст. л.' },
        { name: 'Анчоусы', amount: '3', unit: 'филе' },
        { name: 'Лимонный сок', amount: '1', unit: 'ст. л.' },
      ],
      steps: [
        { stepNumber: 1, text: 'Куриную грудку смажь оливковым маслом, посоли, поперчи. Жарь на гриль-сковороде 6-7 минут с каждой стороны.' },
        { stepNumber: 2, text: 'Хлеб нарежь кубиками, обжарь с чесноком и маслом до золотистого цвета.' },
        { stepNumber: 3, text: 'Приготовь соус: разотри анчоусы с чесноком, смешай с майонезом и лимонным соком.' },
        { stepNumber: 4, text: 'Листья романо порви руками. Нарежь курицу, выложи на салат. Добавь крутоны.' },
        { stepNumber: 5, text: 'Полей соусом, посыпь тёртым пармезаном. Подавай сразу.' },
      ],
      tagSlugs: ['kurica', 'amerikanskaya', 'salat', 'prostoe', 'srednyaya-cena'],
    },
    {
      slug: 'tom-yam-s-krevetkami',
      title: 'Том Ям с креветками',
      description: 'Острый тайский суп с кокосовым молоком, лемонграссом и тигровыми креветками.',
      imageUrl: '',
      prepTime: 20, cookTime: 25,
      difficulty: Difficulty.hard, published: true,
      ingredients: [
        { name: 'Тигровые креветки', amount: '400', unit: 'г' },
        { name: 'Кокосовое молоко', amount: '400', unit: 'мл' },
        { name: 'Куриный бульон', amount: '600', unit: 'мл' },
        { name: 'Лемонграсс', amount: '2', unit: 'стебля' },
        { name: 'Паста том-ям', amount: '2', unit: 'ст. л.' },
        { name: 'Рыбный соус', amount: '2', unit: 'ст. л.' },
        { name: 'Лайм', amount: '1', unit: 'шт' },
        { name: 'Шампиньоны', amount: '150', unit: 'г' },
      ],
      steps: [
        { stepNumber: 1, text: 'Лемонграсс разбей тупой стороной ножа, нарежь на отрезки 4 см.' },
        { stepNumber: 2, text: 'В кастрюле доведи бульон до кипения. Добавь лемонграсс, пасту том-ям. Вари 5 минут.' },
        { stepNumber: 3, text: 'Влей кокосовое молоко, добавь нарезанные грибы. Вари ещё 5 минут.' },
        { stepNumber: 4, text: 'Добавь очищенные креветки, рыбный соус. Вари 3-4 минуты до розового цвета.' },
        { stepNumber: 5, text: 'Сними с огня, добавь сок лайма. Подавай с варёным рисом.' },
      ],
      tagSlugs: ['moreproduktы', 'tajskaya', 'sup', 'slozhnoe', 'dorogoe'],
    },
    {
      slug: 'domashnie-pelmeni',
      title: 'Домашние пельмени',
      description: 'Настоящие пельмени с тонким тестом и сочной начинкой из свинины и говядины.',
      imageUrl: '',
      prepTime: 90, cookTime: 15,
      difficulty: Difficulty.hard, published: true,
      ingredients: [
        { name: 'Мука', amount: '500', unit: 'г' },
        { name: 'Яйцо', amount: '1', unit: 'шт' },
        { name: 'Вода', amount: '200', unit: 'мл' },
        { name: 'Свинина', amount: '300', unit: 'г' },
        { name: 'Говядина', amount: '200', unit: 'г' },
        { name: 'Лук репчатый', amount: '2', unit: 'шт' },
        { name: 'Сливочное масло', amount: '50', unit: 'г' },
      ],
      steps: [
        { stepNumber: 1, text: 'Замеси тесто: муку просей горкой, вбей яйцо, добавь холодную воду и щепотку соли. Вымешивай 10 минут. Дай отдохнуть 30 минут.' },
        { stepNumber: 2, text: 'Прокрути свинину и говядину через мясорубку вместе с луком. Посоли, поперчи, добавь 2 ст. л. холодной воды.' },
        { stepNumber: 3, text: 'Раскатай тесто очень тонко (1-2 мм). Вырежи кружки стаканом диаметром 6-7 см.' },
        { stepNumber: 4, text: 'На каждый кружок положи чайную ложку фарша. Сложи пополам, защипни края. Соедини концы.' },
        { stepNumber: 5, text: 'Вари в подсоленной воде 7-8 минут после всплытия. Подавай со сметаной.' },
      ],
      tagSlugs: ['svinina', 'govyadina', 'yajtsa', 'russkaya', 'goryachee', 'slozhnoe', 'deshevoe'],
    },
    {
      slug: 'grecheskij-salat',
      title: 'Греческий салат',
      description: 'Классический хориатики — помидоры, огурцы, оливки и фета. Никаких лишних ингредиентов.',
      imageUrl: '',
      prepTime: 15, cookTime: 0,
      difficulty: Difficulty.easy, published: true,
      ingredients: [
        { name: 'Помидоры крупные', amount: '3', unit: 'шт' },
        { name: 'Огурец', amount: '1', unit: 'шт' },
        { name: 'Перец болгарский', amount: '1', unit: 'шт' },
        { name: 'Маслины без косточек', amount: '100', unit: 'г' },
        { name: 'Сыр фета', amount: '200', unit: 'г' },
        { name: 'Оливковое масло', amount: '3', unit: 'ст. л.' },
        { name: 'Орегано', amount: '1', unit: 'ч. л.' },
      ],
      steps: [
        { stepNumber: 1, text: 'Помидоры нарежь крупными кусками. Огурец — полукольцами, не чисти.' },
        { stepNumber: 2, text: 'Перец нарежь кольцами, красный лук — тонкими полукольцами. Выложи всё в миску. Добавь маслины.' },
        { stepNumber: 3, text: 'Фету положи целым куском сверху. Полей оливковым маслом, посыпь орегано и щепоткой соли.' },
        { stepNumber: 4, text: 'Не перемешивай сразу — подавай, и пусть каждый разбирает сам.' },
      ],
      tagSlugs: ['ovoshi', 'grecheskaya', 'salat', 'prostoe', 'deshevoe'],
    },
    {
      slug: 'steak-ribaj',
      title: 'Стейк Рибай',
      description: 'Сочный стейк с мраморной говядиной, тимьяном и чесночным маслом. Прожарка Medium Rare.',
      imageUrl: '',
      prepTime: 10, cookTime: 15,
      difficulty: Difficulty.medium, published: true,
      ingredients: [
        { name: 'Стейк рибай', amount: '400', unit: 'г (2 см толщиной)' },
        { name: 'Сливочное масло', amount: '50', unit: 'г' },
        { name: 'Чеснок', amount: '3', unit: 'зубчика' },
        { name: 'Тимьян свежий', amount: '3', unit: 'веточки' },
        { name: 'Соль крупная, чёрный перец', amount: '', unit: 'по вкусу' },
      ],
      steps: [
        { stepNumber: 1, text: 'Достань стейк из холодильника за 30 минут. Обсуши бумажным полотенцем — это критично для корочки.' },
        { stepNumber: 2, text: 'Раскали чугунную сковороду до максимума. Стейк смажь маслом, щедро посоли и поперчи.' },
        { stepNumber: 3, text: 'Выложи стейк. Не двигай 3 минуты. Переверни, жарь ещё 3 минуты.' },
        { stepNumber: 4, text: 'Добавь сливочное масло, чеснок и тимьян. Поливай стейк растопленным маслом 1-2 минуты.' },
        { stepNumber: 5, text: 'Переложи на доску, дай отдохнуть 5 минут. Нарежь поперёк волокон.' },
      ],
      tagSlugs: ['govyadina', 'amerikanskaya', 'goryachee', 'srednee', 'dorogoe'],
    },
    {
      slug: 'tiramisu',
      title: 'Тирамису',
      description: 'Нежный итальянский десерт с маскарпоне, савоярди и эспрессо. Без выпечки.',
      imageUrl: '',
      prepTime: 30, cookTime: 0,
      difficulty: Difficulty.easy, published: true,
      ingredients: [
        { name: 'Печенье Савоярди', amount: '300', unit: 'г' },
        { name: 'Маскарпоне', amount: '500', unit: 'г' },
        { name: 'Сливки 33%', amount: '200', unit: 'мл' },
        { name: 'Сахарная пудра', amount: '100', unit: 'г' },
        { name: 'Эспрессо крепкий', amount: '300', unit: 'мл' },
        { name: 'Ром или амаретто', amount: '2', unit: 'ст. л.' },
        { name: 'Какао-порошок', amount: '', unit: 'для подачи' },
      ],
      steps: [
        { stepNumber: 1, text: 'Взбей холодные сливки до мягких пиков. Отдельно взбей маскарпоне с сахарной пудрой.' },
        { stepNumber: 2, text: 'Аккуратно соедини сливки и маскарпоне лопаткой — движениями снизу вверх.' },
        { stepNumber: 3, text: 'Смешай остывший эспрессо с ромом. Быстро окунай савоярди (1-2 секунды) и укладывай в форму.' },
        { stepNumber: 4, text: 'Покрой кремом. Повтори слои: савоярди — крем. Убери в холодильник минимум на 6 часов.' },
        { stepNumber: 5, text: 'Перед подачей просей какао. Нарежь на порции.' },
      ],
      tagSlugs: ['tvorog', 'italyanskaya', 'desert', 'prostoe', 'srednyaya-cena'],
    },
    {
      slug: 'kurica-v-slivochnom-souse',
      title: 'Курица в сливочном соусе',
      description: 'Нежное куриное филе в густом сливочно-чесночном соусе с пармезаном. Готовится за 30 минут.',
      imageUrl: '',
      prepTime: 10, cookTime: 25,
      difficulty: Difficulty.easy, published: true,
      ingredients: [
        { name: 'Куриное филе', amount: '600', unit: 'г' },
        { name: 'Сливки 20%', amount: '300', unit: 'мл' },
        { name: 'Пармезан', amount: '50', unit: 'г' },
        { name: 'Чеснок', amount: '4', unit: 'зубчика' },
        { name: 'Лук репчатый', amount: '1', unit: 'шт' },
        { name: 'Сливочное масло', amount: '30', unit: 'г' },
        { name: 'Тимьян', amount: '1', unit: 'ч. л.' },
      ],
      steps: [
        { stepNumber: 1, text: 'Куриное филе нарежь на медальоны 1.5 см, слегка отбей. Посоли и поперчи.' },
        { stepNumber: 2, text: 'Обжарь на сливочном масле по 3 минуты с каждой стороны до золотистой корочки. Убери со сковороды.' },
        { stepNumber: 3, text: 'На той же сковороде обжарь лук до мягкости. Добавь чеснок, жарь ещё минуту.' },
        { stepNumber: 4, text: 'Влей сливки, добавь тимьян. Вари 3-4 минуты. Добавь пармезан, перемешай.' },
        { stepNumber: 5, text: 'Верни курицу в соус, туши 5-7 минут. Подавай с пастой или рисом.' },
      ],
      tagSlugs: ['kurica', 'francuzskaya', 'goryachee', 'prostoe', 'srednyaya-cena'],
    },
    {
      slug: 'xummus-klassicheskij',
      title: 'Хумус классический',
      description: 'Нежный хумус из нута с тахини, лимоном и чесноком. Идеальная закуска для любого стола.',
      imageUrl: '',
      prepTime: 15, cookTime: 60,
      difficulty: Difficulty.easy, published: true,
      ingredients: [
        { name: 'Нут сухой', amount: '250', unit: 'г' },
        { name: 'Тахини', amount: '3', unit: 'ст. л.' },
        { name: 'Лимон', amount: '1', unit: 'шт' },
        { name: 'Чеснок', amount: '2', unit: 'зубчика' },
        { name: 'Оливковое масло', amount: '3', unit: 'ст. л.' },
        { name: 'Тмин молотый', amount: '0.5', unit: 'ч. л.' },
        { name: 'Паприка', amount: '', unit: 'для подачи' },
      ],
      steps: [
        { stepNumber: 1, text: 'Замочи нут в холодной воде на ночь. Слей воду, вари в новой воде 1-1.5 часа до мягкости. Сохрани стакан воды.' },
        { stepNumber: 2, text: 'Горячий нут пересыпь в блендер. Добавь тахини, сок лимона, чеснок, тмин и соль.' },
        { stepNumber: 3, text: 'Взбивай 3-4 минуты, постепенно добавляя воду от варки до гладкой консистенции.' },
        { stepNumber: 4, text: 'Выложи в тарелку, сделай углубление. Влей оливковое масло, посыпь паприкой. Подавай с питой.' },
      ],
      tagSlugs: ['ovoshi', 'grecheskaya', 'zakuska', 'prostoe', 'deshevoe'],
    },
  ]

  for (const recipeData of recipes) {
    const { tagSlugs, ...data } = recipeData
    const recipe = await prisma.recipe.create({
      data: {
        ...data,
        ingredients: data.ingredients as object[],
        steps: data.steps as object[],
        tags: {
          create: tagSlugs
            .filter((slug) => tag[slug])
            .map((slug) => ({ tag: { connect: { id: tag[slug].id } } })),
        },
      },
    })
    console.log(`  ✅ ${recipe.title}`)
  }

  const recipeCount = await prisma.recipe.count()
  const tagCount = await prisma.tag.count()
  const catCount = await prisma.tagCategoryGroup.count()

  console.log(`\n🎉 Готово! В базе данных:`)
  console.log(`   Рецептов:   ${recipeCount}`)
  console.log(`   Тегов:      ${tagCount}`)
  console.log(`   Категорий:  ${catCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Ошибка seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
