module.exports = RecipeItem

function RecipeItem (id, metadata, count, name) {
  this.id = id
  this.metadata = metadata
  this.count = count
  if (name != null) this.name = name
}

RecipeItem.fromEnum = function (itemFromRecipeEnum) {
  if (itemFromRecipeEnum === null) { return new RecipeItem(-1, null, 1) } else {
    if (Array.isArray(itemFromRecipeEnum)) {
      return new RecipeItem(itemFromRecipeEnum[0], itemFromRecipeEnum[1] == null ? null : itemFromRecipeEnum[1], 1)
    } else if (typeof itemFromRecipeEnum === 'number') {
      return new RecipeItem(itemFromRecipeEnum, null, 1)
    } else if (typeof itemFromRecipeEnum === 'object') {
      return new RecipeItem(
        itemFromRecipeEnum.id,
        itemFromRecipeEnum.metadata == null ? null : itemFromRecipeEnum.metadata,
        itemFromRecipeEnum.count || 1,
        itemFromRecipeEnum.name
      )
    }
  }
}

RecipeItem.clone = function (recipeItem) {
  return new RecipeItem(recipeItem.id, recipeItem.metadata, recipeItem.count, recipeItem.name)
}
