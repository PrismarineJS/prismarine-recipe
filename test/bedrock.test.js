/* eslint-env mocha */
const assert = require('assert')
const recipeLoader = require('../lib/recipe')

describe('Bedrock recipes', function () {
  it('should resolve named inputs and outputs from the registry', function () {
    const registry = {
      type: 'bedrock',
      items: {
        1: { id: 1, name: 'planks' },
        2: { id: 2, name: 'book' },
        3: { id: 3, name: 'bookshelf' }
      },
      itemsByName: {
        planks: { id: 1, name: 'planks' },
        book: { id: 2, name: 'book' },
        bookshelf: { id: 3, name: 'bookshelf' }
      },
      recipes: {
        0: {
          type: 'crafting_table',
          name: 'Bookshelf_recipeId',
          ingredients: [{ name: 'planks', count: 6 }, { name: 'book', count: 3 }],
          input: [[1, 1, 1], [2, 2, 2], [1, 1, 1]],
          output: [{ name: 'bookshelf', metadata: 0, count: 1 }]
        }
      }
    }
    const Recipe = recipeLoader(registry)
    const recipe = Recipe.find('bookshelf')[0]

    assert.strictEqual(recipe.edition, 'bedrock')
    assert.strictEqual(recipe.type, 'crafting_table')
    assert.strictEqual(recipe.name, 'Bookshelf_recipeId')
    assert.strictEqual(recipe.result.id, 3)
    assert.strictEqual(recipe.result.name, 'bookshelf')
    assert.strictEqual(recipe.inShape[0][0].id, 1)
    assert.strictEqual(recipe.inShape[1][0].id, 2)
    assert.strictEqual(recipe.requiresTable, true)
    assert.strictEqual(recipe.delta.find(d => d.id === 1).count, -6)
    assert.strictEqual(recipe.delta.find(d => d.id === 2).count, -3)
    assert.strictEqual(recipe.delta.find(d => d.id === 3).count, 1)
  })

  it('should include all outputs in results and delta', function () {
    const registry = {
      type: 'bedrock',
      items: {
        1: { id: 1, name: 'milk_bucket' },
        2: { id: 2, name: 'sugar' },
        3: { id: 3, name: 'egg' },
        4: { id: 4, name: 'wheat' },
        5: { id: 5, name: 'cake' },
        6: { id: 6, name: 'bucket' }
      },
      itemsByName: {
        milk_bucket: { id: 1, name: 'milk_bucket' },
        sugar: { id: 2, name: 'sugar' },
        egg: { id: 3, name: 'egg' },
        wheat: { id: 4, name: 'wheat' },
        cake: { id: 5, name: 'cake' },
        bucket: { id: 6, name: 'bucket' }
      },
      recipes: {
        0: {
          type: 'crafting_table',
          name: 'minecraft:cake',
          ingredients: [
            { name: 'milk_bucket', count: 3 },
            { name: 'sugar', count: 2 },
            { name: 'egg', count: 1 },
            { name: 'wheat', count: 3 }
          ],
          input: [[1, 1, 1], [2, 3, 2], [4, 4, 4]],
          output: [{ name: 'cake', count: 1 }, { name: 'bucket', count: 3 }]
        }
      }
    }
    const Recipe = recipeLoader(registry)
    const byName = Recipe.find('cake')[0]
    const byId = Recipe.find(5)[0]

    assert.strictEqual(byName.results.length, 2)
    assert.strictEqual(byName.results[1].id, 6)
    assert.strictEqual(byName.delta.find(d => d.id === 6).count, 3)
    assert.strictEqual(byId.result.name, 'cake')
    assert.strictEqual(Recipe.find('bucket').length, 1)
  })

  it('should match variation ids to base recipe metadata', function () {
    const registry = {
      type: 'bedrock',
      items: {
        1: {
          id: 1,
          name: 'bed',
          metadata: 0,
          variations: [{ id: 2, name: 'black_bed', metadata: 15 }]
        },
        2: { id: 2, name: 'black_bed', metadata: 15 }
      },
      itemsByName: {
        bed: { id: 1, name: 'bed', metadata: 0 },
        black_bed: { id: 2, name: 'black_bed', metadata: 15 }
      },
      recipes: {
        0: {
          type: 'crafting_table_shapeless',
          name: 'bed_dye_0_15',
          ingredients: [{ name: 'bed', count: 1 }],
          input: [[1]],
          output: [{ name: 'bed', metadata: 15, count: 1 }]
        }
      }
    }
    const Recipe = recipeLoader(registry)

    assert.strictEqual(Recipe.find(2).length, 1)
    assert.strictEqual(Recipe.find('black_bed').length, 1)
  })

  it('should resolve legacy generic planks outputs to concrete Bedrock item names', function () {
    const registry = {
      type: 'bedrock',
      items: {
        1: { id: 1, name: 'planks', stackSize: 1 },
        2: { id: 2, name: 'oak_planks' },
        3: { id: 3, name: 'oak_log' },
        4: { id: 4, name: 'log' }
      },
      itemsByName: {
        planks: { id: 1, name: 'planks', stackSize: 1 },
        oak_planks: { id: 2, name: 'oak_planks' },
        oak_log: { id: 3, name: 'oak_log' },
        log: { id: 4, name: 'log' }
      },
      recipes: {
        0: {
          type: 'crafting_table',
          name: 'minecraft:oak_planks',
          ingredients: [{ name: 'log', count: 1 }],
          input: [[1]],
          output: [{ name: 'planks', metadata: 0, count: 4 }]
        }
      }
    }
    const Recipe = recipeLoader(registry)

    const byConcreteName = Recipe.find('oak_planks')
    const byConcreteId = Recipe.find(2)
    const byGenericName = Recipe.find('planks')

    assert.strictEqual(byConcreteName.length, 1)
    assert.strictEqual(byConcreteId.length, 1)
    assert.strictEqual(byGenericName.length, 1)
    assert.strictEqual(byConcreteName[0].result.id, 2)
    assert.strictEqual(byConcreteName[0].result.name, 'oak_planks')
    assert.strictEqual(byConcreteName[0].result.metadata, null)
    assert.strictEqual(byConcreteName[0].inShape[0][0].id, 3)
    assert.strictEqual(byConcreteName[0].inShape[0][0].name, 'oak_log')
    assert.strictEqual(byConcreteName[0].delta.find(d => d.id === 3).count, -1)
    assert.strictEqual(byConcreteName[0].delta.find(d => d.id === 2).count, 4)
  })
})
