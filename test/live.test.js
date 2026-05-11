/* eslint-env mocha */
const assert = require('assert')
const registry = require('prismarine-registry')
const recipeLoader = require('../')

describe('Live registry recipes', function () {
  const javaVersions = ['1.8', '1.12.2', '1.16.5', '1.20.4', '1.21.4']
  const bedrockVersions = ['bedrock_1.20.0', 'bedrock_1.21.0', 'bedrock_1.21.80']

  for (const version of javaVersions) {
    it(`should load Java recipes for ${version}`, function () {
      const data = registry(version)
      const Recipe = recipeLoader(data).Recipe
      const recipeId = firstRecipeId(data)
      const recipes = Recipe.find(recipeId)

      assert.ok(recipes.length > 0)
      assert.strictEqual(recipes[0].edition, 'java')
      assert.strictEqual(recipes[0].type, null)
      assert.strictEqual(recipes[0].name, null)
      assert.strictEqual(recipes[0].result.id, recipeId)
      assert.ok(recipes[0].results.length > 0)
      assert.ok(recipes[0].delta.length > 0)
    })
  }

  for (const version of bedrockVersions) {
    it(`should load Bedrock recipes for ${version}`, function () {
      const data = registry(version)
      const Recipe = recipeLoader(data).Recipe
      const recipeData = firstRecipeWithKnownOutput(data)
      const output = recipeData.output[0]
      const recipesByName = Recipe.find(output.name)
      const recipesById = Recipe.find(data.itemsByName[output.name].id, output.metadata)

      assert.ok(recipesByName.length > 0)
      assert.ok(recipesById.length > 0)
      assert.strictEqual(recipesByName[0].edition, 'bedrock')
      assert.strictEqual(typeof recipesByName[0].type, 'string')
      assert.ok(recipesByName[0].name == null || typeof recipesByName[0].name === 'string')
      assert.strictEqual(recipesByName[0].result.name, output.name)
      assert.ok(recipesByName[0].results.length > 0)
      assert.ok(recipesByName[0].delta.length > 0)
    })
  }

  it('should keep live Java and Bedrock loaders isolated', function () {
    const JavaRecipe = recipeLoader('1.21.4').Recipe
    const BedrockRecipe = recipeLoader('bedrock_1.21.80').Recipe

    assert.strictEqual(JavaRecipe.find(5)[0].edition, 'java')
    assert.strictEqual(BedrockRecipe.find('cake')[0].edition, 'bedrock')
    assert.strictEqual(JavaRecipe.find(5)[0].edition, 'java')
  })
})

function firstRecipeId (data) {
  return Number(Object.keys(data.recipes).find(function (id) {
    return data.recipes[id] && data.recipes[id].length > 0
  }))
}

function firstRecipeWithKnownOutput (data) {
  return Object.keys(data.recipes)
    .map(function (id) { return data.recipes[id] })
    .find(function (recipe) {
      return recipe &&
        recipe.output &&
        recipe.output[0] &&
        recipe.output[0].name &&
        data.itemsByName[recipe.output[0].name]
    })
}
