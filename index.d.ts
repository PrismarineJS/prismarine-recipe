import type MinecraftData = require('prismarine-registry')

export type MinecraftDataRegistry = ReturnType<typeof MinecraftData>
export type RegistryItem = MinecraftDataRegistry['items'][number]
export type JavaDataRecipe = MinecraftDataRegistry['recipes'][number][number]
export type JavaDataRecipeItem = JavaDataRecipe['result']

export type BedrockRecipeType = string

export type BedrockDataRecipeItem = Partial<Pick<RegistryItem, 'id' | 'name'>> & {
    metadata?: number | null;
    count?: number;
}

export interface BedrockDataRecipe {
    name: string | null;
    type: BedrockRecipeType;
    ingredients: [BedrockDataRecipeItem, ...BedrockDataRecipeItem[]];
    input?: number[][];
    output: [BedrockDataRecipeItem, ...BedrockDataRecipeItem[]];
    priority?: number;
}

export type JavaRegistry = Omit<MinecraftDataRegistry, 'type' | 'recipes'> & {
    type?: Extract<MinecraftDataRegistry['type'], 'pc'>;
    recipes: Record<number, JavaDataRecipe[]>;
}

export type BedrockRegistry = Omit<MinecraftDataRegistry, 'type' | 'recipes'> & {
    type: Extract<MinecraftDataRegistry['type'], 'bedrock'>;
    recipes: Record<number, BedrockDataRecipe>;
}

export type RecipeRegistry = JavaRegistry | BedrockRegistry | MinecraftDataRegistry
export type RecipeEdition = 'java' | 'bedrock'
export type RecipeItemEnum = JavaDataRecipeItem | BedrockDataRecipeItem | null

export declare class RecipeItem {
    constructor(id: RegistryItem['id'], metadata: number | null, count: number, name?: RegistryItem['name']);

    id: RegistryItem['id'];
    metadata: number | null;
    count: number;
    name?: RegistryItem['name'];

    static fromEnum(itemFromRecipeEnum: RecipeItemEnum): RecipeItem;
    static clone(recipeItem: RecipeItem): RecipeItem;
}

export interface BaseRecipe {
    edition: RecipeEdition;
    type: BedrockRecipeType | null;
    name: string | null;
    result: RecipeItem;
    results: Array<RecipeItem>;
    inShape: Array<Array<RecipeItem>> | null;
    outShape: Array<Array<RecipeItem>> | null;
    ingredients: Array<RecipeItem> | null;
    delta: Array<RecipeItem>;
    requiresTable: boolean;
}

export interface JavaRecipe extends BaseRecipe {
    edition: 'java';
    type: null;
    name: null;
}

export interface BedrockRecipe extends BaseRecipe {
    edition: 'bedrock';
    type: BedrockRecipeType | null;
    name: string | null;
}

export type Recipe = JavaRecipe | BedrockRecipe

export interface RecipeConstructor<TRecipe extends Recipe = Recipe> {
    new (recipeEnumItem: JavaDataRecipe | BedrockDataRecipe): TRecipe;
    find(itemType: RegistryItem['id'] | RegistryItem['name'], metadata?: number | null): Array<TRecipe>;
}

export interface JavaRecipeConstructor extends RecipeConstructor<JavaRecipe> {
    new (recipeEnumItem: JavaDataRecipe): JavaRecipe;
    find(itemType: RegistryItem['id'], metadata?: number | null): Array<JavaRecipe>;
}

export interface BedrockRecipeConstructor extends RecipeConstructor<BedrockRecipe> {
    new (recipeEnumItem: BedrockDataRecipe): BedrockRecipe;
    find(itemType: RegistryItem['id'] | RegistryItem['name'], metadata?: number | null): Array<BedrockRecipe>;
}

export interface RecipeClasses<TRecipe extends Recipe = Recipe> {
    Recipe: RecipeConstructor<TRecipe>;
    RecipeItem: typeof RecipeItem;
}

export interface JavaRecipeClasses extends RecipeClasses<JavaRecipe> {
    Recipe: JavaRecipeConstructor;
}

export interface BedrockRecipeClasses extends RecipeClasses<BedrockRecipe> {
    Recipe: BedrockRecipeConstructor;
}

declare function loader(mcVersion: `bedrock_${string}`): BedrockRecipeClasses;
declare function loader(mcVersion: `${number}.${number}` | `${number}.${number}.${number}`): JavaRecipeClasses;
declare function loader(mcVersion: string): RecipeClasses;
declare function loader(registry: BedrockRegistry): BedrockRecipeClasses;
declare function loader(registry: JavaRegistry): JavaRecipeClasses;
declare function loader(registry: RecipeRegistry): RecipeClasses;

export default loader;
