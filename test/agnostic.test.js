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

    it('should handle array input', function () {
      const item = RecipeItem.fromEnum([5, 2])
      assert.strictEqual(item.id, 5)
      assert.strictEqual(item.metadata, 2)
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

    it('should preserve item name when provided', function () {
      const item = RecipeItem.fromEnum({ name: 'oak_planks', count: 4 })
      assert.strictEqual(item.name, 'oak_planks')
      assert.strictEqual(item.count, 4)
    })
  })
})

describe('Recipe agnostic format', function () {
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

      assert.strictEqual(recipe.ingredients[0].count, -1)
      assert.strictEqual(recipe.ingredients[1].count, -1)

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

      assert.strictEqual(recipe.result.count, 2)
      assert.strictEqual(recipe.delta.find(d => d.id === 1).count, 2)
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

      assert.strictEqual(recipe.inShape[0][0].count, 1)
      assert.strictEqual(recipe.inShape[0][1].count, 1)
      assert.strictEqual(recipe.inShape[1][0].count, 1)
    })

    it('should use outShape when applying output shape delta', function () {
      const registry = {
        recipes: {
          1: [{
            result: { id: 1, count: 1 },
            outShape: [[2, 2]]
          }]
        }
      }
      const Recipe = recipeLoader(registry)
      const recipe = Recipe.find(1)[0]

      assert.strictEqual(recipe.delta.find(d => d.id === 2).count, 2)
    })
  })

  describe('wildcard metadata normalization', function () {
    it('should treat metadata >= 32767 as wildcard (null)', function () {
      const registry = {
        items: {},
        recipes: {
          1: [{
            result: { id: 1, count: 1 },
            inShape: [[{ id: 17, metadata: 32767 }]]
          }]
        }
      }
      const Recipe = recipeLoader(registry)
      const recipe = Recipe.find(1)[0]

      assert.strictEqual(recipe.inShape[0][0].metadata, null)
      assert.strictEqual(recipe.delta.find(d => d.id === 17).metadata, null)
    })

    it('should treat metadata as wildcard when it does not match any item variation', function () {
      const registry = {
        items: {
          17: {
            id: 17,
            name: 'log',
            variations: [
              { metadata: 0, displayName: 'Oak Wood' },
              { metadata: 1, displayName: 'Spruce Wood' }
            ]
          }
        },
        recipes: {
          5: [{
            result: { id: 5, count: 4, metadata: 0 },
            inShape: [[{ id: 17, metadata: 12 }]]
          }]
        }
      }
      const Recipe = recipeLoader(registry)
      const recipe = Recipe.find(5)[0]

      assert.strictEqual(recipe.inShape[0][0].metadata, null)
      assert.strictEqual(recipe.delta.find(d => d.id === 17).metadata, null)
    })

    it('should preserve metadata when it matches a valid item variation', function () {
      const registry = {
        items: {
          35: {
            id: 35,
            name: 'wool',
            variations: [
              { metadata: 0, displayName: 'White Wool' },
              { metadata: 1, displayName: 'Orange Wool' }
            ]
          }
        },
        recipes: {
          1: [{
            result: { id: 1, count: 1 },
            inShape: [[{ id: 35, metadata: 1 }]]
          }]
        }
      }
      const Recipe = recipeLoader(registry)
      const recipe = Recipe.find(1)[0]

      assert.strictEqual(recipe.inShape[0][0].metadata, 1)
    })

    it('should preserve metadata when it matches the base item metadata', function () {
      const registry = {
        items: {
          1: {
            id: 1,
            name: 'bed',
            metadata: 0,
            variations: [{ id: 2, name: 'orange_bed', metadata: 1 }]
          }
        },
        recipes: {
          1: [{
            result: { id: 1, count: 1 },
            inShape: [[{ id: 1, metadata: 0 }]]
          }]
        }
      }
      const Recipe = recipeLoader(registry)
      const recipe = Recipe.find(1)[0]

      assert.strictEqual(recipe.inShape[0][0].metadata, 0)
    })

    it('should normalize metadata in ingredients too', function () {
      const registry = {
        items: {
          17: {
            id: 17,
            name: 'log',
            variations: [
              { metadata: 0, displayName: 'Oak Wood' },
              { metadata: 1, displayName: 'Spruce Wood' }
            ]
          }
        },
        recipes: {
          5: [{
            result: { id: 5, count: 4 },
            ingredients: [{ id: 17, metadata: 12 }]
          }]
        }
      }
      const Recipe = recipeLoader(registry)
      const recipe = Recipe.find(5)[0]

      assert.strictEqual(recipe.ingredients[0].metadata, null)
    })

    it('should preserve metadata when item has no variations', function () {
      const registry = {
        items: {
          10: { id: 10, name: 'something' }
        },
        recipes: {
          1: [{
            result: { id: 1, count: 1 },
            inShape: [[{ id: 10, metadata: 5 }]]
          }]
        }
      }
      const Recipe = recipeLoader(registry)
      const recipe = Recipe.find(1)[0]

      assert.strictEqual(recipe.inShape[0][0].metadata, 5)
    })
  })
})
