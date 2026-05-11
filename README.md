# prismarine-recipe

[![Build Status](https://github.com/PrismarineJS/prismarine-recipe/workflows/CI/badge.svg)](https://github.com/PrismarineJS/prismarine-recipe/actions?query=workflow%3A%22CI%22)

Represent minecraft recipes

## Usage

```js
const Recipe=require("prismarine-recipe")("1.8").Recipe;

console.log(JSON.stringify(Recipe.find(5)[0],null,2)); // recipes for wood
```

You can also pass an existing `prismarine-registry` instance:

```js
const registry=require("prismarine-registry")("1.21.4");
const Recipe=require("prismarine-recipe")(registry).Recipe;
```

Bedrock recipe data can be queried by item name or numeric id:

```js
const Recipe=require("prismarine-recipe")("bedrock_1.21.80").Recipe;

console.log(JSON.stringify(Recipe.find("cake")[0],null,2));
```

## API

### Recipe

#### Recipe.find(itemType, [metadata])

Returns a list of matching `Recipe` instances.

 * `itemType` - numerical id, or an item name for Bedrock/named registries
 * `metadata` - metadata to match. `null` means match anything.

The returned recipe uses the same normalized shape for Java and Bedrock. Existing Java fields are preserved, with additional fields for edition-aware code.

#### recipe.result

The primary output item. It's a recipeItem :
```js
{
  id:45,
  metadata:3,
  count:1
}
```

#### recipe.edition

Either `java` or `bedrock`. This is the discriminant for the version-agnostic recipe format and can be used to narrow the TypeScript `Recipe` union.

#### recipe.results

All output items. For Java this is usually the same item as `recipe.result`. For Bedrock this includes secondary outputs, such as empty buckets returned by the cake recipe.

#### recipe.type

The recipe station/type when the registry exposes one, for example `crafting_table`, `stonecutter`, or `furnace`. This value comes from registry data and should be treated as an open string.

#### recipe.name

The recipe identifier when the registry exposes one.

#### recipe.inShape

Looks like this:

```js
[
  [recipeItem, recipeItem],
  [recipeItem, recipeItem],
  [recipeItem, recipeItem],
]
```

#### recipe.outShape

Looks the same as `inShape`. Only present when the registry exposes shaped output slots.

#### recipe.ingredients

List of shape-independent ingredients. Looks like this:

```js
[
  recipeItem,
  recipeItem
]
```

### RecipeItem

A recipe item has the following fields:

```js
{
  id:45,
  metadata:3,
  count:1,
  name:"bricks" // present when the registry item was name-based
}
```

## TypeScript

The package exposes a version-agnostic `Recipe` union, plus `JavaRecipe` and `BedrockRecipe` for edition-specific usage. Literal version strings infer the specific recipe type:

```ts
import recipeLoader, { BedrockRecipe, JavaRecipe, Recipe } from 'prismarine-recipe'

const javaRecipe: JavaRecipe = recipeLoader('1.21.4').Recipe.find(5)[0]
const bedrockRecipe: BedrockRecipe = recipeLoader('bedrock_1.21.80').Recipe.find('cake')[0]

function handleRecipe (recipe: Recipe) {
  if (recipe.edition === 'bedrock') {
    console.log(recipe.type)
  }
}
```

The exported types reuse `minecraft-data` registry/item types where possible, and include Bedrock-specific recipe input/output types for the newer Bedrock recipe format.

#### recipe.requiresTable

Boolean.

#### recipe.delta

Map of item type to how much more or less you will have after you use
the recipe.

This is what it looks like for the chest recipe:

```js
[
  recipeItem,
  recipeItem
]
```

## History

### 1.3.0

* mcData to registry refactoring (@Epirito)
* Fixed RecipeItemConstructor Type and default export (@psu-de)

### 1.2.0

* Bump mcdata

### 1.1.0

* typescript definitions (thanks @IdanHo)

### 1.0.1

* bump mcdata

### 1.0.0

* bump dependencies

### 0.0.0

* Import from mineflayer
