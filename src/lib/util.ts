import { ValidationError } from "@/lib/error"

export function parseInteger(x: string): number {
    const num = parseInt(x)
    if (isNaN(num)) {
        throw new ValidationError(`Invalid integer: ${num}`)
    }
    return num
}