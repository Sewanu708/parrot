export function expiresIn(minutes: number) {
    const now = new Date().getTime();
    return new Date(now + minutes * 60000).getTime();
}
