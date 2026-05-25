# CLAUDE.md — Контекст проекта moi-recepti

> **Читай этот файл ПЕРВЫМ делом в каждом новом чате перед любой работой над проектом.**

---

## Стек и версии

| Технология | Версия |
|---|---|
| Next.js | 14.2.x (App Router) |
| React | 18.3.x |
| TypeScript | strict mode |
| Prisma ORM | 5.22.x |
| NextAuth.js | 4.24.x |
| Tailwind CSS | 3.x |
| Supabase | Storage + PostgreSQL |

---

## Структура проекта

```
moi-recepti/
  prisma/
    schema.prisma
  src/
    app/
      page.tsx                        glavnaya (katalog tegov + novinki)
      all/page.tsx                    vse retsepty s filtrami
      recipe/[slug]/page.tsx          stranitsa retsepta
      tag/[slug]/page.tsx             podborka po tegu
      search/page.tsx                 poisk
      bookmarks/page.tsx              zakladki (localStorage)
      about/page.tsx
      login/page.tsx
      admin/
        page.tsx                      dashboard
        tags/page.tsx                 upravlenie tegami + zagruzka kartinok
        recipe/new/page.tsx
        recipe/[id]/edit/page.tsx
      api/
        admin/recipes/route.ts        GET, POST
        admin/recipes/[id]/route.ts   GET, PUT, DELETE
        admin/tags/route.ts           GET, POST
        admin/tags/[id]/route.ts      PUT, DELETE
        admin/upload/route.ts         zagruzka faylov v Supabase Storage
        admin/categories/route.ts
        admin/categories/[id]/route.ts
        auth/[...nextauth]/route.ts
        recipes/route.ts
        recipes/[slug]/route.ts
        recipes/[slug]/similar/route.ts
        recipes/random/route.ts
        search/route.ts
        tags/route.ts
        tags/[slug]/recipes/route.ts
    components/
      layout/
        Navbar.tsx                    sticky, kompaktnyy pri skrolle
        HomeHero.tsx
        FilterSidebar.tsx             filtry: vremya, originalnost, tegi
        MobileFilterDrawer.tsx        mobilnyy bottom-sheet (lg:hidden)
        SessionProvider.tsx
      recipe/
        RecipeCard.tsx                kartochka (bedzh isOriginal)
        HorizontalScroll.tsx          gorizontalnaya prokrutka
        IngredientsSection.tsx        umnozitel porsiy
        CookingMode.tsx               fullscreen rezhim (wakeLock, swipe, keyboard)
        PrintButton.tsx
        ShareButtons.tsx              Telegram + Copy link
        SimilarRecipesRow.tsx
        OriginalBadge.tsx
      ui/
        SearchBar.tsx                 compact (navbar) / full (search page)
        TagBadge.tsx                  tsvet cherez khesh category slug (10 palitr)
        BookmarkButton.tsx
        Pagination.tsx
        RandomRecipeButton.tsx
    lib/
      prisma.ts                       singleton PrismaClient
      auth.ts                         NextAuth authOptions
      admin-auth.ts                   proverka sessii v admin API
      constants.ts
      recipe-helpers.ts               recipeCardSelect, transformCard, parsePagination
      storage.ts                      Supabase Storage upload
      supabase.ts
      utils.ts                        cn(), formatTime(), TAG_CATEGORY_LABELS
    types/index.ts
    hooks/
      useBookmarks.ts
      useSearch.ts
```

---

## Prisma schema (klyuchevye modeli)

```prisma
model Recipe {
  id          String     @id @default(cuid())
  slug        String     @unique
  title       String
  description String
  imageUrl    String     @default("")
  prepTime    Int        @default(0)
  cookTime    Int        @default(0)
  difficulty  Difficulty @default(easy)
  ingredients Json       @default("[]")   // Ingredient[]
  steps       Json       @default("[]")   // RecipeStep[]
  published   Boolean    @default(false)
  isOriginal  Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  tags        RecipeTag[]
}

model Tag {
  id       String @id @default(cuid())
  slug     String @unique
  name     String
  category String  // sovpadaet s TagCategoryGroup.slug
  imageUrl String @default("")
  recipes  RecipeTag[]
}

model RecipeTag {
  recipeId String
  tagId    String
  @@id([recipeId, tagId])
}

model TagCategoryGroup {
  id           String  @id @default(cuid())
  name         String
  slug         String  @unique
  displayOrder Int     @default(0)
  icon         String?
}

enum Difficulty { easy medium hard }
```

---

## TypeScript tipy (src/types/index.ts)

```ts
interface RecipeStep {
  type?: 'step' | 'divider'   // divider = razdelitel sektsii
  stepNumber?: number
  text: string
  emoji?: string
  imageUrl?: string
}

interface Ingredient {
  name: string
  amount: string
  unit?: string
}
```

---

## Klyuchevye biznes-pravila

- **Shagi retsepta**: massiv `RecipeStep[]` v JSON. `type: 'divider'` — gorizontalnaya liniya s emoji. Zhirnyy tekst `**slovo**` → `<strong>`.
- **Tegi**: `Tag.category` — stroka = `TagCategoryGroup.slug`. Tsvet v `TagBadge` cherez khesh stroki (ne enum), vsegda tsvetnyy.
- **Kartinki tegov**: `Tag.imageUrl`. Na glavnoy — `aspect-[4/3]`, `object-cover`, gradient snizu. Bez kartinki — tsvetnyy fon s emoji.
- **Zakladki**: tolko `localStorage`.
- **isOriginal**: filtr `?original=true` rabotaet v `/all` i `/tag/[slug]` cherez Prisma WHERE.
- **maxTime filtr**: JS-side posle Prisma-zaprosa (Prisma ne umeet filtrovat po summe dvukh poley).
- **Sluchaynyy poryadok**: `shuffleArray()` na servere + `export const dynamic = 'force-dynamic'`.
- **Paginatsiya**: primenyaetsya POSLE JS-filtratsii (maxTime, zatem slice).
- **Tegi v retsepte**: `recipeTag.createMany` v `$transaction` s `skipDuplicates: true` (ne nested create — nenadyozhno pri 18+ tegakh).
- **Auth**: NextAuth credentials. Odin administrator. Rol `admin` v sessii.

---

## URL-parametry filtrov

| Parametr | Gde ispolzuetsya | Tip |
|---|---|---|
| `?tags=slug1,slug2` | /all, /tag/[slug] | Prisma WHERE AND |
| `?maxTime=20\|45\|90` | /all, /tag/[slug] | JS-filtr posle zaprosa |
| `?original=true` | /all, /tag/[slug] | Prisma WHERE isOriginal |
| `?page=N` | vsyudu | paginatsiya |
| `?q=tekst` | /search | fulltext |


---

## KRITICHESKIE PRAVILA napisaniya koda

### 1. Fayly s kirillitsey — TOLKO cherez Python

Instrumenty Edit/Write **portyat kirillitsu** (kodirovka + obrezanie faylov).

**VSEGDA** zapisyvay fayly cherez:
```bash
python3 - << 'EOF'
from pathlib import Path
content = (
    "stroka1\n"
    "stroka2\n"
)
Path("/sessions/vibrant-serene-dirac/mnt/Cooking/moi-recepti/src/...").write_text(content, encoding='utf-8')
EOF
```

Skleyay stroki cherez konkatenatsyu (`"chast1\n" "chast2\n"`), **ne** cherez troynye kavychki s kirillitsey vnutri.

### 2. Puti v bash otlichayutsya ot putey instrumentov

| Instrument | Put |
|---|---|
| Bash | `/sessions/vibrant-serene-dirac/mnt/Cooking/moi-recepti/...` |
| Read/Write/Edit | `C:\Users\Maxim\OneDrive\Dokumenter\Cooking Claude\Cooking\moi-recepti\...` |

### 3. Prisma posle izmeneniya schema

Posle lyubogo izmeneniya `schema.prisma`:
1. SQL-migratsiya v Supabase (Dashboard → SQL Editor)
2. `npx prisma generate` v direktorii proekta
3. Do `prisma generate` — ispolzovat `as never` dlya novykh poley: `imageUrl: true as never`

### 4. Direktorii s [id] v imeni

Fayly v papkakh tipa `[id]` ili `[slug]` — tozhye pishem cherez Python.

---

## Peremennye okruzheniya (.env.local)

```
DATABASE_URL=               # Supabase PostgreSQL (pooled)
DIRECT_URL=                 # Supabase PostgreSQL (direct, dlya migratsiy)
NEXTAUTH_URL=               # http://localhost:3000 ili prod URL
NEXTAUTH_SECRET=            # sluchaynaya stroka
ADMIN_EMAIL=                # email administratora
ADMIN_PASSWORD_HASH=        # bcrypt-khesh parolya
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_TELEGRAM_URL=   # ssylka na Telegram-kanal
```

---

## Komandy razrabotki

```bash
# v direktorii moi-recepti/
npm run dev         # zapusk dev-servera
npm run build       # production build
npx prisma studio   # GUI dlya BD
npx prisma generate # regeneratsiya klienta posle schema changes
```

---

## Chto uzhe realizovano

- Katalog retseptov s tegami-kategoriyami (glavnaya)
- Kartochki tegov s kartinkami na vsyu kartochku (aspect-[4/3], gradient)
- Stranitsa retsepta: ingredienty s umnozitelem, shagi s razdelitelyami i zhirnym tekstom
- Knopka "Raspechatat" + print-stili
- Knopki sheringa (Telegram + kopirovat ssylku)
- Rezhim gotovki (CookingMode): fullscreen, svaype, klaviatura, wakeLock
- Filtry: po vremeni, po tegam, po originalnosti (isOriginal)
- Mobilnyy bottom-sheet dlya filtrov
- Poisk (SearchBar): compact v navbar s dropdownom, full na /search
- Zakladki (localStorage + schetchik v navbar)
- Sluchaynyy retsept (knopka na glavnoy i /api/recipes/random)
- Pokhozhe retsepty (SimilarRecipesRow)
- Bedzh "Originalnyy retsept" na kartochkakh i stranitse retsepta
- Paginatsiya (24 retsepta na stranitsu)
- SEO: sitemap.xml, robots.txt, Schema.org JSON-LD, OpenGraph
- ISR (revalidate 60 sek) dlya retseptov, force-dynamic dlya spiskov
- Admin-panel: CRUD retseptov i tegov, zagruzka kartinok v Supabase Storage
- Zagruzka kartinok dlya tegov s preview v admin
- TagBadge: tsvet cherez khesh category (rabotaet dlya lyubogo sluga)
- Telegram-knopka v Navbar i HomeHero
- Avtorizatsiya (NextAuth credentials)

---

## Stil koda

- `cn()` iz `@/lib/utils` dlya uslovnykh klassov Tailwind
- `formatTime()` dlya otobrazheniya vremeni
- `recipeCardSelect` + `transformCard()` — standartnyy sposob vybrat kartochku
- Vse ID — stroki (cuid)
- Server Components vsyudu gde vozmozhno, `'use client'` tolko pri neobkhodimosti
