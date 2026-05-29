const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const apiOrigin = new URL(apiUrl).origin;

export function resolveAssetUrl(path?: string | null) {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${apiOrigin}${path}`;
  }

  return `${apiOrigin}/${path}`;
}
