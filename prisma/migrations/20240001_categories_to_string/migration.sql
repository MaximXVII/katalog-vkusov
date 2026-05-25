-- Миграция: TagCategorySlug enum → String
-- Запускать: npx prisma migrate dev  ИЛИ вручную в Supabase SQL Editor

-- 1. Конвертируем колонку Tag.category из enum в text
ALTER TABLE "Tag" ALTER COLUMN "category" TYPE TEXT;

-- 2. Конвертируем колонку TagCategoryGroup.slug из enum в text  
ALTER TABLE "TagCategoryGroup" ALTER COLUMN "slug" TYPE TEXT;

-- 3. Удаляем enum тип (больше не нужен)
DROP TYPE IF EXISTS "TagCategorySlug";
