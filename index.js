function loader (mcVersion) {
  if (mcVersion.startsWith('bedrock')) {
    return { Recipe: require('./lib/bedrock')(mcVersion) }
  }
  return {
    Recipe: require('./lib/recipe')(mcVersion),
    RecipeItem: require('./lib/recipe_item')
  }
}

module.exports = loader
