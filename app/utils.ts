export const base64_to_imageUrl = (base64: string | null) => {
    return `data:image/jpeg;base64,${base64}`
}