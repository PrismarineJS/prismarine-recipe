/* eslint-env mocha */
const assert = require('assert')
const RecipeItem = require('../lib/recipe_item')
const recipeLoader = require('../lib/recipe')

describe('RecipeItem', function () {
  describe('fromEnum', function () {
    it('should set metadata to null when metadata is not present', function () {
      const item = RecipeItem.fromEnum({ id: 1 })
      assert.strictEqual(item.id, 1)
      assert.strictEqual(item.metadata, null)
      assert.strictEqual(item.count, 1)
    })

    it('should preserve metadata value when metadata is present', function () {
      const item = RecipeItem.fromEnum({ id: 1, metadata: 3 })
      assert.strictEqual(item.id, 1)
      assert.strictEqual(item.metadata, 3)
      assert.strictEqual(item.count, 1)
    })

    it('should preserve metadata value of 0', function () {
      const item = RecipeItem.fromEnum({ id: 1, metadata: 0 })
      assert.strictEqual(item.id, 1)
      assert.strictEqual(item.metadata, 0)
      assert.strictEqual(item.count, 1)
    })

    it('should handle number input', function () {
      const item = RecipeItem.fromEnum(5)
      assert.strictEqual(item.id, 5)
      assert.strictEqual(item.metadata, null)
      assert.strictEqual(item.count, 1)
    })

    it('should handle null input', function () {
      const item = RecipeItem.fromEnum(null)
      assert.strictEqual(item.id, -1)
      assert.strictEqual(item.metadata, null)
      assert.strictEqual(item.count, 1)
    })

    it('should use count from object when provided', function () {
      const item = RecipeItem.fromEnum({ id: 1, metadata: 2, count: 4 })
      assert.strictEqual(item.count, 4)
    })
  })
})

describe('Recipe', function () {
  describe('computeDelta mutation', function () {
    it('should not mutate ingredient counts after recipe creation', function () {
      const registry = {
        recipes: {
          1: [{
            result: { id: 1, count: 1 },
            ingredients: [2, 3]
          }]
        }
      }
      const Recipe = recipeLoader(registry)
      const recipe = Recipe.find(1)[0]

      // Ingredients should have count of -1 (consumed)
      assert.strictEqual(recipe.ingredients[0].count, -1)
      assert.strictEqual(recipe.ingredients[1].count, -1)

      // The delta should also reflect -1 for ingredients
      const ingredientDeltas = recipe.delta.filter(d => d.id === 2 || d.id === 3)
      for (const d of ingredientDeltas) {
        assert.strictEqual(d.count, -1)
      }
    })

    it('should not mutate result count after recipe creation', function () {
      const registry = {
        recipes: {
          1: [{
            result: { id: 1, count: 2 },
            ingredients: [2]
          }]
        }
      }
      const Recipe = recipeLoader(registry)
      const recipe = Recipe.find(1)[0]

      // Result count should remain as originally set
      assert.strictEqual(recipe.result.count, 2)

      // Delta for the result should also be 2 (produced)
      const resultDelta = recipe.delta.find(d => d.id === 1)
      assert.strictEqual(resultDelta.count, 2)
    })

    it('should not mutate inShape items after recipe creation', function () {
      const registry = {
        recipes: {
          4: [{
            result: { id: 4, count: 1 },
            inShape: [[1, 2], [3, null]]
          }]
        }
      }
      const Recipe = recipeLoader(registry)
      const recipe = Recipe.find(4)[0]

      // inShape items should not have their counts modified by computeDelta
      assert.strictEqual(recipe.inShape[0][0].count, 1)
      assert.strictEqual(recipe.inShape[0][1].count, 1)
      assert.strictEqual(recipe.inShape[1][0].count, 1)
    })
  })
})
