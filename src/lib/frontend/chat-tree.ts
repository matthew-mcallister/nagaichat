import { Item } from '@/lib/frontend/api'

export default class ChatTree {
  /** Items by ID. */
  private items: Map<number, Item>
  /** Item's children. Children of `null` are root items. */
  private children: Map<number | null, Item[]>

  constructor(items: Item[]) {
    this.items = new Map(items.map(item => [item.id, item]))

    this.children = new Map()
    for (const item of items) {
      if (!this.children.has(item.parentId)) {
        this.children.set(item.parentId, [])
      }
      this.children.get(item.parentId)!.push(item)
    }

    // Sort children by ID for consistency
    for (const childList of this.children.values()) {
      childList.sort((a, b) => a.id - b.id)
    }
  }

  public getLinearHistory(latestId: number | null): Item[] {
    const history: Item[] = []

    let currentId: number | null = latestId
    while (currentId !== null) {
      const item = this.items.get(currentId)
      if (!item) {
        throw new Error('unreachable')
      }
      history.push(item)
      currentId = item.parentId
    }

    history.reverse()
    return history
  }

  public get(id: number): Item {
    const item = this.items.get(id)
    if (!item) throw new Error('unreachable')
    return item
  }

  public getChildren(parentId: number | null): Item[] {
    return this.children.get(parentId) ?? []
  }

  /**
   * Returns the tuple `[index, left, right]`, where `index` is the index of
   * `item` among its siblings, `left` is the sibling to the immediate left,
   * and `right` is the sibling to the immediate right.
   */
  public getSiblings(item: Item): [number, Item | null, Item | null] {
    const siblings = this.getChildren(item.parentId)
    const index = siblings.findIndex(sibling => sibling.id === item.id)
    if (index === -1) throw new Error('unreachable')

    const left = index > 0 ? siblings[index - 1] : null
    const right = index < siblings.length - 1 ? siblings[index + 1] : null
    return [index, left, right]
  }

  public getLatestLeaf(item: Item): Item
  public getLatestLeaf(item: null): Item | null

  /**
   * Returns the rightmost leaf descendant of an item, which may be the item
   * itself.
   */
  // TODO: Maybe should return the *actual* newest descendant. Not as cheap to
  // compute.
  public getLatestLeaf(item: Item | null): Item | null {
    let currentItem = item
    while (true) {
      const children = this.getChildren(currentItem?.id || null)
      if (children.length === 0) break
      currentItem = children[children.length - 1]
    }
    return currentItem
  }
}