import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { APP_ID } from '../config';

function ref(path: string, ...segments: string[]) {
  return doc(db, 'artifacts', APP_ID, 'public', 'data', path, ...segments);
}

export function generateShareId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return id;
}

export async function uploadReplayJson(json: string): Promise<string> {
  const id = generateShareId();
  await setDoc(ref('sharedReplays', id), {
    json,
    createdAt: Timestamp.now(),
  });
  return id;
}

export async function fetchReplayJson(id: string): Promise<string | null> {
  const snap = await getDoc(ref('sharedReplays', id));
  if (!snap.exists()) return null;
  return snap.data().json as string;
}

export function buildShareUrl(id: string): string {
  const url = new URL(window.location.href);
  url.search = `?id=${id}`;
  url.hash = '';
  return url.toString();
}

export function getShareIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}
