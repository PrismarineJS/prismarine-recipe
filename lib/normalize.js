const RecipeItem = require('./recipe_item')

module.exports = function createNormalizer (context) {
  return {
    findItemDataByName,
    getPrimaryResult,
    reformatBedrockShape,
    reformatIngredients,
    reformatItem,
    reformatResults,
    reformatShape,
    stripNamespace
  }

  function normalizeMetadata (recipeItem) {
    if (recipeItem.metadata == null || recipeItem.id === -1) return recipeItem
    // Vanilla Minecraft uses 32767 as the wildcard damage value in recipes.
    if (recipeItem.metadata >= 32767) {
      recipeItem.metadata = null
      return recipeItem
    }
    // Some recipe data uses block metadata that is not valid for the item form.
    const itemData = context.items[recipeItem.id]
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

  function stripNamespace (name) {
    return name.indexOf(':') === -1 ? name : name.split(':').pop()
  }

  function findItemDataByName (name) {
    if (context.itemsByName[name]) return context.itemsByName[name]
    const itemKeys = Object.keys(context.items)
    for (let i = 0; i < itemKeys.length; ++i) {
      const itemData = context.items[itemKeys[i]]
      if (!itemData || !itemData.variations) continue
      for (let j = 0; j < itemData.variations.length; ++j) {
        if (itemData.variations[j].name === name) return itemData.variations[j]
      }
    }
  }
}
