const RecipeItem = require('./recipe_item')
var recipes

module.exports = loader

function loader(mcVersion) {
  recipes = require('minecraft-data')(mcVersion).recipes
  return Recipe
}

function Recipe(recipeEnumItem) {
  this.result = RecipeItem.fromEnum(recipeEnumItem.result)

  this.inShape = recipeEnumItem.inShape ?
    reformatShape(recipeEnumItem.inShape) : null
  this.outShape = recipeEnumItem.outShape ?
    reformatShape(recipeEnumItem.outShape) : null
  this.ingredients = recipeEnumItem.ingredients ?
    reformatIngredients(recipeEnumItem.ingredients) : null
  this.delta = computeDelta(this)
  this.requiresTable = computeRequiresTable(this)
}

Recipe.find = function(itemType, metadata) {
  let results = []
  let itemRecipes = recipes[itemType] || []
  itemRecipes.forEach(function(recipeEnumItem) {
    if ((metadata == null || recipeEnumItem.result.metadata === metadata)) {
      results.push(new Recipe(recipeEnumItem))
    }
  })
  return results
};

function computeRequiresTable(recipe) {
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

function computeDelta(recipe) {
  // returns a list of item type and metadata with the delta how many more or
  // less you will have in your inventory after crafting
  let delta = []
  if (recipe.inShape) applyShape(recipe.inShape, -1)
  if (recipe.outShape) applyShape(recipe.outShape, 1)
  if (recipe.ingredients) applyIngredients(recipe.ingredients)
  // add the result
  add(recipe.result)
  return delta

  //add to delta
  function add(recipeItem) {
    let d
    for (var i = 0; i < delta.length; ++i) {
      d = delta[i]
      if (d.id === recipeItem.id && d.metadata === recipeItem.metadata) {
        d.count += recipeItem.count
        return
      }
    }
    delta.push(recipeItem)
  }

  function applyShape(shape, direction) {
    let x, y, row, item
    for(y = 0; y < shape.length; ++y) {
      row = recipe.inShape[y]
      for(x = 0; x < row.length; ++x)
        if(row[x].id !== -1) {
          item = RecipeItem.clone(row[x])
          item.count = direction
          add(item)
        }
    }
  }

  function applyIngredients(ingredients) {
    let i
    for(i = 0; i < ingredients.length; ++i) {
      add(ingredients[i])
    }
  }
}

function reformatShape(shape) {
  let out = new Array(shape.length)
  let x, y, row, outRow
  for (y = 0; y < shape.length; ++y) {
    row = shape[y]
    out[y] = outRow = new Array(row.length)
    for (x = 0; x < outRow.length; ++x)
      outRow[x] = RecipeItem.fromEnum(row[x])
  }
  return out
}

function reformatIngredients(ingredients) {
  let out = new Array(ingredients.length)
  let i, item
  for (i = 0; i < out.length; ++i) {
    item = RecipeItem.fromEnum(ingredients[i])
    item.count = -1
    out[i] = item
  }
  return out
}
