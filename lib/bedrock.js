module.exports = mcVersion => {
  const mcData = require('minecraft-data')(mcVersion)
  return class Recipes {
    constructor (recipeId) {
      this.recipe = mcData.recipes[recipeId]
      this.type = this.recipe.type

      this.result = this.outShape

      // If input is greater than 2x2, it needs a crafting table
      this.requiresTable = false
      if (this.recipe.input) {
        for (const e of this.recipe.input) {
          if (e.length > 2) this.requiresTable = true
        }
        if (this.recipe.input.length > 2) this.requiresTable = true
      } else {
        return this.ingredients.length > 4
      }
    }

    get ingredients () {
      return JSON.parse(JSON.stringify(this.recipe.ingredients))
    }

    get inShape () {
      // note, here we use indexing that starts at 1, not 0. 0 is implicit air
      const tf = inp => inp.map(e => Array.isArray(e) ? tf(e) : (e ? this.recipe.ingredients[e - 1] : null))
      return this.recipe.input ? tf(this.recipe.input) : null
    }

    get outShape () {
      // for cake and some other special blocks
      return this.recipe.output
    }

    get delta () {
      const net = this.recipe.ingredients.map(e => ({ ...e, count: -e.count }))
      const gained = this.recipe.output
      for (const gain of gained) {
        let hit
        for (const loss of net) {
          if (loss.name === gain.name && loss.metadata === gain.metadata) {
            loss.count -= gain.count
            hit = true
          }
        }
        if (!hit) net.push(gain)
      }
      return net
    }

    // Some static methods

    static find (itemOrBlock, metadata) {
      const ret = []
      const want = typeof itemOrBlock === 'string' ? itemOrBlock.replace('minecraft:', '') : itemOrBlock.name
      metadata = metadata || want.metadata
      for (const id in mcData.recipes) {
        const recipe = mcData.recipes[id]
        for (const out of recipe.output) {
          if (out.name === want && (metadata ? metadata === out.metadata : true)) ret.push(id)
        }
      }
      return ret.map(e => new this(e))
    }

    /**
     * Gets a list of crafting recipes that can be crafted with the given input.
     */
    static getCraftable (withItems) {
      const have = {}
      const name = e => e.name.replace('minecraft:', '') + (e.metadata ? ':' + e.metadata : '')
      for (const item of withItems) {
        have[name(item)] ??= 0
        have[name(item)] += item.count
      }
      const ret = []
      for (const id in mcData.recipes) {
        const recipe = mcData.recipes[id]
        const input = recipe.ingredients.map(e => [name(e), e.count])
        if (input.every(([e, c]) => Object.entries(have).find(([k, v]) => e === k && v >= c))) ret.push(id)
      }
      return ret.map(e => new this(e))
    }
  }
}
