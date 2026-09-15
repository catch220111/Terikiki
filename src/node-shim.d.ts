declare module 'fs' {
  export function readFileSync(path: string, encoding: string): string;
}

declare module 'path' {
  export function dirname(path: string): string;
  export function join(...paths: string[]): string;
}

declare module 'url' {
  export function fileURLToPath(url: string): string;
}
