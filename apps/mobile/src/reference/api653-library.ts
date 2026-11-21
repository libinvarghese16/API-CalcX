import data from './api653-library.json' with { type: 'json' };
import { api653Guidance } from './api653-guidance.ts';

export type SourceExtract = {
 file: string; clauses: string[]; artwork: string[]; searchText: string; width: number; height: number;
};
export type ReferenceTopic = {
 id: string; group: string; title: string; status: string; sources: string[];
 clauses: string[]; clauseSources: Partial<Record<string, string[]>>; artwork: string[];
};
export const api653Library: {edition: string; sourceSha256: string; topics: ReferenceTopic[]; sources: Record<string, SourceExtract>} = data;

export function findTopics(query: string, group: string): ReferenceTopic[] {
 const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return api653Library.topics.filter(topic => {
  if (group && topic.group !== group) return false;
  const text = [topic.id, topic.title, topic.status, ...topic.clauses, ...topic.artwork,
   ...(api653Guidance[topic.id] || []).map(item => `${item.clause} ${item.text}`),
   ...topic.sources.map(id => api653Library.sources[id]?.searchText || '')].join(' ').toLowerCase();
  return tokens.every(token => text.includes(token));
 });
}

export function sourceIdsFor(topic: ReferenceTopic, item: string): string[] {
 if (!item) return topic.sources;
 if (topic.clauseSources[item]) return topic.clauseSources[item];
 return topic.sources.filter(id => api653Library.sources[id]?.artwork.includes(item));
}

export function sourceCaption(source: SourceExtract, topic: ReferenceTopic): string {
 const clauses = source.clauses.filter(c => topic.clauses.includes(c));
 const clauseLabel = clauses.length ? `Clauses ${clauses[0]}${clauses.length > 1 ? `–${clauses.at(-1)}` : ''}` : '';
 const artwork = source.artwork.filter(a => topic.artwork.includes(a)).join('; ');
 return [clauseLabel, artwork].filter(Boolean).join(' · ') || `${topic.group === 'Annexes' ? 'Annex' : 'Clause'} ${topic.id} — continuation / supporting material`;
}
