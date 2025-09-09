import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface TimedLyricLine {
  time: number; // seconds
  text: string;
}

// Parses basic LRC format like: [mm:ss.xx] line
export function parseLRC(lyrics: string): TimedLyricLine[] {
  if (!lyrics) return [];
  const lines = lyrics.split(/\r?\n/);
  const result: TimedLyricLine[] = [];
  const timeTagRegex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;

  for (const raw of lines) {
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    const timeTags: number[] = [];
    while ((match = timeTagRegex.exec(raw)) !== null) {
      const minutes = parseInt(match[1], 10) || 0;
      const seconds = parseInt(match[2], 10) || 0;
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      timeTags.push(minutes * 60 + seconds + ms / 1000);
      lastIndex = timeTagRegex.lastIndex;
    }
    const text = raw.slice(lastIndex).trim();
    if (timeTags.length === 0) {
      continue;
    }
    for (const t of timeTags) {
      result.push({ time: t, text });
    }
  }
  result.sort((a, b) => a.time - b.time);
  return result;
}
