import { InlineContent, StaticContent } from '@/lib/frontend/api'
import { XMarkIcon } from '@heroicons/react/24/outline'
import styles from './AttachedImages.module.scss'

interface ImageThumbnailProps {
  content: InlineContent | StaticContent
  onRemove(): void | Promise<void>
  onClick(): void | Promise<void>
}

function ImageThumbnail({ content, onRemove, onClick }: ImageThumbnailProps) {
  let imageUri
  switch (content.type) {
    case 'inline':
      imageUri = `data:${content.mimeType};base64,${content.data}`
      break
    case 'static':
      imageUri = content.url
      break
  }

  return (
    <div className={styles.imageThumbnail}>
      <img
        src={imageUri}
        alt='Uploaded image'
        className={styles.thumbnailImage}
        onClick={onClick}
        role='button'
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
      />
      <button
        onClick={onRemove}
        className={styles.removeButton}
        type='button'
        aria-label='Remove image'
        title='Remove image'
      >
        <XMarkIcon className={styles.removeIcon} />
      </button>
    </div>
  )
}

interface AttachedImagesProps {
  images: (InlineContent | StaticContent)[]
  onRemoveImage(index: number): void | Promise<void>
  onPreviewImage(index: number): void | Promise<void>
}

export function AttachedImages({
  images,
  onRemoveImage,
  onPreviewImage,
}: AttachedImagesProps) {
  if (images.length === 0) {
    return null
  }

  return (
    <div className={styles.thumbnailsContainer}>
      {images.map((image, index) => (
        <ImageThumbnail
          key={index}
          content={image}
          onRemove={() => onRemoveImage(index)}
          onClick={() => onPreviewImage(index)}
        />
      ))}
    </div>
  )
}
