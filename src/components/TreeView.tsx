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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.viewportCenter = new Vec2(0, 0)
    this.viewportYExtent = 10
    this.updateCanvasSize()
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
