import { buildNoteShareContent, type NoteShareContentInput } from '@/lib/noteExport';
import { getArchivEyeApiBaseUrl } from './archiveyeConfig';
import { getValidArchivEyeAccessToken } from './archiveyeAuth';

export function archiveyeExternalIdForNote(noteId: number): string {
  return `mnemo:note:${noteId}`;
}

export async function uploadNoteToArchivEye(
  noteId: number,
  title: string,
  shareInput: NoteShareContentInput,
): Promise<{ documentId: string | null; url: string | null }> {
  const accessToken = await getValidArchivEyeAccessToken();
  const bodyMarkdown = buildNoteShareContent(shareInput);
  const safeTitle = title?.trim() || 'Untitled Note';
  const content = `# ${safeTitle}\n\n${bodyMarkdown}`.trim();

  const response = await fetch(`${getArchivEyeApiBaseUrl()}/v1/documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: safeTitle,
      content,
      contentType: 'text/markdown',
      source: 'mnemo',
      externalId: archiveyeExternalIdForNote(noteId),
    }),
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!response.ok) {
    throw new Error(String(payload.message ?? payload.error ?? payload.detail ?? 'Upload failed'));
  }

  return {
    documentId:
      typeof payload.id === 'string'
        ? payload.id
        : typeof payload.documentId === 'string'
          ? payload.documentId
          : null,
    url: typeof payload.url === 'string' ? payload.url : null,
  };
}
