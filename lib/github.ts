import "server-only";

/**
 * Relays a large video or PDF to a GitHub Release asset instead of storing
 * it ourselves — the app's own /files/{id} route only works for files small
 * enough to fit through a single request (see lib/uploadLimits.ts), but a
 * GitHub Release asset supports up to 2GB and is served from GitHub's own
 * CDN, not this app's function.
 *
 * Requires the target repository to be public: GitHub only serves a Release
 * asset's `browser_download_url` to unauthenticated requests when the repo
 * is public — a private repo would 404 for every exhibition visitor, which
 * defeats the entire point of this feature. GITHUB_MEDIA_TOKEN only needs
 * Contents: Read and write on this one repo (a fine-grained PAT), never
 * broader account access.
 */
const GITHUB_API = "https://api.github.com";
const REPO_OWNER = "jaeneung";
const REPO_NAME = "student-exhibition-platform";
const RELEASE_TAG = "media-uploads";

function requireGithubToken(): string {
  const token = process.env.GITHUB_MEDIA_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_MEDIA_TOKEN is not set. Media relay-to-GitHub requires a fine-grained " +
        "Personal Access Token scoped to this repo's Contents (Read and write) — see README."
    );
  }
  return token;
}

async function githubFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireGithubToken()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
  });
}

interface GithubRelease {
  id: number;
}

/** Finds the shared release every relayed file is attached to as an asset,
 * creating it on first use. Deliberately a real, published (non-draft)
 * release — a draft release's assets require authentication to download,
 * which would break playback/download for anonymous exhibition visitors the
 * same way a private repo would. */
async function getOrCreateRelease(): Promise<number> {
  const existing = await githubFetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${RELEASE_TAG}`
  );
  if (existing.ok) {
    const release = (await existing.json()) as GithubRelease;
    return release.id;
  }
  if (existing.status !== 404) {
    throw new Error(`Failed to look up the GitHub release (status ${existing.status}).`);
  }

  const created = await githubFetch(`${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/releases`, {
    method: "POST",
    body: JSON.stringify({
      tag_name: RELEASE_TAG,
      target_commitish: "main",
      name: "Media Uploads (student project videos/PDFs)",
      body:
        "Automatically created and managed by the exhibition platform to host student-submitted " +
        "video and PDF files too large to serve directly from the app itself. Live project links " +
        "point here — please don't delete this release or its assets.",
      draft: false,
      prerelease: false,
    }),
  });
  if (!created.ok) {
    throw new Error(`Failed to create the GitHub release (status ${created.status}).`);
  }
  const release = (await created.json()) as GithubRelease;
  return release.id;
}

interface GithubReleaseAsset {
  browser_download_url: string;
}

/** Uploads `buffer` as a new asset on the shared release and returns its
 * public download URL. `filename` is prefixed with a timestamp so two
 * students submitting a file with the same name never collide. */
export async function uploadFileToGithub(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const releaseId = await getOrCreateRelease();
  const safeName = `${Date.now()}-${filename}`.replace(/[^a-zA-Z0-9._-]/g, "_");

  const uploaded = await githubFetch(
    `https://uploads.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${releaseId}/assets?name=${encodeURIComponent(safeName)}`,
    {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: Uint8Array.from(buffer),
    }
  );
  if (!uploaded.ok) {
    throw new Error(`Failed to upload the file to GitHub (status ${uploaded.status}).`);
  }
  const asset = (await uploaded.json()) as GithubReleaseAsset;
  return asset.browser_download_url;
}
