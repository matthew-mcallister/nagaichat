import Api, { Item } from '@/lib/frontend/api'
import { XMarkIcon } from '@heroicons/react/24/outline'
import React, { useEffect } from 'react'
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
}

interface Colors {
  background: string
  grid: string
}

// TODO: fill in correct colors; also dark mode
const LIGHT_COLORS: Colors = {
  background: 'white',
  grid: 'grey',
}

class ViewController {
  private canvas: HTMLCanvasElement
  private viewportCenter: Vec2
  private viewportYExtent: number
  private mousePos: Vec2 | null = null
  private isMouseDown: boolean = false
  private isDragging: boolean = false
  private dragStartPos: Vec2 | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.viewportCenter = new Vec2(0, 0)
    this.viewportYExtent = 10
    this.updateCanvasSize()
    this.setupEventListeners()
    this.render()
  }

  public updateCanvasSize() {
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width
    this.canvas.height = rect.height
  }

  private aspectRatio(): number {
    return this.canvas.width / this.canvas.height
  }

  private viewportExtent(): Vec2 {
    return new Vec2(
      this.aspectRatio() * this.viewportYExtent,
      this.viewportYExtent,
    )
  }

  public render() {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = LIGHT_COLORS.background
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw grid
    this.drawGrid(ctx)
  }

  private drawGrid(ctx: CanvasRenderingContext2D) {
    const extent = this.viewportExtent()
    const gridSize = 1

    ctx.strokeStyle = LIGHT_COLORS.grid
    ctx.lineWidth = 0.4
    ctx.setLineDash([2, 8])

    const left = this.viewportCenter.x - extent.x / 2
    const right = this.viewportCenter.x + extent.x / 2
    const top = this.viewportCenter.y + extent.y / 2
    const bottom = this.viewportCenter.y - extent.y / 2

    const startX = Math.floor(left / gridSize) * gridSize
    const startY = Math.floor(bottom / gridSize) * gridSize
    const endX = Math.ceil(right / gridSize) * gridSize
    const endY = Math.ceil(top / gridSize) * gridSize

    for (let x = startX; x <= endX; x += gridSize) {
      const start = this.worldToScreen(new Vec2(x, startY))
      const end = this.worldToScreen(new Vec2(x, endY))
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    for (let y = startY; y <= endY; y += gridSize) {
      const start = this.worldToScreen(new Vec2(startX, y))
      const end = this.worldToScreen(new Vec2(endX, y))
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    ctx.setLineDash([])
  }

  private worldToScreen(worldPos: Vec2): Vec2 {
    const extent = this.viewportExtent()
    const relativePos = worldPos.minus(this.viewportCenter)

    const normalizedX = (relativePos.x + extent.x / 2) / extent.x
    const normalizedY = (relativePos.y + extent.y / 2) / extent.y
    const screenX = normalizedX * this.canvas.width
    const screenY = (1 - normalizedY) * this.canvas.height

    return new Vec2(screenX, screenY)
  }

  private screenToWorld(screenPos: Vec2): Vec2 {
    const extent = this.viewportExtent()

    const normalizedX = screenPos.x / this.canvas.width
    const normalizedY = 1 - screenPos.y / this.canvas.height
    const worldX = this.viewportCenter.x + (normalizedX - 0.5) * extent.x
    const worldY = this.viewportCenter.y + (normalizedY - 0.5) * extent.y

    return new Vec2(worldX, worldY)
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
  }

  private handleMouseDown(event: MouseEvent) {
    this.isMouseDown = true
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

    this.render()
  }

  private handleMouseUp() {
    this.isMouseDown = false
    this.isDragging = false
    this.dragStartPos = null
    this.canvas.style.cursor = 'grab'
  }

  public destroy() {
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
  }
}

interface TreeViewInnerProps {
  items: Item[]
  onSelect: (item: Item) => void | Promise<void>
}

function TreeViewInner({ items, onSelect }: TreeViewInnerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const viewControllerRef = React.useRef<ViewController | null>(null)

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
        viewController.render()
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

  return (
    <div>
      <button className={styles.closeButton} onClick={onClose}>
        <XMarkIcon className={styles.icon} />
      </button>

      {items && <TreeViewInner items={items} onSelect={onSelect} />}
    </div>
  )
}
