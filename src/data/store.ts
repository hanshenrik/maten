// Simple in-memory data store for the Maten app
import type { Recipe, MealPlan, ShoppingList } from "../types";

let recipes: Recipe[] = [];
let mealPlans: MealPlan[] = [];
let shoppingLists: ShoppingList[] = [];

// Recipe CRUD operations
export const getRecipes = (): Recipe[] => recipes;

export const getRecipeById = (id: string): Recipe | undefined => {
  return recipes.find((recipe) => recipe.id === id);
};

export const addRecipe = (recipe: Recipe): void => {
  recipes.push(recipe);
};

export const updateRecipe = (id: string, updatedRecipe: Recipe): boolean => {
  const index = recipes.findIndex((recipe) => recipe.id === id);
  if (index !== -1) {
    recipes[index] = updatedRecipe;
    return true;
  }
  return false;
};

export const deleteRecipe = (id: string): boolean => {
  const initialLength = recipes.length;
  recipes = recipes.filter((recipe) => recipe.id !== id);
  return recipes.length !== initialLength;
};

// Meal Plan CRUD operations
export const getMealPlans = (): MealPlan[] => mealPlans;

export const getMealPlanById = (id: string): MealPlan | undefined => {
  return mealPlans.find((plan) => plan.id === id);
};

export const addMealPlan = (plan: MealPlan): void => {
  mealPlans.push(plan);
};

export const updateMealPlan = (id: string, updatedPlan: MealPlan): boolean => {
  const index = mealPlans.findIndex((plan) => plan.id === id);
  if (index !== -1) {
    mealPlans[index] = updatedPlan;
    return true;
  }
  return false;
};

export const deleteMealPlan = (id: string): boolean => {
  const initialLength = mealPlans.length;
  mealPlans = mealPlans.filter((plan) => plan.id !== id);
  return mealPlans.length !== initialLength;
};

// Shopping List CRUD operations
export const getShoppingLists = (): ShoppingList[] => shoppingLists;

export const getShoppingListById = (id: string): ShoppingList | undefined => {
  return shoppingLists.find((list) => list.id === id);
};

export const addShoppingList = (list: ShoppingList): void => {
  shoppingLists.push(list);
};

export const updateShoppingList = (
  id: string,
  updatedList: ShoppingList,
): boolean => {
  const index = shoppingLists.findIndex((list) => list.id === id);
  if (index !== -1) {
    shoppingLists[index] = updatedList;
    return true;
  }
  return false;
};

export const deleteShoppingList = (id: string): boolean => {
  const initialLength = shoppingLists.length;
  shoppingLists = shoppingLists.filter((list) => list.id !== id);
  return shoppingLists.length !== initialLength;
};

// Initialize with some sample data
export const initializeSampleData = (): void => {
  const sampleRecipe: Recipe = {
    id: "recipe-1",
    title: "Spaghetti Carbonara",
    description:
      "Classic Italian pasta dish with eggs, cheese, pancetta, and black pepper.",
    ingredients: [
      {
        id: "ing-1",
        name: "Spaghetti",
        amount: 400,
        unit: "g",
        notes: "or other pasta",
      },
      {
        id: "ing-2",
        name: "Pancetta",
        amount: 150,
        unit: "g",
        notes: "or guanciale",
      },
      { id: "ing-3", name: "Eggs", amount: 4, unit: "large" },
      {
        id: "ing-4",
        name: "Pecorino Romano",
        amount: 100,
        unit: "g",
        notes: "grated",
      },
      {
        id: "ing-5",
        name: "Black pepper",
        amount: 1,
        unit: "tsp",
        notes: "freshly ground",
      },
    ],
    instructions: [
      "Cook spaghetti in salted boiling water until al dente.",
      "Fry pancetta in a pan until crispy.",
      "Whisk eggs with grated cheese and black pepper.",
      "Drain pasta and mix with pancetta.",
      "Remove from heat and quickly stir in egg mixture to create creamy sauce.",
      "Serve immediately with extra cheese and pepper.",
    ],
    servings: 4,
    prepTime: 10,
    cookTime: 15,
    categories: ["Italian", "Pasta", "Dinner"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleMealPlan: MealPlan = {
    id: "plan-1",
    week: 1,
    year: new Date().getFullYear(),
    days: [
      {
        day: "Monday",
        date: new Date(),
        meals: [{ type: "dinner", recipeId: "recipe-1" }],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  addRecipe(sampleRecipe);
  addMealPlan(sampleMealPlan);
};
