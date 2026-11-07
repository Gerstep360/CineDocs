/**
 * Gerstep Script Studio - Professional Exporters & Importers (PDF, Fountain, TXT, JSON)
 */
import { jsPDF } from 'jspdf';
import { BlockType, ScriptBlock } from '../types/script';
import { ScreenplayEngine } from './screenplay-engine';

export interface PDFExportOptions {
  title: string;
  author?: string;
  includeTitlePage?: boolean;
  watermark?: string;
}

export const Exporters = {
  /**
   * Generates a genuine paginated US Letter PDF according to Hollywood/Film standard margins
   */
  async exportToPDF(blocks: ScriptBlock[], options: PDFExportOptions): Promise<void> {
    // US Letter size in points: 612 x 792 pt (8.5 x 11 in)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    const PAGE_WIDTH = 612;
    const PAGE_HEIGHT = 792;
    const LEFT_MARGIN = 108; // 1.5 inches for binding
    const RIGHT_MARGIN = 540; // 612 - 72 (1 inch right margin)
    const TOP_MARGIN = 72; // 1.0 inch
    const BOTTOM_MARGIN = 720; // 792 - 72 (1.0 inch)
    const LINE_HEIGHT = 14;

    doc.setFont('courier', 'normal');
    doc.setFontSize(12);

    let pageNumber = 1;

    // Optional Title Page
    if (options.includeTitlePage) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(22);
      doc.text(options.title.toUpperCase(), PAGE_WIDTH / 2, 280, { align: 'center' });

      doc.setFont('courier', 'normal');
      doc.setFontSize(12);
      doc.text('escrito por', PAGE_WIDTH / 2, 330, { align: 'center' });

      doc.setFont('courier', 'bold');
      doc.setFontSize(14);
      doc.text(options.author || 'Anónimo', PAGE_WIDTH / 2, 360, { align: 'center' });

      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.text('GERSTEP SCRIPT STUDIO', PAGE_WIDTH / 2, 700, { align: 'center' });
      doc.text('Borrador de Trabajo — Formato Estándar', PAGE_WIDTH / 2, 715, { align: 'center' });

      doc.addPage();
    }

    let y = TOP_MARGIN;

    // Helper to add page number header
    const printPageHeader = (pNum: number) => {
      // By industry standard, Page 1 doesn't display a header number
      if (pNum > 1) {
        doc.setFont('courier', 'normal');
        doc.setFontSize(10);
        doc.text(`${pNum}.`, RIGHT_MARGIN, 36, { align: 'right' });
        doc.setFontSize(12);
      }
    };

    printPageHeader(pageNumber);

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const text = block.text || '';
      if (!text.trim()) continue;

      let estimatedHeight = LINE_HEIGHT;
      let lines: string[] = [];

      switch (block.type) {
        case 'scene_heading': {
          lines = doc.splitTextToSize(text.toUpperCase(), RIGHT_MARGIN - LEFT_MARGIN);
          estimatedHeight = lines.length * LINE_HEIGHT + LINE_HEIGHT * 2; // space before
          if (y + estimatedHeight > BOTTOM_MARGIN) {
            doc.addPage();
            pageNumber++;
            printPageHeader(pageNumber);
            y = TOP_MARGIN;
          } else {
            y += LINE_HEIGHT * 1.5;
          }

          doc.setFont('courier', 'bold');
          lines.forEach((line) => {
            doc.text(line, LEFT_MARGIN, y);
            y += LINE_HEIGHT;
          });
          doc.setFont('courier', 'normal');
          break;
        }

        case 'action': {
          lines = doc.splitTextToSize(text, RIGHT_MARGIN - LEFT_MARGIN);
          estimatedHeight = lines.length * LINE_HEIGHT + LINE_HEIGHT;
          if (y + estimatedHeight > BOTTOM_MARGIN) {
            doc.addPage();
            pageNumber++;
            printPageHeader(pageNumber);
            y = TOP_MARGIN;
          } else {
            y += LINE_HEIGHT;
          }

          lines.forEach((line) => {
            doc.text(line, LEFT_MARGIN, y);
            y += LINE_HEIGHT;
          });
          break;
        }

        case 'character': {
          // Prevent orphan character (check if at least 2 dialogue lines fit)
          const nextBlock = blocks[i + 1];
          const hasDialogueNext = nextBlock && nextBlock.type === 'dialogue';
          const neededSpace = hasDialogueNext ? LINE_HEIGHT * 4 : LINE_HEIGHT * 2;

          if (y + neededSpace > BOTTOM_MARGIN) {
            doc.addPage();
            pageNumber++;
            printPageHeader(pageNumber);
            y = TOP_MARGIN;
          } else {
            y += LINE_HEIGHT * 1.2;
          }

          doc.setFont('courier', 'bold');
          // Centered at ~3.7 inches from left
          doc.text(text.toUpperCase(), 270, y);
          doc.setFont('courier', 'normal');
          y += LINE_HEIGHT;
          break;
        }

        case 'parenthetical': {
          const parentheticalText = text.startsWith('(') && text.endsWith(')') ? text : `(${text})`;
          lines = doc.splitTextToSize(parentheticalText, 200);
          if (y + lines.length * LINE_HEIGHT > BOTTOM_MARGIN) {
            doc.addPage();
            pageNumber++;
            printPageHeader(pageNumber);
            y = TOP_MARGIN;
          }

          lines.forEach((line) => {
            doc.text(line, 220, y);
            y += LINE_HEIGHT;
          });
          break;
        }

        case 'dialogue': {
          // Dialogue width ~3.5 inches (250pt), indented at 180pt
          lines = doc.splitTextToSize(text, 250);
          if (y + lines.length * LINE_HEIGHT > BOTTOM_MARGIN) {
            doc.addPage();
            pageNumber++;
            printPageHeader(pageNumber);
            y = TOP_MARGIN;
          }

          lines.forEach((line) => {
            doc.text(line, 180, y);
            y += LINE_HEIGHT;
          });
          break;
        }

        case 'transition': {
          if (y + LINE_HEIGHT * 2 > BOTTOM_MARGIN) {
            doc.addPage();
            pageNumber++;
            printPageHeader(pageNumber);
            y = TOP_MARGIN;
          } else {
            y += LINE_HEIGHT;
          }

          doc.setFont('courier', 'bold');
          doc.text(text.toUpperCase(), RIGHT_MARGIN, y, { align: 'right' });
          doc.setFont('courier', 'normal');
          y += LINE_HEIGHT;
          break;
        }

        default: {
          lines = doc.splitTextToSize(text, RIGHT_MARGIN - LEFT_MARGIN);
          lines.forEach((line) => {
            doc.text(line, LEFT_MARGIN, y);
            y += LINE_HEIGHT;
          });
          break;
        }
      }
    }

    const safeTitle = options.title.replace(/[^a-zA-Z0-9_\-]/g, '_');
    doc.save(`${safeTitle}.pdf`);
  },

  /**
   * Generates a clean .fountain standard string
   */
  exportToFountain(blocks: ScriptBlock[], title?: string, author?: string): string {
    const lines: string[] = [];

    if (title) {
      lines.push(`Title: ${title}`);
      if (author) lines.push(`Author: ${author}`);
      lines.push(`Draft date: ${new Date().toLocaleDateString('es-ES')}`);
      lines.push('');
      lines.push('===');
      lines.push('');
    }

    blocks.forEach((block) => {
      const text = block.text.trim();
      if (!text) return;

      switch (block.type) {
        case 'scene_heading':
          lines.push(`\n${text.toUpperCase()}\n`);
          break;
        case 'action':
          lines.push(`\n${text}\n`);
          break;
        case 'character':
          lines.push(`\n${text.toUpperCase()}`);
          break;
        case 'parenthetical':
          lines.push(text.startsWith('(') ? text : `(${text})`);
          break;
        case 'dialogue':
          lines.push(text);
          break;
        case 'transition':
          lines.push(`\n> ${text.toUpperCase()}\n`);
          break;
        default:
          lines.push(`\n${text}\n`);
          break;
      }
    });

    return lines.join('\n');
  },

  /**
   * Parses a Fountain formatted text file into ScriptBlock objects
   */
  importFromFountain(fountainText: string): ScriptBlock[] {
    const rawLines = fountainText.split('\n');
    const blocks: ScriptBlock[] = [];
    let previousType: BlockType | undefined = undefined;

    let inHeader = true;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();

      // Skip Fountain title page keys if at start
      if (inHeader) {
        if (line === '===' || line.startsWith('===') || line === '') {
          if (line.startsWith('===')) inHeader = false;
          continue;
        }
        if (line.includes(':') && (line.toLowerCase().startsWith('title:') || line.toLowerCase().startsWith('author:') || line.toLowerCase().startsWith('credit:'))) {
          continue;
        }
        inHeader = false;
      }

      if (!line) {
        // blank line
        continue;
      }

      let type: BlockType = 'action';

      if (line.startsWith('>')) {
        type = 'transition';
      } else {
        type = ScreenplayEngine.classifyBlock(line, previousType);
      }

      const cleanText = line.startsWith('>') ? line.replace(/^>\s*/, '') : line;

      blocks.push({
        id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type,
        text: cleanText,
      });

      previousType = type;
    }

    return blocks.length > 0
      ? blocks
      : [
          {
            id: `blk-${Date.now()}`,
            type: 'scene_heading',
            text: 'INT. NUEVA ESCENA - DÍA',
          },
          {
            id: `blk-${Date.now()}-2`,
            type: 'action',
            text: 'Comienza a escribir aquí.',
          },
        ];
  },

  /**
   * Generates a cleanly formatted text file with standard tab spacing
   */
  exportToPlainText(blocks: ScriptBlock[], title?: string): string {
    const lines: string[] = [];
    if (title) {
      lines.push('==================================================');
      lines.push(`  ${title.toUpperCase()}`);
      lines.push('==================================================\n');
    }

    blocks.forEach((b) => {
      const text = b.text.trim();
      if (!text) return;

      switch (b.type) {
        case 'scene_heading':
          lines.push(`\n${text.toUpperCase()}\n`);
          break;
        case 'action':
          lines.push(`\n${text}\n`);
          break;
        case 'character':
          lines.push(`\n                      ${text.toUpperCase()}`);
          break;
        case 'parenthetical':
          lines.push(`                 ${text.startsWith('(') ? text : `(${text})`}`);
          break;
        case 'dialogue':
          lines.push(`            ${text}`);
          break;
        case 'transition':
          lines.push(`\n                                              ${text.toUpperCase()}\n`);
          break;
        default:
          lines.push(`\n${text}\n`);
          break;
      }
    });

    return lines.join('\n');
  },

  /**
   * Helper to trigger file downloads in browser
   */
  downloadBlob(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
