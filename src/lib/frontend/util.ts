import { ImageContent, InlineContent } from './api'

/**
 * Converts a File object to a base64 string.
 *
 * @param file The file to convert
 * @returns Promise that resolves to the base64 data (without data URL prefix)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix to get just the base64 data
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Handles file selection from an input element, converting images to base64.
 *
 * @param files FileList from input element
 * @param onImageAdd Callback function to add processed images
 */
export async function handleImageSelection(
  files: FileList | null,
  onImageAdd: (image: ImageContent) => void
): Promise<void> {
  if (!files) return

  for (const file of Array.from(files)) {
    if (file.type === 'image/png' || file.type === 'image/jpeg') {
      const base64 = await fileToBase64(file)
      const inlineContent: InlineContent = {
        type: 'inline',
        mimeType: file.type,
        data: base64,
      }
      onImageAdd(inlineContent)
    }
  }
}

/**
 * Handles paste events, extracting and processing image data.
 *
 * @param clipboardData ClipboardData from paste event
 * @param onImageAdd Callback function to add processed images
 * @returns Promise that resolves to true if images were processed, false otherwise
 */
export async function handleImagePaste(
  clipboardData: DataTransfer | null,
  onImageAdd: (image: ImageContent) => void
): Promise<boolean> {
  if (!clipboardData) return false

  const items = Array.from(clipboardData.items)
  const imageItems = items.filter(item => item.type.startsWith('image/'))

  if (imageItems.length === 0) return false

  for (const item of imageItems) {
    if (item.type === 'image/png' || item.type === 'image/jpeg') {
      const file = item.getAsFile()
      if (file) {
        const base64 = await fileToBase64(file)
        const inlineContent: InlineContent = {
          type: 'inline',
          mimeType: file.type,
          data: base64,
        }
        onImageAdd(inlineContent)
      }
    }
  }

  return true
}