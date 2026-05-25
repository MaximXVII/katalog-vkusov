// Все TypeScript типы проекта — центральный файл

// ============================================================
// Recipe
// ============================================================

export interface Recipe {
  id: string
  slug: string
  title: string
  description: string
  imageUrl: string
  prepTime: number
  cookTime: number
  difficulty: Difficulty
  ingredients: Ingredient[]
  steps: RecipeStep[]
  tags: Tag[]
  published: boolean
  isOriginal: boolean
  createdAt: Date
  updatedAt: Date
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Ingredient {
  name: string
  amount: string
  unit?: string
}

export interface RecipeStep {
  type?: 'step' | 'divider'
  stepNumber?: number
  text: string
  emoji?: string
  imageUrl?: string
}

export type RecipeCard = Pick<
  Recipe,
  'id' | 'slug' | 'title' | 'description' | 'imageUrl' | 'prepTime' | 'cookTime' | 'difficulty' | 'tags' | 'isOriginal'
>

// ============================================================
// Tags & Categories
// ============================================================

// Slug категории — теперь произвольная строка (не enum)
export type TagCategorySlug = string

export interface Tag {
  id: string
  slug: string
  name: string
  category: TagCategorySlug
}

export interface TagCategory {
  id: string
  name: string
  slug: string
  displayOrder: number
  icon?: string
  tags: Tag[]
  recipes?: RecipeCard[]
}

// ============================================================
// API responses
// ============================================================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface ApiError {
  error: string
}
