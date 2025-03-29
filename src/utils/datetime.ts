export function isoTruncDate() {
    return new Date().toISOString().slice(0, 10)
}
