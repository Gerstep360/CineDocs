/**
 * Gerstep Script Studio - Screenplay Intelligence & Pagination Engine
 */
import { BlockType, ScriptBlock } from '../types/script';

export interface PageSection {
  pageNumber: number;
  blocks: ScriptBlock[];
}

// Scene heading prefixes in Spanish and English
const SCENE_PREFIXES = [
  'INT.',
  'EXT.',
  'INT/EXT.',
  'EXT/INT.',
  'I/E.',
  'EST.',
  'INTERIOR',
  'EXTERIOR',
];

const TRANSITION_PATTERNS = [
  'CORTE A:',
  'DISUELVE A:',
  'FUNDIDO A NEGRO:',
  'FUNDIDO DE ENTRADA:',
  'FUNDIDO A BLANCO:',
  'CORTE DIRECTO A:',
  'FADE OUT.',
  'FADE IN:',
  'CUT TO:',
  'SMASH CUT TO:',
];

export const ScreenplayEngine = {
  /**
   * Intelligently classifies raw text into a screenplay block type
   */
  classifyBlock(text: string, previousBlockType?: BlockType): BlockType {
    const trimmed = text.trim();
    if (!trimmed) return 'action';

    const upper = trimmed.toUpperCase();

    // 1. Scene Heading detection
    for (const prefix of SCENE_PREFIXES) {
      if (upper.startsWith(prefix)) {
        return 'scene_heading';
      }
    }

    // 2. Parenthetical detection: (temblando)
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      return 'parenthetical';
    }

    // 3. Transition detection
    for (const trans of TRANSITION_PATTERNS) {
      if (upper.endsWith(trans) || upper === trans) {
        return 'transition';
      }
    }

    // 4. Character detection
    // Uppercase, short, not ending in period/colon, follows action or scene heading
    if (
      upper === trimmed &&
      trimmed.length >= 2 &&
      trimmed.length <= 35 &&
      !trimmed.endsWith('.') &&
      !trimmed.includes('...') &&
      (previousBlockType === 'action' ||
        previousBlockType === 'scene_heading' ||
        previousBlockType === 'transition' ||
        !previousBlockType)
    ) {
      return 'character';
    }

    // 5. Dialogue detection
    // If it immediately follows a character or a parenthetical
    if (previousBlockType === 'character' || previousBlockType === 'parenthetical') {
      return 'dialogue';
    }

    return 'action';
  },

  /**
   * Predicts the next block type when the user presses Enter
   */
  getNextBlockTypeOnEnter(currentType: BlockType): BlockType {
    switch (currentType) {
      case 'scene_heading':
        return 'action';
      case 'character':
        return 'dialogue';
      case 'parenthetical':
        return 'dialogue';
      case 'dialogue':
        return 'action';
      case 'transition':
        return 'scene_heading';
      case 'shot':
        return 'action';
      default:
        return 'action';
    }
  },

  /**
   * Cycles to the next element type when pressing Tab
   */
  cycleBlockTypeOnTab(currentType: BlockType, reverse = false): BlockType {
    const order: BlockType[] = [
      'action',
      'character',
      'parenthetical',
      'dialogue',
      'transition',
      'scene_heading',
    ];

    const idx = order.indexOf(currentType);
    if (idx === -1) return 'action';

    if (reverse) {
      return order[(idx - 1 + order.length) % order.length];
    }
    return order[(idx + 1) % order.length];
  },

  /**
   * Calculates the approximate line height units for pagination (US Letter ~54 lines)
   */
  getBlockLineCount(block: ScriptBlock): number {
    const textLen = block.text.length;
    switch (block.type) {
      case 'scene_heading':
        return 3; // 2 lines space before + 1 heading line
      case 'character':
        return 2; // 1 line space before + 1 name line
      case 'parenthetical':
        return 1;
      case 'dialogue':
        return Math.max(1, Math.ceil(textLen / 36));
      case 'transition':
        return 2; // 1 space before + 1 transition line
      case 'shot':
        return 2;
      case 'action':
      default:
        return Math.max(1, Math.ceil(textLen / 60)) + 1; // text lines + spacing
    }
  },

  /**
   * Paginates blocks into authentic US Letter pages (~54 lines per page)
   * Prevents orphaned character names at page ends
   */
  paginate(blocks: ScriptBlock[]): PageSection[] {
    const LINES_PER_PAGE = 52;
    const pages: PageSection[] = [];

    let currentPageBlocks: ScriptBlock[] = [];
    let currentLineCount = 0;
    let pageNum = 1;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockLines = this.getBlockLineCount(block);

      // Orphan Prevention: If character block is at the bottom without room for dialogue
      const isCharacterAtBottom =
        block.type === 'character' &&
        currentLineCount + blockLines + 2 > LINES_PER_PAGE;

      if ((currentLineCount + blockLines > LINES_PER_PAGE || isCharacterAtBottom) && currentPageBlocks.length > 0) {
        pages.push({
          pageNumber: pageNum,
          blocks: currentPageBlocks,
        });
        pageNum++;
        currentPageBlocks = [block];
        currentLineCount = blockLines;
      } else {
        currentPageBlocks.push(block);
        currentLineCount += blockLines;
      }
    }

    if (currentPageBlocks.length > 0 || pages.length === 0) {
      pages.push({
        pageNumber: pageNum,
        blocks: currentPageBlocks,
      });
    }

    return pages;
  },

  /**
   * Extract distinct scene list with line indexes
   */
  extractScenes(blocks: ScriptBlock[]) {
    const scenes: { index: number; block: ScriptBlock; sceneNumber: number; title: string }[] = [];
    let counter = 1;

    blocks.forEach((block, index) => {
      if (block.type === 'scene_heading') {
        scenes.push({
          index,
          block,
          sceneNumber: block.sceneNumber || counter,
          title: block.text || 'ESCENA SIN TÍTULO',
        });
        counter++;
      }
    });

    return scenes;
  },

  /**
   * Extract characters appearing in the script blocks
   */
  extractCharactersInScript(blocks: ScriptBlock[]): { name: string; count: number }[] {
    const charMap: Record<string, number> = {};

    blocks.forEach((b) => {
      if (b.type === 'character') {
        const name = b.text.trim().toUpperCase().replace(/\s*\(.*\)$/, '');
        if (name) {
          charMap[name] = (charMap[name] || 0) + 1;
        }
      }
    });

    return Object.entries(charMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },

  /**
   * Extract locations used in scene headings
   */
  extractLocationsInScript(blocks: ScriptBlock[]): string[] {
    const locations = new Set<string>();

    blocks.forEach((b) => {
      if (b.type === 'scene_heading') {
        const cleaned = b.text
          .replace(/^(INT\.|EXT\.|INT\/EXT\.|EXT\/INT\.)\s*/i, '')
          .split('-')[0]
          ?.trim()
          .toUpperCase();
        if (cleaned) {
          locations.add(cleaned);
        }
      }
    });

    return Array.from(locations);
  },
};
