import {
  getItemImageContent,
  getItemImageUris,
  getItemText,
  Item,
} from '@/lib/frontend/api'
import ChatTree from '@/lib/frontend/chat-tree'
import { drawTree, DrawTree, TreeNode } from '@/lib/frontend/draw-tree'
import { XMarkIcon } from '@heroicons/react/24/outline'
import React, { useEffect, useRef, useState } from 'react'
import styles from './TreeView.module.scss'

class Vec2 {
  public x: number
  public y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  public plus(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y)
  }

  public minus(other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y)
  }

  public times(other: number): Vec2 {
    return new Vec2(this.x * other, this.y * other)
  }
}

const ITEM_LAYOUT = {
  textWidth: 300,
  textPadding: 16,
  height: 125,
  imageGap: 5,
  imageWidth: 125,
  imageStride: 20,
}

interface TreeEdgeProps {
  srcX: number
  srcY: number
  dstX: number
  dstY: number
  cornerRadius: number
  highlighted: boolean
}

function TreeEdge({
  srcX,
  srcY,
  dstX,
  dstY,
  cornerRadius,
  highlighted,
}: TreeEdgeProps) {
  if (srcX === dstX) {
    const pathData = `M ${srcX} ${srcY} L ${dstX} ${dstY}`
    return (
      <path
        d={pathData}
        className={styles.treeEdge}
        data-highlighted={highlighted}
      />
    )
  }

  const midY = (srcY + dstY) / 2
  const pathData = [
    `M ${srcX} ${srcY}`,
    `L ${srcX} ${midY - cornerRadius}`,
    `A ${cornerRadius} ${cornerRadius} 0 0 0 ${srcX + cornerRadius} ${midY}`,
    `L ${srcX + cornerRadius} ${midY}`,
    `L ${dstX - cornerRadius} ${midY}`,
    `A ${cornerRadius} ${cornerRadius} 0 0 1 ${dstX} ${midY + cornerRadius}`,
    `L ${dstX} ${dstY}`,
  ].join(' ')
  return (
    <path
      d={pathData}
      className={styles.treeEdge}
      data-highlighted={highlighted}
    />
  )
}

interface TreeItemProps {
  x: number
  y: number
  item: Item
  hovered?: boolean
  highlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
  onWheel?: (event: React.WheelEvent) => void
}

function TreeItem({
  x,
  y,
  item,
  hovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onWheel,
  highlighted,
}: TreeItemProps) {
  const text = getItemText(item) || ''
  const imageUris = getItemImageUris(item).slice(0, 3)
  const hasImages = imageUris.length > 0

  return (
    <g
      className={styles.treeNodeOuter}
      data-hovered={hovered}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onWheel={onWheel}
      transform={`translate(${x}, ${y})`}
      data-role={item.role}
      data-highlighted={highlighted}
    >
      <rect
        x={0}
        y={0}
        width={ITEM_LAYOUT.textWidth}
        height={ITEM_LAYOUT.height}
        rx={10}
        className={styles.treeNode}
      />
      <foreignObject
        // We implement padding manually due to -webkit-line-clamp
        // interacting with padding incorrectly.
        x={ITEM_LAYOUT.textPadding}
        y={ITEM_LAYOUT.textPadding}
        width={ITEM_LAYOUT.textWidth - 2 * ITEM_LAYOUT.textPadding}
        height={ITEM_LAYOUT.height - 2 * ITEM_LAYOUT.textPadding}
      >
        <p className={styles.treeNodeText}>{text}</p>
      </foreignObject>
      {hasImages && (
        <g>
          {imageUris.reverse().map((imageUri, i) => {
            const index = imageUris.length - i - 1
            const offsetX =
              ITEM_LAYOUT.textWidth +
              ITEM_LAYOUT.imageGap +
              index * ITEM_LAYOUT.imageStride
            return (
              <g key={index}>
                <defs>
                  <clipPath id={`clip-${item.id}-${index}`}>
                    <rect
                      x={offsetX}
                      y={0}
                      width={ITEM_LAYOUT.imageWidth}
                      height={ITEM_LAYOUT.height}
                      rx={10}
                    />
                  </clipPath>
                </defs>
                <g className={styles.imageOuter}>
                  <image
                    x={offsetX}
                    y={0}
                    width={ITEM_LAYOUT.imageWidth}
                    height={ITEM_LAYOUT.height}
                    href={imageUri}
                    clipPath={`url(#clip-${item.id}-${index})`}
                    preserveAspectRatio='xMidYMid slice'
                  />
                </g>
              </g>
            )
          })}
        </g>
      )}
    </g>
  )
}

interface ItemLayout {
  textWidth: number
  imageWidth: number
  totalWidth: number
}

function getItemLayout(item: Item): ItemLayout {
  const textWidth = ITEM_LAYOUT.textWidth
  const numImages = getItemImageContent(item).length
  const imageWidth =
    numImages > 0
      ? ITEM_LAYOUT.imageWidth + ITEM_LAYOUT.imageStride * (numImages - 1)
      : 0
  return {
    textWidth,
    imageWidth,
    totalWidth: textWidth + imageWidth,
  }
}

interface ItemPlacement {
  pos: Vec2
  width: number
  height: number
  item: Item | null
  node: DrawTree<Item | null>
}

interface TreeLayout {
  placements: Map<number, ItemPlacement>
  left: number
  right: number
  top: number
  bottom: number
  maxDepth: number
}

function computeLayout(tree: ChatTree): TreeLayout {
  // Construct tree
  function traverse(node: TreeNode<Item | null>): void {
    const children = tree.getChildren(node.value?.id || null)
    for (const child of children) {
      const { totalWidth } = getItemLayout(child)
      const childNode = {
        value: child,
        width: totalWidth,
        children: [],
      }
      node.children.push(childNode)
      traverse(childNode)
    }
  }

  // Solve layout
  const root = {
    value: null,
    width: ITEM_LAYOUT.height / 2,
    children: [],
  }
  traverse(root)

  const gap = 35
  const verticalStride = 2 * ITEM_LAYOUT.height
  const dt = drawTree({ root, gap })

  // Build placement map
  const placements = new Map<number | null, ItemPlacement>()
  function collectPlacements(dt: DrawTree<Item | null>) {
    placements.set(dt.node?.value?.id || null, {
      pos: new Vec2(dt.x, dt.depth * verticalStride),
      width: dt.node.width,
      height: ITEM_LAYOUT.height,
      item: dt.node.value,
      node: dt,
    })
    for (const child of dt.children) {
      collectPlacements(child)
    }
  }

  collectPlacements(dt)

  // Delete the null/root node (no longer needed)
  placements.delete(null)

  if (placements.size === 0) {
    return {
      placements: new Map(),
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      maxDepth: 0,
    }
  }

  // Compute overall dimensions and depth
  let left = Infinity
  let right = -Infinity
  let top = Infinity
  let bottom = -Infinity
  let maxDepth = 0
  placements.forEach(({ pos, width: w, height: h, node }) => {
    left = Math.min(left, pos.x)
    right = Math.max(right, pos.x + w)
    top = Math.min(top, pos.y)
    bottom = Math.max(bottom, pos.y + h)
    maxDepth = Math.max(maxDepth, node.depth)
  })
  console.log({ left, right, top, bottom, maxDepth })

  return {
    placements: placements as Map<number, ItemPlacement>,
    left,
    right,
    top,
    bottom,
    maxDepth,
  }
}

function computeHighlighted(
  tree: ChatTree,
  hoveredItemId: number | null,
): Set<number> | null {
  if (hoveredItemId === null) return null
  const highlighted = new Set<number>()

  // Highlight the hovered item and its ancestors
  let cur: Item = tree.getLatestLeaf(tree.get(hoveredItemId))
  while (cur) {
    highlighted.add(cur.id)
    if (cur.parentId === null) break
    cur = tree.get(cur.parentId)
  }

  return highlighted
}

interface TreeSvgProps {
  tree: ChatTree
  placements: Map<number | null, ItemPlacement>
  onSelect: (item: Item) => void | Promise<void>
}

/** The actual item tree itself. */
function TreeSvg({ tree, placements, onSelect }: TreeSvgProps) {
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null)

  let highlighted = computeHighlighted(tree, hoveredItemId)
  let showHighlighted
  if (highlighted === null) {
    showHighlighted = false
    highlighted = new Set()
  } else {
    showHighlighted = true
  }

  return (
    <svg id='treeSvg' width='100%' height='100%' className={styles.treeSvg}>
      <g
        id='viewport'
        transform='translate(0, 0) scale(1)'
        data-dimmed={showHighlighted}
      >
        <g>
          {[...placements.values()].map(({ pos, height, item }) => {
            // Render path from item to parent
            const key = `${item?.id}-path`
            const parent = placements.get(item?.parentId || null)
            if (!parent || !parent.item) return <React.Fragment key={key} />
            return (
              <TreeEdge
                key={key}
                srcX={parent.pos.x + ITEM_LAYOUT.textWidth / 2}
                srcY={parent.pos.y + height}
                dstX={pos.x + ITEM_LAYOUT.textWidth / 2}
                dstY={pos.y}
                cornerRadius={10}
                highlighted={!!item && highlighted.has(item.id)}
              />
            )
          })}
        </g>
        <g>
          {[...placements.values()].map(({ pos, item }) => {
            // Render item
            if (!item) {
              throw new Error('unreachable')
            }
            return (
              <TreeItem
                key={item?.id}
                x={pos.x}
                y={pos.y}
                item={item}
                hovered={hoveredItemId === item?.id}
                onMouseEnter={() => setHoveredItemId(item?.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                onClick={() => onSelect(item)}
                highlighted={!!item && highlighted.has(item.id)}
              />
            )
          })}
        </g>
      </g>
    </svg>
  )
}

interface GridColors {
  background: string
  majorLine: string
  minorLine: string
}

class ViewController {
  private canvas: HTMLCanvasElement
  private div: HTMLDivElement
  private viewportCenter: Vec2
  public viewportYExtent: number
  private dirty: boolean
  private mousePos: Vec2 | null = null
  private _isDragging: boolean = false
  private dragStartPos: Vec2 | null = null
  private animationFrameId: number | null = null

  constructor(canvas: HTMLCanvasElement, div: HTMLDivElement) {
    this.canvas = canvas
    this.div = div
    this.viewportCenter = new Vec2(0, 0)
    this.viewportYExtent = 10
    this.dirty = true
    this.updateCanvasSize()
    this.setupEventListeners()
    this.startRenderLoop()
  }

  public setViewportBounds(
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): void {
    const yExtent = Math.max(top - bottom, (right - left) / this.aspectRatio())
    this.viewportCenter = new Vec2((left + right) / 2, (top + bottom) / 2)
    this.viewportYExtent = yExtent
  }

  public updateCanvasSize(): void {
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width
    this.canvas.height = rect.height
  }

  /** Marks the controller state as dirty and needing a rerender. */
  public markDirty(): void {
    this.dirty = true
  }

  public get isDragging(): boolean {
    return this._isDragging
  }

  private set isDragging(value: boolean) {
    this._isDragging = value
  }

  private aspectRatio(): number {
    return this.canvas.width / this.canvas.height
  }

  /** Dimensions of the viewport in world coordinates. */
  private viewportExtent(): Vec2 {
    return new Vec2(
      this.aspectRatio() * this.viewportYExtent,
      this.viewportYExtent,
    )
  }

  private worldScreenScale(): number {
    return this.canvas.height / this.viewportYExtent
  }

  /** Converts from world coords to screen coords (pixels). */
  private worldToScreen(worldPos: Vec2): Vec2 {
    const extent = this.viewportExtent()
    const relativePos = worldPos.minus(this.viewportCenter)

    const normalizedX = relativePos.x / extent.x + 0.5
    const normalizedY = relativePos.y / extent.y + 0.5
    const screenX = normalizedX * this.canvas.width
    const screenY = (1 - normalizedY) * this.canvas.height // Canvas Y is inverted

    return new Vec2(screenX, screenY)
  }

  /** Converts from screen coords (pixels) to world coords. */
  private screenToWorld(screenPos: Vec2): Vec2 {
    const extent = this.viewportExtent()

    const normalizedX = screenPos.x / this.canvas.width
    const normalizedY = 1 - screenPos.y / this.canvas.height
    const worldX = this.viewportCenter.x + (normalizedX - 0.5) * extent.x
    const worldY = this.viewportCenter.y + (normalizedY - 0.5) * extent.y

    return new Vec2(worldX, worldY)
  }

  private getColors(): GridColors {
    const style = getComputedStyle(this.canvas)
    return {
      background: style.getPropertyValue('--color-grid-bg') || 'black',
      majorLine: style.getPropertyValue('--color-grid-line-major') || 'black',
      minorLine: style.getPropertyValue('--color-grid-line-minor') || 'black',
    }
  }

  /** Starts a loop to request a render frame and rerender if dirty. */
  private startRenderLoop(): void {
    const renderFrame = () => {
      this.render()
      this.animationFrameId = requestAnimationFrame(renderFrame)
    }
    this.animationFrameId = requestAnimationFrame(renderFrame)
  }

  private stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  public render(): void {
    if (!this.dirty) return

    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = this.getColors().background
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.drawGrid(ctx)
    this.updateSvg()

    this.dirty = false
  }

  /** Draws the background grid. This is the only thing we use the canvas for. */
  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const colors = this.getColors()
    const extent = this.viewportExtent()
    // Grid size automatically scales to the nearest power of 2 that fits
    // 2^(-3) grid cells
    const gridSize = Math.pow(2, Math.floor(Math.log2(extent.y) - 2.5))

    // Define line properties (in screen pixels) relative to grid size
    const s = (gridSize / extent.y) * this.canvas.height
    ctx.lineWidth = 0.5
    ctx.setLineDash([s / 128, s / 32 - s / 128])

    const left = this.viewportCenter.x - extent.x / 2
    const right = this.viewportCenter.x + extent.x / 2
    const top = this.viewportCenter.y + extent.y / 2
    const bottom = this.viewportCenter.y - extent.y / 2

    const startX = Math.floor(left / gridSize) * gridSize
    const startY = Math.floor(bottom / gridSize) * gridSize
    const endX = Math.ceil(right / gridSize) * gridSize
    const endY = Math.ceil(top / gridSize) * gridSize

    const drawVertical = (x: number, color: string) => {
      const start = this.worldToScreen(new Vec2(x, startY))
      const end = this.worldToScreen(new Vec2(x, endY))
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    const drawHorizontal = (y: number, color: string) => {
      const start = this.worldToScreen(new Vec2(startX, y))
      const end = this.worldToScreen(new Vec2(endX, y))
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    for (let i = 0; startX + i * gridSize <= endX; i++) {
      const x = startX + i * gridSize
      drawVertical(x, colors.majorLine)
      drawVertical(x + gridSize / 4, colors.minorLine)
      drawVertical(x + gridSize / 2, colors.minorLine)
      drawVertical(x + (3 * gridSize) / 4, colors.minorLine)
    }

    for (let i = 0; startY + i * gridSize <= endY; i++) {
      const y = startY + i * gridSize
      drawHorizontal(y, colors.majorLine)
      drawHorizontal(y + gridSize / 4, colors.minorLine)
      drawHorizontal(y + gridSize / 2, colors.minorLine)
      drawHorizontal(y + (3 * gridSize) / 4, colors.minorLine)
    }

    ctx.setLineDash([])
  }

  /** Updates the SVG viewport transform to match the canvas viewport. */
  private updateSvg(): void {
    const viewport = document.getElementById('viewport')
    if (!viewport) return

    const scale = this.worldScreenScale()

    const screenCenter = this.worldToScreen(new Vec2(0, 0))
    const translateX = screenCenter.x
    const translateY = screenCenter.y

    const transform = `translate(${translateX}, ${translateY}) scale(${scale})`
    viewport.setAttribute('transform', transform)
  }

  private shouldStartDragging(): boolean {
    if (!this.mousePos || !this.dragStartPos) return false
    const distance = this.mousePos.minus(this.dragStartPos)
    const dragThreshold = 3 // pixels
    return (
      distance.x * distance.x + distance.y * distance.y >
      dragThreshold * dragThreshold
    )
  }

  private setupEventListeners() {
    this.div.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.div.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.div.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.div.addEventListener('mouseleave', this.handleMouseUp.bind(this))
    this.div.addEventListener('wheel', this.handleWheel.bind(this))
  }

  private handleMouseDown(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const pos = new Vec2(event.clientX - rect.left, event.clientY - rect.top)
    this.dragStartPos = pos
    this.mousePos = pos
  }

  private handleMouseMove(event: MouseEvent) {
    // Update mouse pos
    const rect = this.canvas.getBoundingClientRect()
    const currentMousePos = new Vec2(
      event.clientX - rect.left,
      event.clientY - rect.top,
    )
    const previousMousePos = this.mousePos
    this.mousePos = currentMousePos

    this.isDragging ||= this.shouldStartDragging()
    if (!this.isDragging || !previousMousePos) return

    // Handle dragging
    this.canvas.style.cursor = 'grabbing'

    const lastWorldPos = this.screenToWorld(previousMousePos)
    const currentWorldPos = this.screenToWorld(currentMousePos)
    const worldDelta = lastWorldPos.minus(currentWorldPos)
    this.viewportCenter = this.viewportCenter.plus(worldDelta)

    this.markDirty()
  }

  private handleMouseUp() {
    // We want to block onclick handlers from running at the end of a drag
    // event. However, click events fire *after* mouseup events, so we use a
    // timeout to delay ending the drag until after click handlers have run.
    setTimeout(() => {
      this.dragStartPos = null
      this.canvas.style.cursor = 'grab'
      this.isDragging = false
    }, 0)
  }

  private handleWheel(event: WheelEvent) {
    event.preventDefault()

    const zoomDelta = Math.sign(event.deltaY)
    const zoomFactor = Math.pow(10, 0.1 * zoomDelta)

    const worldPos = this.screenToWorld(new Vec2(event.clientX, event.clientY))
    const relPos = this.viewportCenter.minus(worldPos).times(zoomFactor)
    this.viewportCenter = worldPos.plus(relPos)

    this.viewportYExtent *= zoomFactor

    this.markDirty()
  }

  public destroy() {
    this.stopRenderLoop()
    this.div.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    this.div.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    this.div.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    this.div.removeEventListener('mouseleave', this.handleMouseUp.bind(this))
    this.div.removeEventListener('wheel', this.handleWheel.bind(this))
  }
}

interface TreeViewProps {
  tree: ChatTree
  onClose: () => void
  onSelect: (item: Item) => void | Promise<void>
}

export default function TreeView({ tree, onClose, onSelect }: TreeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const divRef = useRef<HTMLDivElement>(null)
  const viewControllerRef = useRef<ViewController | null>(null)

  const { placements, left, right, top, bottom } = computeLayout(tree)

  const handleSelect = (item: Item) => {
    if (!viewControllerRef.current || viewControllerRef.current.isDragging)
      return
    onSelect(item)
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    if (!canvasRef.current || !divRef.current) {
      return
    }

    const viewController = new ViewController(canvasRef.current, divRef.current)
    viewController.setViewportBounds(left, -top, right, -bottom)
    viewController.viewportYExtent *= Math.pow(10, 0.1)
    viewControllerRef.current = viewController

    // Set initial cursor style
    divRef.current.style.cursor = 'grab'

    // Set up ResizeObserver to handle canvas resizing
    const resizeObserver = new ResizeObserver(() => {
      if (viewController) {
        viewController.updateCanvasSize()
        viewController.markDirty()
      }
    })

    resizeObserver.observe(canvasRef.current)

    return () => {
      resizeObserver.disconnect()
      viewController.destroy()
    }
  }, [])

  return (
    <div className={styles.viewContainer} ref={divRef}>
      <button className={styles.closeButton} onClick={onClose}>
        <XMarkIcon className={styles.icon} />
      </button>
      <TreeSvg tree={tree} placements={placements} onSelect={handleSelect} />
      <canvas className={styles.canvas} ref={canvasRef} />
    </div>
  )
}
