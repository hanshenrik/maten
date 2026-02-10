// Basic data types for the Maten app

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  servings: number;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  categories: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

export interface MealPlan {
  id: string;
  week: number;
  year: number;
  days: MealPlanDay[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MealPlanDay {
  day: string; // e.g., "Monday", "Tuesday"
  date: Date;
  meals: MealPlanMeal[];
}

export interface MealPlanMeal {
  type: "breakfast" | "lunch" | "dinner" | "snack";
  recipeId?: string;
  customMeal?: string;
  notes?: string;
}

export interface ShoppingList {
  id: string;
  items: ShoppingListItem[];
  createdAt: Date;
  updatedAt: Date;
  completed: boolean;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  completed: boolean;
  notes?: string;
}

export interface RefrigeratorItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expirationDate?: Date;
  notes?: string;
  addedAt: Date;
}
