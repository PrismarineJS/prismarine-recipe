/* eslint-env mocha */
const assert = require('assert')
const recipeLoader = require('../lib/recipe')

describe('Java recipes', function () {
  it('should expose java edition recipes in the normalized format', function () {
    const registry = {
      recipes: {
        5: [{
          result: { id: 5, metadata: 0, count: 4 },
          inShape: [[17]]
        }]
      }
    }
    const Recipe = recipeLoader(registry)
    const recipe = Recipe.find(5)[0]

    assert.strictEqual(recipe.edition, 'java')
    assert.strictEqual(recipe.type, null)
    assert.strictEqual(recipe.name, null)
    assert.strictEqual(recipe.result.id, 5)
    assert.strictEqual(recipe.results.length, 1)
    assert.strictEqual(recipe.results[0].id, 5)
  })

  it('should filter recipes by result metadata', function () {
    const registry = {
      recipes: {
        5: [
          { result: { id: 5, metadata: 0, count: 4 }, inShape: [[17]] },
          { result: { id: 5, metadata: 1, count: 4 }, inShape: [[17]] }
        ]
      }
    }
    const Recipe = recipeLoader(registry)
    const recipes = Recipe.find(5, 1)

    assert.strictEqual(recipes.length, 1)
    assert.strictEqual(recipes[0].result.metadata, 1)
  })
})
