let recipes
let items
let itemsByName
let recipeList
let isBedrock
let edition
const RecipeItem = require('./recipe_item')

module.exports = loader

function loader (registry) {
  recipes = registry.recipes || {}
  items = registry.items || {}
  itemsByName = registry.itemsByName || {}
  recipeList = Object.keys(recipes).map(function (key) { return recipes[key] })
  isBedrock = registry.type === 'bedrock' || recipeList.some(function (recipe) {
    return recipe && !Array.isArray(recipe) && Array.isArray(recipe.output)
  })
  edition = isBedrock ? 'bedrock' : 'java'
  return Recipe
}

function Recipe (recipeEnumItem) {
  this.edition = edition
  this.type = recipeEnumItem.type || null
  this.name = recipeEnumItem.name || null
  this.result = reformatItem(getPrimaryResult(recipeEnumItem))
  this.results = reformatResults(recipeEnumItem)

  this.inShape = recipeEnumItem.input
    ? reformatBedrockShape(recipeEnumItem.input, recipeEnumItem.ingredients)
    : recipeEnumItem.inShape
      ? reformatShape(recipeEnumItem.inShape)
      : null
  this.outShape = recipeEnumItem.outShape
    ? reformatShape(recipeEnumItem.outShape)
    : null
  this.ingredients = !recipeEnumItem.input && recipeEnumItem.ingredients
    ? reformatIngredients(recipeEnumItem.ingredients)
    : null
  this.delta = computeDelta(this)
  this.requiresTable = computeRequiresTable(this)
}

Recipe.find = function (itemType, metadata) {
  const item = resolveFindItem(itemType, metadata)
  const results = []

  if (!isBedrock) {
    (recipes[item.id] || []).forEach(function (recipeEnumItem) {
      if (recipeMatches(recipeEnumItem, item)) {
        results.push(new Recipe(recipeEnumItem))
      }
    })
    return results
  }

  recipeList.forEach(function (recipeEnumItem) {
    if (recipeMatches(recipeEnumItem, item)) {
      results.push(new Recipe(recipeEnumItem))
    }
  })
  return results
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

function normalizeMetadata (recipeItem) {
  if (recipeItem.metadata == null || recipeItem.id === -1) return recipeItem
  // Vanilla Minecraft uses 32767 as the wildcard damage value in recipes
  if (recipeItem.metadata >= 32767) {
    recipeItem.metadata = null
    return recipeItem
  }
  // If the item has known variations and the metadata doesn't match any of them,
  // treat it as a wildcard. This handles cases like minecraft-data using block
  // metadata (e.g. 12 for all-bark log) in recipes, which doesn't correspond
  // to any valid item variant (logs as items only have metadata 0-5).
  const itemData = items[recipeItem.id]
  if (itemData && itemData.variations) {
    const validMetadata = itemData.variations.map(function (v) { return v.metadata })
    if (itemData.metadata != null) validMetadata.push(itemData.metadata)
    if (validMetadata.indexOf(recipeItem.metadata) === -1) {
      recipeItem.metadata = null
    }
  }
  return recipeItem
}

function reformatShape (shape) {
  const out = new Array(shape.length)
  let x, y, row, outRow
  for (y = 0; y < shape.length; ++y) {
    row = shape[y]
    out[y] = outRow = new Array(row.length)
    for (x = 0; x < outRow.length; ++x) { outRow[x] = reformatItem(row[x]) }
  }
  return out
}

function reformatIngredients (ingredients) {
  const out = new Array(ingredients.length)
  for (let i = 0; i < out.length; ++i) {
    const item = reformatItem(ingredients[i])
    item.count = -1
    out[i] = item
  }
  return out
}

function reformatBedrockShape (input, ingredients) {
  const indexedIngredients = (ingredients || []).map(reformatItem)
  const out = new Array(input.length)
  let x, y, row, outRow, ingredient
  for (y = 0; y < input.length; ++y) {
    row = input[y]
    out[y] = outRow = new Array(row.length)
    for (x = 0; x < row.length; ++x) {
      ingredient = indexedIngredients[row[x] - 1]
      outRow[x] = ingredient ? RecipeItem.clone(ingredient) : RecipeItem.fromEnum(null)
    }
  }
  return out
}

function reformatResults (recipeEnumItem) {
  const results = recipeEnumItem.output || (recipeEnumItem.result ? [recipeEnumItem.result] : null)
  if (!results) return null
  return results.map(reformatItem)
}

function getPrimaryResult (recipeEnumItem) {
  return recipeEnumItem.result || (recipeEnumItem.output && recipeEnumItem.output[0])
}

function reformatItem (item) {
  return normalizeMetadata(resolveNamedItem(RecipeItem.fromEnum(item)))
}

function resolveNamedItem (item) {
  if (item == null || item.name == null || item.id != null) return item
  const itemData = findItemDataByName(stripNamespace(item.name))
  if (!itemData) return item
  item.id = itemData.id
  if (item.metadata == null && itemData.metadata != null) item.metadata = itemData.metadata
  return item
}

function resolveFindItem (itemType, metadata) {
  if (typeof itemType === 'string') {
    const name = stripNamespace(itemType)
    const itemData = findItemDataByName(name)
    const item = new RecipeItem(itemData ? itemData.id : undefined, metadata == null && itemData ? itemData.metadata : metadata, 1, name)
    item.byName = true
    return item
  }
  const itemData = items[itemType]
  return new RecipeItem(itemType, metadata == null && itemData ? itemData.metadata : metadata, 1)
}

function stripNamespace (name) {
  return name.indexOf(':') === -1 ? name : name.split(':').pop()
}

function findItemDataByName (name) {
  if (itemsByName[name]) return itemsByName[name]
  const itemKeys = Object.keys(items)
  for (let i = 0; i < itemKeys.length; ++i) {
    const itemData = items[itemKeys[i]]
    if (!itemData || !itemData.variations) continue
    for (let j = 0; j < itemData.variations.length; ++j) {
      if (itemData.variations[j].name === name) return itemData.variations[j]
    }
  }
}

function recipeMatches (recipeEnumItem, findItem) {
  const results = recipeEnumItem.output || (recipeEnumItem.result ? [recipeEnumItem.result] : [])
  return results.some(function (result) {
    return itemMatches(reformatItem(result), findItem)
  })
}

function itemMatches (recipeItem, findItem) {
  if (findItem.byName && recipeItem.name != null && stripNamespace(recipeItem.name) !== stripNamespace(findItem.name) && !variationMatches(recipeItem, findItem)) {
    return false
  }
  if (findItem.id != null && recipeItem.id !== findItem.id && !variationMatches(recipeItem, findItem)) {
    return false
  }
  return findItem.metadata == null || recipeItem.metadata == null || recipeItem.metadata === findItem.metadata
}

function variationMatches (recipeItem, findItem) {
  const itemData = items[recipeItem.id]
  if (!itemData || !itemData.variations) return false
  return itemData.variations.some(function (variation) {
    return variation.id === findItem.id && (recipeItem.metadata == null || recipeItem.metadata === variation.metadata)
  })
}
