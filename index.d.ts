declare class Recipe {
    constructor(recipeEnumItem: object);

    result: RecipeItem;
    inShape: Array<Array<RecipeItem>>;
    outShape: Array<Array<RecipeItem>>;
    ingredients: Array<RecipeItem>;
    delta: Array<RecipeItem>;
    requiresTable: boolean;

    /**
     * Returns a list of recipes that can craft the given item.
     * @param {string|Item} itemOrBlock Name or Item object
     * @param {number} metadata Optional metadata for the item
     * @return {Recipe[]} A list of recipes that can craft the given item
     **/
    static find(itemType: number | object, metadata: number | null): Array<Recipe>;

    /**
     * Gets a list of crafting recipes that can be crafted with the given input (bedrock)
     */
    static getCraftable(withItems: Item[]): Array<Recipe>;
}
declare class RecipeItem {
    constructor(id: number, metadata: number | null, count: number);

    id: number;
    metadata: number | null;
    count: number;

    static fromEnum(itemFromRecipeEnum: object): RecipeItem;
    static clone(recipeItem: RecipeItem): RecipeItem;
}
type RecipeConstructor = typeof Recipe;
type RecipeItemConstructor = typeof Recipe;
declare interface RecipeClasses {
    Recipe: RecipeConstructor;
    RecipeItem: RecipeItemConstructor;
}
export declare function loader(mcVersion: string): RecipeClasses;