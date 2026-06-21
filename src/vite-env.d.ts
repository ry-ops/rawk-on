/// <reference types="vite/client" />

// Force-inline image imports (`?inline`) resolve to a base64 data: URI string.
declare module '*.jpeg?inline' {
  const src: string
  export default src
}

declare module '*.png?inline' {
  const src: string
  export default src
}
