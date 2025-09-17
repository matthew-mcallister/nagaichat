import { ImageContent, InlineContent, StaticContent } from '@/lib/frontend/api'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import styles from './AttachedImages.module.scss'
import ImagePreview from './ImagePreview'

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
  images: ImageContent[]
  setImages: (images: ImageContent[]) => void
}

export function AttachedImages({ images, setImages }: AttachedImagesProps) {
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null)

  if (images.length === 0) {
    return null
  }

  function handleRemoveImage(index: number) {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
  }

  function handlePreviewImage(index: number) {
    const image = images[index]
    let imageUri: string
    switch (image.type) {
      case 'inline':
        imageUri = `data:${image.mimeType};base64,${image.data}`
        break
      case 'static':
        imageUri = image.url
        break
    }
    setPreviewImageUri(imageUri)
  }

  function handleClosePreview() {
    setPreviewImageUri(null)
  }

  return (
    <>
      <div className={styles.thumbnailsContainer}>
        {images.map((image, index) => (
          <ImageThumbnail
            key={index}
            content={image}
            onRemove={() => handleRemoveImage(index)}
            onClick={() => handlePreviewImage(index)}
          />
        ))}
      </div>
      {previewImageUri && (
        <ImagePreview imageUri={previewImageUri} onClose={handleClosePreview} />
      )}
    </>
  )
}
