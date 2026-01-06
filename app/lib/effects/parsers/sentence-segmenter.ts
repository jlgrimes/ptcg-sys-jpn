/**
 * Sentence Segmenter for Japanese Pokemon TCG Effect Text
 *
 * Splits multi-effect text into individual effect segments while preserving
 * conditional relationships and special notations.
 */

export interface EffectSegment {
  text: string;
  isConditional: boolean;
  conditionType?: 'if' | 'when' | 'then' | 'else';
  isAnnotation: boolean; // True for ［...］ segments
  parentIndex?: number; // Index of the parent segment this modifies
  relationship: 'independent' | 'sequential' | 'conditional' | 'modifier';
}

export interface SegmentationResult {
  segments: EffectSegment[];
  originalText: string;
}

// Patterns that indicate sequential actions (do A then B)
const SEQUENTIAL_PATTERNS = [
  /して[、。]/,  // ...して、 (after doing...)
  /してから/,   // してから (after doing...)
  /した後/,     // した後 (after doing...)
  /その後/,     // その後 (after that)
  /そして/,     // そして (and then)
];

// Patterns that indicate conditional branches
const CONDITIONAL_PATTERNS = {
  if: [
    /なら[、。]/,    // なら (if)
    /場合[、。]/,    // 場合 (in the case that)
    /とき[、。]/,    // とき (when)
    /ていたら/,      // ていたら (if was doing)
  ],
  when: [
    /につき/,        // につき (for each)
    /ごとに/,        // ごとに (for every)
  ],
  else: [
    /でなければ/,    // でなければ (if not)
    /それ以外/,      // それ以外 (otherwise)
  ],
};

// Patterns for annotations (rules/clarifications)
const ANNOTATION_PATTERN = /［([^］]+)］/g;

// Main delimiters
const SENTENCE_DELIMITERS = ['。', '!', '?'];

/**
 * Segment effect text into individual effect clauses
 */
export function segmentEffectText(text: string): SegmentationResult {
  if (!text?.trim()) {
    return { segments: [], originalText: text };
  }

  const segments: EffectSegment[] = [];
  let workingText = text.trim();

  // First, extract annotations ［...］
  const annotations: Array<{ text: string; position: number }> = [];
  let annotationMatch: RegExpExecArray | null;
  const annotationRegex = /［([^］]+)］/g;

  while ((annotationMatch = annotationRegex.exec(text)) !== null) {
    annotations.push({
      text: annotationMatch[1],
      position: annotationMatch.index,
    });
  }

  // Remove annotations from working text temporarily
  workingText = workingText.replace(ANNOTATION_PATTERN, '');

  // Split by main sentence delimiters
  const rawSegments = splitBySentences(workingText);

  // Process each segment
  for (let i = 0; i < rawSegments.length; i++) {
    const rawText = rawSegments[i].trim();
    if (!rawText) continue;

    // Check for sequential patterns within the segment
    const subSegments = splitBySequential(rawText);

    for (let j = 0; j < subSegments.length; j++) {
      const subText = subSegments[j].trim();
      if (!subText) continue;

      // Determine relationship type
      let relationship: EffectSegment['relationship'] = 'independent';
      let isConditional = false;
      let conditionType: EffectSegment['conditionType'];

      // Check if this is a conditional
      for (const [type, patterns] of Object.entries(CONDITIONAL_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(subText)) {
            isConditional = true;
            conditionType = type as EffectSegment['conditionType'];
            relationship = 'conditional';
            break;
          }
        }
        if (isConditional) break;
      }

      // If part of a sequential chain
      if (j > 0) {
        relationship = 'sequential';
      }

      segments.push({
        text: subText,
        isConditional,
        conditionType,
        isAnnotation: false,
        relationship,
        parentIndex: j > 0 ? segments.length - 1 : undefined,
      });
    }
  }

  // Add annotations as modifier segments
  for (const annotation of annotations) {
    // Find the segment this annotation modifies (usually the previous one)
    const parentIndex = Math.max(0, segments.length - 1);

    segments.push({
      text: annotation.text,
      isConditional: false,
      isAnnotation: true,
      relationship: 'modifier',
      parentIndex: segments.length > 0 ? parentIndex : undefined,
    });
  }

  return { segments, originalText: text };
}

/**
 * Split text by sentence-ending punctuation
 */
function splitBySentences(text: string): string[] {
  const segments: string[] = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    current += char;

    if (SENTENCE_DELIMITERS.includes(char)) {
      segments.push(current.trim());
      current = '';
    }
  }

  // Don't forget the last segment without punctuation
  if (current.trim()) {
    segments.push(current.trim());
  }

  return segments;
}

/**
 * Split by sequential action patterns
 */
function splitBySequential(text: string): string[] {
  // Check for "して、" pattern - most common sequential connector
  const shitePattern = /(.+?して)[、。](.+)/;
  const match = text.match(shitePattern);

  if (match) {
    const [, first, rest] = match;
    return [first, ...splitBySequential(rest)];
  }

  // Check for "その後" pattern
  if (text.includes('その後')) {
    const parts = text.split(/その後[、。]?/);
    return parts.filter(p => p.trim());
  }

  // Check for "してから" pattern
  if (text.includes('してから')) {
    const parts = text.split(/してから[、。]?/);
    return parts.filter(p => p.trim());
  }

  return [text];
}

/**
 * Check if text contains multiple effects that should be parsed separately
 */
export function hasMultipleEffects(text: string): boolean {
  // Contains sentence delimiter
  if (SENTENCE_DELIMITERS.some(d => text.includes(d))) {
    return true;
  }

  // Contains sequential pattern
  if (SEQUENTIAL_PATTERNS.some(p => p.test(text))) {
    return true;
  }

  return false;
}

/**
 * Extract the main effect text, stripping annotations
 */
export function stripAnnotations(text: string): string {
  return text.replace(ANNOTATION_PATTERN, '').trim();
}

/**
 * Extract annotations from text
 */
export function extractAnnotations(text: string): string[] {
  const annotations: string[] = [];
  let match: RegExpExecArray | null;
  const regex = /［([^］]+)］/g;

  while ((match = regex.exec(text)) !== null) {
    annotations.push(match[1]);
  }

  return annotations;
}

/**
 * Combine segments back into structured effect groups
 */
export function groupSegments(result: SegmentationResult): EffectGroup[] {
  const groups: EffectGroup[] = [];
  const segments = result.segments;

  let currentGroup: EffectGroup | null = null;

  for (const segment of segments) {
    if (segment.isAnnotation) {
      // Annotations modify the current group
      if (currentGroup) {
        currentGroup.annotations.push(segment.text);
      }
    } else if (segment.relationship === 'independent' || !currentGroup) {
      // Start a new group
      currentGroup = {
        mainEffect: segment.text,
        sequentialEffects: [],
        annotations: [],
        isConditional: segment.isConditional,
        conditionType: segment.conditionType,
      };
      groups.push(currentGroup);
    } else if (segment.relationship === 'sequential') {
      // Add to current group's sequential effects
      currentGroup.sequentialEffects.push(segment.text);
    } else if (segment.relationship === 'conditional') {
      // Start a new conditional group
      currentGroup = {
        mainEffect: segment.text,
        sequentialEffects: [],
        annotations: [],
        isConditional: true,
        conditionType: segment.conditionType,
      };
      groups.push(currentGroup);
    }
  }

  return groups;
}

export interface EffectGroup {
  mainEffect: string;
  sequentialEffects: string[];
  annotations: string[];
  isConditional: boolean;
  conditionType?: 'if' | 'when' | 'then' | 'else';
}
