const RecipeItem = require('./recipe_item')

module.exports = function createMatcher (context, normalizer) {
  return {
    recipeMatches,
    resolveFindItem
  }

  function resolveFindItem (itemType, metadata) {
    if (typeof itemType === 'string') {
      const name = normalizer.stripNamespace(itemType)
      const itemData = normalizer.findItemDataByName(name)
      const item = new RecipeItem(itemData ? itemData.id : undefined, metadata == null && itemData ? itemData.metadata : metadata, 1, name)
      item.byName = true
      return item
    }
    const itemData = context.items[itemType]
    return new RecipeItem(itemType, metadata == null && itemData ? itemData.metadata : metadata, 1)
  }

  function recipeMatches (recipeEnumItem, findItem) {
    const results = recipeEnumItem.output || (recipeEnumItem.result ? [recipeEnumItem.result] : [])
    return results.some(function (result) {
      return itemMatches(normalizer.reformatItem(result), findItem)
    })
  }

  function itemMatches (recipeItem, findItem) {
    if (findItem.byName && recipeItem.name != null && normalizer.stripNamespace(recipeItem.name) !== normalizer.stripNamespace(findItem.name) && !variationMatches(recipeItem, findItem)) {
      return false
    }
    if (findItem.id != null && recipeItem.id !== findItem.id && !variationMatches(recipeItem, findItem)) {
      return false
    }
    return findItem.metadata == null || recipeItem.metadata == null || recipeItem.metadata === findItem.metadata
  }

  function variationMatches (recipeItem, findItem) {
    const itemData = context.items[recipeItem.id]
    if (!itemData || !itemData.variations) return false
    return itemData.variations.some(function (variation) {
      return variation.id === findItem.id && (recipeItem.metadata == null || recipeItem.metadata === variation.metadata)
    })
  }
}
