export interface TreeNode<T> {
  value: T
  width: number
  children: TreeNode<T>[]
}

export class DrawTree<T> {
  public x: number = 0
  private dx: number = 0
  public depth: number
  public node: TreeNode<T>
  public children: DrawTree<T>[] = []
  public parent: DrawTree<T> | null
  public rowPos: number

  constructor(node: TreeNode<T>, parent: DrawTree<T> | null, depth: number, rowPos: number) {
    this.depth = depth
    this.node = node
    this.parent = parent
    this.rowPos = rowPos
  }

  /**
   * Very simple tree drawing algorithm. Supports arbitrary width nodes. Every
   * node's left edge is aligned with the left edge of its first child.
   */
  public static solve<T>(input: TreeInput<T>): DrawTree<T> {
    const gap = input.gap

    const nodesByDepth: DrawTree<T>[][] = []
    function gather(parent: DrawTree<T> | null, input: TreeNode<T>): DrawTree<T> {
      const depth = parent ? parent.depth + 1 : 0
      if (depth >= nodesByDepth.length) {
        nodesByDepth.push([])
      }
      const rowPos = nodesByDepth[depth].length
      const u = new DrawTree(input, parent, depth, rowPos)
      nodesByDepth[depth].push(u)

      for (const child of input.children) {
        const childNode = gather(u, child)
        u.children.push(childNode)
      }

      return u
    }

    const root = gather(null, input.root)

    // Compute positions with relative parent offset
    for (let depth = nodesByDepth.length - 1; depth >= 0; depth--) {
      let x = 0
      let dx = 0
      for (const u of nodesByDepth[depth]) {
        const children = u.children

        if (children.length > 0) {
          // Align parent and first child
          const first = children[0]
          if (x < first.x + dx) {
            x = first.x + dx
          } else {
            dx += x - first.x
          }

          for (const child of children) {
            child.dx = dx
          }
        }

        u.x = x
        x += u.node.width + gap
      }
    }

    // Compute absolute positions
    function fillPos(u: DrawTree<T>): void {
      u.x += u.dx
      for (const child of u.children) {
        child.dx += u.dx
        fillPos(child)
      }
    }

    fillPos(root)

    return root
  }
}

export interface TreeInput<T> {
  root: TreeNode<T>
  gap: number
}

export function drawTree<T>(input: TreeInput<T>): DrawTree<T> {
  return DrawTree.solve(input)
}