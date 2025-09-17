import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import styles from './ImagePreview.module.scss'

interface ImagePreviewProps {
  imageUri: string
  onClose: () => void
}

export default function ImagePreview({ imageUri, onClose }: ImagePreviewProps) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: globalThis.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // Add escape key listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className={styles.imagePreviewOverlay} onClick={handleOverlayClick}>
      <div className={styles.imagePreviewContainer}>
        <button
          onClick={onClose}
          className={styles.imagePreviewCloseButton}
          type='button'
          aria-label='Close image preview'
          title='Close image preview'
        >
          <XMarkIcon className={styles.imagePreviewCloseIcon} />
        </button>
        <img
          src={imageUri}
          alt='Image preview'
          className={styles.imagePreviewImage}
        />
      </div>
    </div>
  )
}
