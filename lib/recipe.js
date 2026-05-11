const RecipeItem = require('./recipe_item')
const createNormalizer = require('./normalize')
const createMatcher = require('./matching')

module.exports = loader

function loader (registry) {
  const context = {
    recipes: registry.recipes || {},
    items: registry.items || {},
    itemsByName: registry.itemsByName || {},
    recipeList: [],
    isBedrock: false,
    edition: 'java'
  }
  const normalizer = createNormalizer(context)
  const matcher = createMatcher(context, normalizer)

  context.recipeList = Object.keys(context.recipes).map(function (key) { return context.recipes[key] })
  context.isBedrock = registry.type === 'bedrock' || context.recipeList.some(function (recipe) {
    return recipe && !Array.isArray(recipe) && Array.isArray(recipe.output)
  })
  context.edition = context.isBedrock ? 'bedrock' : 'java'

  function Recipe (recipeEnumItem) {
    this.edition = context.edition
    this.type = recipeEnumItem.type || null
    this.name = recipeEnumItem.name || null
    this.result = normalizer.reformatItem(normalizer.getPrimaryResult(recipeEnumItem))
    this.results = normalizer.reformatResults(recipeEnumItem)

    this.inShape = recipeEnumItem.input
      ? normalizer.reformatBedrockShape(recipeEnumItem.input, recipeEnumItem.ingredients)
      : recipeEnumItem.inShape
        ? normalizer.reformatShape(recipeEnumItem.inShape)
        : null
    this.outShape = recipeEnumItem.outShape
      ? normalizer.reformatShape(recipeEnumItem.outShape)
      : null
    this.ingredients = !recipeEnumItem.input && recipeEnumItem.ingredients
      ? normalizer.reformatIngredients(recipeEnumItem.ingredients)
      : null
    this.delta = computeDelta(this)
    this.requiresTable = computeRequiresTable(this)
  }

  Recipe.find = function (itemType, metadata) {
    const item = matcher.resolveFindItem(itemType, metadata)
    const results = []

    if (!context.isBedrock) {
      (context.recipes[item.id] || []).forEach(function (recipeEnumItem) {
        if (matcher.recipeMatches(recipeEnumItem, item)) {
          results.push(new Recipe(recipeEnumItem))
        }
      })
      return results
    }

    context.recipeList.forEach(function (recipeEnumItem) {
      if (matcher.recipeMatches(recipeEnumItem, item)) {
        results.push(new Recipe(recipeEnumItem))
      }
    })
    return results
  }

  return Recipe
}

function computeRequiresTable (recipe) {
  let spaceLeft = 4

  let x, y, row
  if (recipe.inShape) {
    if (recipe.inShape.length > 2) return true
    for (y = 0; y < recipe.inShape.length; ++y) {
      row = recipe.inShape[y]
      if (row.length > 2) return true
      for (x = 0; x < row.length; ++x) {
        if (row[x]) spaceLeft -= 1
      }
    }
  }
  if (recipe.ingredients) spaceLeft -= recipe.ingredients.length
  return spaceLeft < 0
}

function computeDelta (recipe) {
  // returns a list of item type and metadata with the delta how many more or
  // less you will have in your inventory after crafting
  const delta = []
  if (recipe.inShape) applyShape(recipe.inShape, -1)
  if (recipe.outShape) applyShape(recipe.outShape, 1)
  if (recipe.ingredients) applyIngredients(recipe.ingredients)
  if (recipe.results) {
    applyResults(recipe.results)
  } else {
    add(RecipeItem.clone(recipe.result))
  }
  return delta

  // add to delta
  function add (recipeItem) {
    for (let i = 0; i < delta.length; ++i) {
      const d = delta[i]
      if (d.id === recipeItem.id && d.metadata === recipeItem.metadata) {
        d.count += recipeItem.count
        return
      }
    }
    delta.push(recipeItem)
  }

  function applyShape (shape, direction) {
    let x, y, row
    for (y = 0; y < shape.length; ++y) {
      row = shape[y]
      for (x = 0; x < row.length; ++x) {
        if (row[x].id !== -1) {
          const item = RecipeItem.clone(row[x])
          item.count = direction
          add(item)
        }
      }
    }
  }

  function applyIngredients (ingredients) {
    let i
    for (i = 0; i < ingredients.length; ++i) {
      add(RecipeItem.clone(ingredients[i]))
    }
  }

  function applyResults (results) {
    let i
    for (i = 0; i < results.length; ++i) {
      add(RecipeItem.clone(results[i]))
    }
  }
}
