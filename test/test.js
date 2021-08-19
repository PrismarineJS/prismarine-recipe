/* eslint-env mocha */
const assert = require('assert')
const TESTED = ['pc_1.17', 'bedrock_1.17.10']

describe('finds recipes', function () {
  for (const version of TESTED) {
    const { Recipe } = require('prismarine-recipe')(version)

    it('finds diamond_pickaxe on ' + version, function () {
      console.log(Recipe, Recipe.find('diamond_pickaxe'))
      assert.ok(Recipe.find('diamond_pickaxe').length > 0)
    })

    it('api works on ' + version, function () {
      const recipe = Recipe.find('diamond_pickaxe')[0]
      for (const key of ['inShape', 'outShape', 'ingredients', 'delta']) {
        console.log(key, recipe[key])
        assert.ok(recipe[key]?.length ?? true)
      }
    })
  }

  it('can search for craftable recipes on bedrock_1.17', function () {
    const { Recipe } = require('prismarine-recipe')('bedrock_1.17.10')
    const craftable = Recipe.getCraftable([{ name: 'wool', count: 2 }, { name: 'wool', count: 1 }, { name: 'planks', count: 3 }])
    console.log('Craftable', JSON.stringify())
    assert.ok(craftable.length > 0)
  })
})

for (const version of TESTED) {
  const mcData = require('minecraft-data')(version)
  const { Recipe } = require('prismarine-recipe')(version)
  describe('works on all recipes on ' + version, function () {
    for (const recipeId in mcData.recipes) {
      it('finds ' + recipeId, function () {
        const recipe = new Recipe(recipeId)
        for (const key of ['inShape', 'outShape', 'ingredients', 'delta']) {
          assert.ok(recipe[key]?.length ?? true)
        }
      })
    }
  })
}
