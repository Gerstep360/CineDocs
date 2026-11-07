/**
 * Gerstep Script Studio - Exporters & Importers supporting all 11 Script Structures
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
  async exportToPDF(blocks: ScriptBlock[], options: PDFExportOptions): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    const PAGE_WIDTH = 612;
    const LEFT_MARGIN = 108;
    const RIGHT_MARGIN = 540;
    const TOP_MARGIN = 72;
    const BOTTOM_MARGIN = 720;
    const LINE_HEIGHT = 14;

    doc.setFont('courier', 'normal');
    doc.setFontSize(12);

    let pageNumber = 1;

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
      doc.text('GERSTEP SCRIPT STUDIO / CINEDOCS', PAGE_WIDTH / 2, 700, { align: 'center' });

      doc.addPage();
    }

    let y = TOP_MARGIN;

    const printPageHeader = (pNum: number) => {
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

      if (block.type === 'av_row') {
        const vis = (block.visualText || block.text || '').trim();
        const aud = (block.audioText || '').trim();
        if (!vis && !aud) continue;

        const colWidth = (RIGHT_MARGIN - LEFT_MARGIN - 20) / 2;
        const visLines = doc.splitTextToSize(vis || '—', colWidth);
        const audLines = doc.splitTextToSize(aud || '—', colWidth);
        const rowLinesCount = Math.max(visLines.length, audLines.length);
        const estimatedHeight = rowLinesCount * LINE_HEIGHT + LINE_HEIGHT;

        if (y + estimatedHeight > BOTTOM_MARGIN) {
          doc.addPage();
          pageNumber++;
          printPageHeader(pageNumber);
          y = TOP_MARGIN;
        } else {
          y += LINE_HEIGHT * 0.8;
        }

        for (let r = 0; r < rowLinesCount; r++) {
          if (visLines[r]) doc.text(visLines[r], LEFT_MARGIN, y);
          if (audLines[r]) doc.text(audLines[r], LEFT_MARGIN + colWidth + 20, y);
          y += LINE_HEIGHT;
        }
        continue;
      }

      const text = block.text || '';
      if (!text.trim()) continue;

      const blockDef = ScreenplayEngine.getBlockDefinition(block.type);
      let lines: string[] = [];

      if (
        block.type === 'scene_heading' ||
        block.type === 'heading_1' ||
        block.type === 'segment_header' ||
        block.type === 'music_section' ||
        block.type === 'section_divider'
      ) {
        const prefix =
          block.type === 'section_divider'
            ? `=== SECCIÓN: ${text.toUpperCase()} ===`
            : blockDef.isUppercase
            ? text.toUpperCase()
            : text;
        lines = doc.splitTextToSize(prefix, RIGHT_MARGIN - LEFT_MARGIN);
        const estimatedHeight = lines.length * LINE_HEIGHT + LINE_HEIGHT * 2;
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
      } else if (
        block.type === 'character' ||
        block.type === 'interview_subject' ||
        block.type === 'voice_cue'
      ) {
        const neededSpace = LINE_HEIGHT * 4;
        if (y + neededSpace > BOTTOM_MARGIN) {
          doc.addPage();
          pageNumber++;
          printPageHeader(pageNumber);
          y = TOP_MARGIN;
        } else {
          y += LINE_HEIGHT * 1.2;
        }

        doc.setFont('courier', 'bold');
        doc.text(text.toUpperCase(), 270, y);
        doc.setFont('courier', 'normal');
        y += LINE_HEIGHT;
      } else if (
        block.type === 'parenthetical' ||
        block.type === 'pause_mark' ||
        block.type === 'silence_mark'
      ) {
        const formatted =
          block.type === 'parenthetical' && !text.startsWith('(')
            ? `(${text})`
            : text;
        lines = doc.splitTextToSize(formatted, 200);
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
      } else if (
        block.type === 'dialogue' ||
        block.type === 'voice_over' ||
        block.type === 'off_screen' ||
        block.type === 'testimony'
      ) {
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
      } else if (block.type === 'transition') {
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
      } else {
        lines = doc.splitTextToSize(text, RIGHT_MARGIN - LEFT_MARGIN);
        const estimatedHeight = lines.length * LINE_HEIGHT + LINE_HEIGHT;
        if (y + estimatedHeight > BOTTOM_MARGIN) {
          doc.addPage();
          pageNumber++;
          printPageHeader(pageNumber);
          y = TOP_MARGIN;
        } else {
          y += LINE_HEIGHT * 0.8;
        }

        lines.forEach((line) => {
          doc.text(line, LEFT_MARGIN, y);
          y += LINE_HEIGHT;
        });
      }
    }

    const safeTitle = options.title.replace(/[^a-zA-Z0-9_\-]/g, '_');
    doc.save(`${safeTitle}.pdf`);
  },

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
      if (block.type === 'av_row') {
        const vis = (block.visualText || block.text || '').trim();
        const aud = (block.audioText || '').trim();
        if (vis || aud) {
          lines.push(`\n[VIDEO]: ${vis}`);
          lines.push(`[AUDIO]: ${aud}\n`);
        }
        return;
      }

      const text = (block.text || '').trim();
      if (!text) return;

      switch (block.type) {
        case 'section_divider':
          lines.push(`\n# ${text} [${block.sectionStructure || 'hibrida'}]\n`);
          break;
        case 'scene_heading':
        case 'segment_header':
        case 'music_section':
          lines.push(`\n${text.toUpperCase()}\n`);
          break;
        case 'heading_1':
          lines.push(`\n# ${text}\n`);
          break;
        case 'heading_2':
          lines.push(`\n## ${text}\n`);
          break;
        case 'character':
        case 'interview_subject':
        case 'voice_cue':
          lines.push(`\n${text.toUpperCase()}`);
          break;
        case 'parenthetical':
          lines.push(text.startsWith('(') ? text : `(${text})`);
          break;
        case 'dialogue':
        case 'voice_over':
        case 'off_screen':
        case 'testimony':
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

  importFromFountain(fountainText: string): ScriptBlock[] {
    const rawLines = fountainText.split('\n');
    const blocks: ScriptBlock[] = [];
    let previousType: BlockType | undefined = undefined;
    let inHeader = true;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();

      if (inHeader) {
        if (line === '===' || line.startsWith('===') || line === '') {
          if (line.startsWith('===')) inHeader = false;
          continue;
        }
        if (
          line.includes(':') &&
          (line.toLowerCase().startsWith('title:') ||
            line.toLowerCase().startsWith('author:') ||
            line.toLowerCase().startsWith('draft date:') ||
            line.toLowerCase().startsWith('credit:'))
        ) {
          continue;
        }
        inHeader = false;
      }

      if (!line) continue;

      let type: BlockType = 'action';
      if (line.startsWith('## ')) {
        type = 'heading_2';
      } else if (line.startsWith('# ')) {
        type = 'heading_1';
      } else if (line.startsWith('>')) {
        type = 'transition';
      } else {
        type = ScreenplayEngine.classifyBlock(line, previousType);
      }

      const cleanText = line
        .replace(/^##\s+/, '')
        .replace(/^#\s+/, '')
        .replace(/^>\s*/, '');

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
            type: 'paragraph',
            text: '',
          },
        ];
  },

  exportToPlainText(blocks: ScriptBlock[], title?: string): string {
    const lines: string[] = [];
    if (title) {
      lines.push('==================================================');
      lines.push(`  ${title.toUpperCase()}`);
      lines.push('==================================================\n');
    }

    blocks.forEach((b) => {
      if (b.type === 'av_row') {
        lines.push(`\n[VIDEO]: ${b.visualText || b.text || ''}`);
        lines.push(`[AUDIO]: ${b.audioText || ''}\n`);
        return;
      }

      const text = (b.text || '').trim();
      if (!text) return;

      switch (b.type) {
        case 'scene_heading':
        case 'heading_1':
        case 'segment_header':
        case 'music_section':
        case 'section_divider':
          lines.push(`\n${text.toUpperCase()}\n`);
          break;
        case 'character':
        case 'interview_subject':
        case 'voice_cue':
          lines.push(`\n                      ${text.toUpperCase()}`);
          break;
        case 'parenthetical':
          lines.push(
            `                 ${text.startsWith('(') ? text : `(${text})`}`
          );
          break;
        case 'dialogue':
        case 'voice_over':
        case 'off_screen':
        case 'testimony':
          lines.push(`            ${text}`);
          break;
        case 'transition':
          lines.push(
            `\n                                              ${text.toUpperCase()}\n`
          );
          break;
        default:
          lines.push(`\n${text}\n`);
          break;
      }
    });

    return lines.join('\n');
  },

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
