export declare class Recipe {
    constructor(recipeEnumItem: object);

    result: RecipeItem;
    inShape: Array<Array<RecipeItem>>;
    outShape: Array<Array<RecipeItem>>;
    ingredients: Array<RecipeItem>;
    delta: Array<RecipeItem>;
    requiresTable: boolean;

    static find(itemType: number, metadata: number | null): Array<Recipe>;
}
export declare class RecipeItem {
    constructor(id: number, metadata: number | null, count: number);

    id: number;
    metadata: number | null;
    count: number;

    static fromEnum(itemFromRecipeEnum: object): RecipeItem;
    static clone(recipeItem: RecipeItem): RecipeItem;
}
type RecipeConstructor = typeof Recipe;
type RecipeItemConstructor = typeof RecipeItem;
declare interface RecipeClasses {
    Recipe: RecipeConstructor;
    RecipeItem: RecipeItemConstructor;
}
declare function loader(mcVersion: string): RecipeClasses;
export default loader;

