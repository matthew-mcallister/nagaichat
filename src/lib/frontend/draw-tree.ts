export interface TreeInput<T> {
  value: T
  children: TreeInput<T>[]
}

export class DrawTree<T> {
  x: number = -1
  y: number
  tree: TreeInput<T>
  children: DrawTree<T>[]
  parent: DrawTree<T> | null
  thread: DrawTree<T> | null = null
  offset: number = 0
  ancestor: DrawTree<T>
  change: number = 0
  shift: number = 0
  mod: number = 0
  private _lmost_sibling: DrawTree<T> | null = null
  // this is the number of the node in its group of siblings 1..n
  number: number

  constructor(tree: TreeInput<T>, parent: DrawTree<T> | null = null, depth: number = 0, number: number = 1) {
    this.y = depth
    this.tree = tree
    this.children = tree.children.map((c, i) =>
      new DrawTree<T>(c, this, depth + 1, i + 1)
    )
    this.parent = parent
    this.ancestor = this
    this.number = number
  }

  left_brother(): DrawTree<T> | null {
    let n: DrawTree<T> | null = null
    if (this.parent) {
      for (const node of this.parent.children) {
        if (node === this) return n
        else n = node
      }
    }
    return n
  }

  private get_lmost_sibling(): DrawTree<T> | null {
    if (!this._lmost_sibling && this.parent && this !== this.parent.children[0]) {
      this._lmost_sibling = this.parent.children[0]
    }
    return this._lmost_sibling
  }

  get leftmost_sibling(): DrawTree<T> | null {
    return this.get_lmost_sibling()
  }

  right(): DrawTree<T> | null {
    return this.thread
  }

  left(): DrawTree<T> | null {
    return this.thread
  }
}

function firstwalk<T>(v: DrawTree<T>, distance: number = 1): DrawTree<T> {
  if (v.children.length === 0) {
    if (v.leftmost_sibling) {
      const leftBrother = v.left_brother()
      if (leftBrother) {
        v.x = leftBrother.x + distance
      }
    } else {
      v.x = 0
    }
  } else {
    let default_ancestor = v.children[0]
    for (const w of v.children) {
      firstwalk(w)
      default_ancestor = apportion(w, default_ancestor, distance)
    }
    execute_shifts(v)

    const midpoint = (v.children[0].x + v.children[v.children.length - 1].x) / 2

    const w = v.left_brother()
    if (w) {
      v.x = w.x + distance
      v.mod = v.x - midpoint
    } else {
      v.x = midpoint
    }
  }
  return v
}

function apportion<T>(v: DrawTree<T>, default_ancestor: DrawTree<T>, distance: number): DrawTree<T> {
  const w = v.left_brother()
  if (w !== null) {
    // in buchheim notation:
    // i == inner; o == outer; r == right; l == left;
    let vir = v
    let vor = v
    let vil = w
    let vol = v.leftmost_sibling!
    let sir = v.mod
    let sor = v.mod
    let sil = vil.mod
    let sol = vol.mod

    while (vil.right() && vir.left()) {
      vil = vil.right()!
      vir = vir.left()!
      vol = vol.left()!
      vor = vor.right()!
      vor.ancestor = v
      const shift = (vil.x + sil) - (vir.x + sir) + distance
      if (shift > 0) {
        const a = ancestor(vil, v, default_ancestor)
        move_subtree(a, v, shift)
        sir = sir + shift
        sor = sor + shift
      }
      sil += vil.mod
      sir += vir.mod
      sol += vol.mod
      sor += vor.mod
    }
    if (vil.right() && !vor.right()) {
      vor.thread = vil.right()
      vor.mod += sil - sor
    } else {
      if (vir.left() && !vol.left()) {
        vol.thread = vir.left()
        vol.mod += sir - sol
      }
      default_ancestor = v
    }
  }
  return default_ancestor
}

function move_subtree<T>(wl: DrawTree<T>, wr: DrawTree<T>, shift: number): void {
  const subtrees = wr.number - wl.number
  wr.change -= shift / subtrees
  wr.shift += shift
  wl.change += shift / subtrees
  wr.x += shift
  wr.mod += shift
}

function execute_shifts<T>(v: DrawTree<T>): void {
  let shift = 0
  let change = 0
  for (let i = v.children.length - 1; i >= 0; i--) {
    const w = v.children[i]
    w.x += shift
    w.mod += shift
    change += w.change
    shift += w.shift + change
  }
}

function ancestor<T>(vil: DrawTree<T>, v: DrawTree<T>, default_ancestor: DrawTree<T>): DrawTree<T> {
  if (v.parent && v.parent.children.includes(vil.ancestor)) {
    return vil.ancestor
  } else {
    return default_ancestor
  }
}

function second_walk<T>(v: DrawTree<T>, m: number = 0, depth: number = 0, min: number | null = null): number {
  v.x += m
  v.y = depth

  if (min === null || v.x < min) {
    min = v.x
  }

  for (const w of v.children) {
    min = second_walk(w, m + v.mod, depth + 1, min)
  }

  return min
}

function third_walk<T>(tree: DrawTree<T>, n: number): void {
  tree.x += n
  for (const c of tree.children) {
    third_walk(c, n)
  }
}

export function buchheim<T>(tree: TreeInput<T>): DrawTree<T> {
  const dt = firstwalk(new DrawTree<T>(tree))
  const min = second_walk(dt)
  if (min < 0) {
    third_walk(dt, -min)
  }
  return dt
}
