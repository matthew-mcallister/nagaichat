import Api, { Item, getItemImageUris, getItemText } from '@/lib/frontend/api'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useRef } from 'react'
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

// TODO: look up color variables with getComputedStyle
const LIGHT_COLORS = {
  background: '#e5e7eb',
  grid: '#0f172a',
  gridAlt: '#64748b',
}

interface TreeItemProps {
  x: number
  y: number
  item: Item
}

function TreeItem({ x, y, item }: TreeItemProps) {
  const text = getItemText(item) || ''
  const imageUris = getItemImageUris(item).slice(0, 3)
  const hasImages = imageUris.length > 0

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={300}
        height={125}
        rx={10}
        className={styles.treeNode}
      />
      {
        // It looks weird, but we have to implement padding manually due to
        // -webkit-line-clamp interacting with padding incorrectly.
      }
      <foreignObject x={x + 16} y={y + 16} width={300 - 32} height={125 - 32}>
        <p className={styles.treeNodeText}>{text}</p>
      </foreignObject>
      {hasImages && (
        <g>
          {imageUris.reverse().map((imageUri, i) => {
            const index = imageUris.length - i - 1
            const offsetX = x + 300 + 10 + index * 15
            return (
              <g key={index}>
                <defs>
                  <clipPath id={`clip-${item.id}-${index}`}>
                    <rect x={offsetX} y={y} width={125} height={125} rx={10} />
                  </clipPath>
                </defs>
                <g className={styles.imageOuter}>
                  <image
                    x={offsetX}
                    y={y}
                    width={125}
                    height={125}
                    href={imageUri}
                    clipPath={`url(#clip-${item.id}-${index})`}
                    className={styles.treeNodeImage}
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

interface TreeSvgProps {
  items: Item[]
}

/** The actual item tree itself. */
function TreeSvg({ items }: TreeSvgProps) {
  return (
    <svg id='treeSvg' width='100%' height='100%' className={styles.treeSvg}>
      <g id='viewport' transform='translate(0, 0) scale(1)'>
        {items.map((item, index) => {
          const offset = 500 * index
          return (
            <TreeItem
              key={item.id || index}
              x={offset}
              y={-125 / 2}
              item={item}
            />
          )
        })}
      </g>
    </svg>
  )
}

class ViewController {
  private canvas: HTMLCanvasElement
  private viewportCenter: Vec2
  private dirty: boolean
  private zoomLevel: number
  private mousePos: Vec2 | null = null
  private isMouseDown: boolean = false
  private isDragging: boolean = false
  private dragStartPos: Vec2 | null = null
  private animationFrameId: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.viewportCenter = new Vec2(0, 0)
    this.dirty = true
    this.zoomLevel = 10
    this.updateCanvasSize()
    this.setupEventListeners()
    this.startRenderLoop()
  }

  /**
   * Height of the viewport rectangle in world space. The width of the viewport
   * is `viewportYExtent * viewportAspectRatio`.
   */
  private get viewportYExtent(): number {
    // Zoom is logarithmic: 10 scrolls zooms in or out by a factor of 10.
    return Math.pow(10, 0.1 * this.zoomLevel)
  }

  public updateCanvasSize() {
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width
    this.canvas.height = rect.height
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

  /** Marks the controller state as dirty and needing a rerender. */
  public markDirty(): void {
    this.dirty = true
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
    ctx.fillStyle = LIGHT_COLORS.background
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.drawGrid(ctx)
    this.updateSvg()

    this.dirty = false
  }

  /** Draws the background grid. This is the only thing we use the canvas for. */
  private drawGrid(ctx: CanvasRenderingContext2D): void {
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

    const view = this
    function drawVertical(x: number, color: string) {
      const start = view.worldToScreen(new Vec2(x, startY))
      const end = view.worldToScreen(new Vec2(x, endY))
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    function drawHorizontal(y: number, color: string) {
      const start = view.worldToScreen(new Vec2(startX, y))
      const end = view.worldToScreen(new Vec2(endX, y))
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    for (let i = 0; startX + i * gridSize <= endX; i++) {
      const x = startX + i * gridSize
      drawVertical(x, LIGHT_COLORS.grid)
      drawVertical(x + gridSize / 4, LIGHT_COLORS.gridAlt)
      drawVertical(x + gridSize / 2, LIGHT_COLORS.gridAlt)
      drawVertical(x + (3 * gridSize) / 4, LIGHT_COLORS.gridAlt)
    }

    for (let i = 0; startY + i * gridSize <= endY; i++) {
      const y = startY + i * gridSize
      drawHorizontal(y, LIGHT_COLORS.grid)
      drawHorizontal(y + gridSize / 4, LIGHT_COLORS.gridAlt)
      drawHorizontal(y + gridSize / 2, LIGHT_COLORS.gridAlt)
      drawHorizontal(y + (3 * gridSize) / 4, LIGHT_COLORS.gridAlt)
    }

    ctx.setLineDash([])
  }

  /** Updates the SVG viewport transform to match the canvas viewport. */
  private updateSvg(): void {
    const viewport = document.getElementById('viewport')
    if (!viewport) return

    const scale = this.worldScreenScale() / 100

    const screenCenter = this.worldToScreen(new Vec2(0, 0))
    const translateX = screenCenter.x
    const translateY = screenCenter.y

    const transform = `translate(${translateX}, ${translateY}) scale(${scale})`
    viewport.setAttribute('transform', transform)
  }

  private startDragging(): boolean {
    if (!this.mousePos || !this.dragStartPos) return false
    const distance = this.mousePos.minus(this.dragStartPos)
    const dragThreshold = 3 // pixels
    return (
      distance.x * distance.x + distance.y * distance.y >
      dragThreshold * dragThreshold
    )
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this))
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

    this.isDragging ||= this.startDragging()
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
    this.isDragging = false
    this.dragStartPos = null
    this.canvas.style.cursor = 'grab'
  }

  private handleWheel(event: WheelEvent) {
    event.preventDefault()

    // XXX: Should zoom in on cursor position instead of center of screen
    const zoomDelta = Math.sign(event.deltaY)
    this.zoomLevel += zoomDelta

    this.markDirty()
  }

  public destroy() {
    this.stopRenderLoop()
    this.canvas.removeEventListener(
      'mousedown',
      this.handleMouseDown.bind(this),
    )
    this.canvas.removeEventListener(
      'mousemove',
      this.handleMouseMove.bind(this),
    )
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp.bind(this))
    this.canvas.removeEventListener('wheel', this.handleWheel.bind(this))
  }
}

interface TreeViewInnerProps {
  items: Item[]
  onSelect: (item: Item) => void | Promise<void>
}

function TreeViewInner({ items, onSelect }: TreeViewInnerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewControllerRef = useRef<ViewController | null>(null)

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }

    const viewController = new ViewController(canvasRef.current)
    viewControllerRef.current = viewController

    // Set initial cursor style
    canvasRef.current.style.cursor = 'grab'

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
    <>
      <TreeSvg items={items} />
      <canvas className={styles.canvas} ref={canvasRef} />
    </>
  )
}

interface TreeViewProps {
  sessionId: number
  onClose: () => void
  onSelect: (item: Item) => void | Promise<void>
}

export function TreeView({ sessionId, onClose, onSelect }: TreeViewProps) {
  const api = new Api()
  const items = api.useSessionItems(sessionId)

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

  return (
    <div>
      <button className={styles.closeButton} onClick={onClose}>
        <XMarkIcon className={styles.icon} />
      </button>

      {items && <TreeViewInner items={items} onSelect={onSelect} />}
    </div>
  )
}
