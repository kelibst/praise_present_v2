import { PlanItemWithContent } from '../types/plan';

/**
 * Plan Export Utility
 *
 * Export service plans to various formats:
 * - PDF (print-friendly layout)
 * - Plain text
 * - HTML
 * - JSON (data export)
 * - CSV (spreadsheet)
 */

export interface ExportOptions {
  format: 'pdf' | 'text' | 'html' | 'json' | 'csv';
  includeNotes?: boolean;
  includeOperatorNotes?: boolean;
  includeSpeakerNotes?: boolean;
  includeCues?: boolean;
  includeTimestamps?: boolean;
  includeAssignees?: boolean;
  layout?: 'compact' | 'detailed' | 'printable';
  fontSize?: 'small' | 'medium' | 'large';
}

export interface PlanExportData {
  planId: string;
  planTitle: string;
  serviceDate?: Date;
  totalDuration: number;
  itemCount: number;
  items: PlanItemWithContent[];
  sections?: any[];
  notes?: string;
}

/**
 * Export plan to plain text format
 */
export const exportToText = (data: PlanExportData, options: ExportOptions): string => {
  let text = '';

  // Header
  text += `${'='.repeat(60)}\n`;
  text += `SERVICE PLAN: ${data.planTitle}\n`;
  text += `${'='.repeat(60)}\n\n`;

  if (data.serviceDate) {
    text += `Date: ${new Date(data.serviceDate).toLocaleDateString()}\n`;
  }
  text += `Total Duration: ${data.totalDuration} minutes\n`;
  text += `Items: ${data.itemCount}\n\n`;

  // Items
  data.items.forEach((item, index) => {
    text += `${'-'.repeat(60)}\n`;
    text += `${index + 1}. ${item.title}\n`;
    text += `   Type: ${item.type}\n`;
    text += `   Duration: ${item.duration || 0} min\n`;

    if (options.includeAssignees && item.assignee) {
      text += `   Assigned to: ${item.assignee}\n`;
    }

    if (options.includeNotes && item.notes) {
      text += `\n   Notes:\n   ${item.notes.replace(/\n/g, '\n   ')}\n`;
    }

    if (options.includeOperatorNotes) {
      try {
        const settings = JSON.parse(item.settings || '{}');
        if (settings.operatorNotes) {
          text += `\n   Operator Notes:\n   ${settings.operatorNotes.replace(/\n/g, '\n   ')}\n`;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (options.includeSpeakerNotes) {
      try {
        const settings = JSON.parse(item.settings || '{}');
        if (settings.speakerNotes) {
          text += `\n   Speaker Notes:\n   ${settings.speakerNotes.replace(/\n/g, '\n   ')}\n`;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (options.includeCues) {
      try {
        const settings = JSON.parse(item.settings || '{}');
        if (settings.cues && settings.cues.length > 0) {
          text += `\n   Technical Cues:\n`;
          settings.cues.forEach((cue: any) => {
            text += `   - [${cue.priority.toUpperCase()}] ${cue.title} (${cue.timing})\n`;
          });
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    text += '\n';
  });

  text += `${'='.repeat(60)}\n`;
  text += `End of Plan\n`;

  return text;
};

/**
 * Export plan to HTML format
 */
export const exportToHTML = (data: PlanExportData, options: ExportOptions): string => {
  const fontSize = options.fontSize === 'small' ? '12px' : options.fontSize === 'large' ? '16px' : '14px';

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.planTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: ${fontSize};
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }

    @media print {
      body {
        max-width: 100%;
        padding: 10px;
      }
      .no-print {
        display: none;
      }
      .page-break {
        page-break-before: always;
      }
    }

    .header {
      border-bottom: 3px solid #333;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }

    h1 {
      margin: 0;
      font-size: 2em;
      color: #1a1a1a;
    }

    .meta {
      color: #666;
      margin-top: 10px;
      font-size: 0.9em;
    }

    .item {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      background: #f9f9f9;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 10px;
    }

    .item-title {
      font-size: 1.2em;
      font-weight: 600;
      color: #1a1a1a;
    }

    .item-type {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 500;
      background: #e0e0e0;
      color: #333;
    }

    .item-type.song { background: #bbdefb; color: #0d47a1; }
    .item-type.scripture { background: #c8e6c9; color: #1b5e20; }
    .item-type.presentation { background: #e1bee7; color: #4a148c; }
    .item-type.announcement { background: #ffe0b2; color: #e65100; }

    .item-meta {
      display: flex;
      gap: 15px;
      color: #666;
      font-size: 0.9em;
      margin-top: 8px;
    }

    .item-meta span {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .notes {
      margin-top: 10px;
      padding: 10px;
      background: white;
      border-left: 3px solid #2196f3;
      border-radius: 4px;
    }

    .notes-title {
      font-weight: 600;
      margin-bottom: 5px;
      color: #2196f3;
    }

    .operator-notes {
      border-left-color: #ff9800;
    }

    .operator-notes .notes-title {
      color: #ff9800;
    }

    .speaker-notes {
      border-left-color: #9c27b0;
    }

    .speaker-notes .notes-title {
      color: #9c27b0;
    }

    .cues {
      margin-top: 10px;
    }

    .cue {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      background: white;
      border-radius: 4px;
      margin-top: 4px;
      font-size: 0.9em;
    }

    .cue-priority {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;
    }

    .cue-priority.critical { background: #ffcdd2; color: #c62828; }
    .cue-priority.high { background: #fff9c4; color: #f57f17; }
    .cue-priority.normal { background: #e3f2fd; color: #1565c0; }
    .cue-priority.low { background: #f5f5f5; color: #616161; }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      text-align: center;
      color: #999;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.planTitle}</h1>
    <div class="meta">
      ${data.serviceDate ? `<div>Date: ${new Date(data.serviceDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>` : ''}
      <div>Duration: ${data.totalDuration} minutes | ${data.itemCount} items</div>
    </div>
  </div>

  <div class="items">
`;

  data.items.forEach((item, index) => {
    html += `
    <div class="item">
      <div class="item-header">
        <div>
          <div class="item-title">${index + 1}. ${item.title}</div>
        </div>
        <span class="item-type ${item.type}">${item.type}</span>
      </div>

      <div class="item-meta">
        <span>⏱️ ${item.duration || 0} min</span>
        ${options.includeAssignees && item.assignee ? `<span>👤 ${item.assignee}</span>` : ''}
        ${item.scriptureRef ? `<span>📖 ${item.scriptureRef}</span>` : ''}
      </div>
`;

    if (options.includeNotes && item.notes) {
      html += `
      <div class="notes">
        <div class="notes-title">Notes</div>
        <div>${item.notes.replace(/\n/g, '<br>')}</div>
      </div>
`;
    }

    // Parse settings for operator notes, speaker notes, and cues
    try {
      const settings = JSON.parse(item.settings || '{}');

      if (options.includeOperatorNotes && settings.operatorNotes) {
        html += `
      <div class="notes operator-notes">
        <div class="notes-title">Operator Notes</div>
        <div>${settings.operatorNotes.replace(/\n/g, '<br>')}</div>
      </div>
`;
      }

      if (options.includeSpeakerNotes && settings.speakerNotes) {
        html += `
      <div class="notes speaker-notes">
        <div class="notes-title">Speaker Notes</div>
        <div>${settings.speakerNotes.replace(/\n/g, '<br>')}</div>
      </div>
`;
      }

      if (options.includeCues && settings.cues && settings.cues.length > 0) {
        html += `
      <div class="cues">
        <div class="notes-title">Technical Cues</div>
`;
        settings.cues.forEach((cue: any) => {
          html += `
        <div class="cue">
          <span class="cue-priority ${cue.priority}">${cue.priority}</span>
          <span>${cue.title}</span>
          <span style="color: #999;">(${cue.timing})</span>
        </div>
`;
        });
        html += `
      </div>
`;
      }
    } catch (e) {
      // Ignore parse errors
    }

    html += `
    </div>
`;
  });

  html += `
  </div>

  <div class="footer">
    Generated by PraisePresent on ${new Date().toLocaleString()}
  </div>
</body>
</html>
`;

  return html;
};

/**
 * Export plan to JSON format
 */
export const exportToJSON = (data: PlanExportData, options: ExportOptions): string => {
  const exportData: any = {
    plan: {
      id: data.planId,
      title: data.planTitle,
      serviceDate: data.serviceDate,
      totalDuration: data.totalDuration,
      itemCount: data.itemCount
    },
    items: data.items.map((item) => {
      const exportItem: any = {
        id: item.id,
        type: item.type,
        title: item.title,
        duration: item.duration,
        order: item.order
      };

      if (options.includeAssignees && item.assignee) {
        exportItem.assignee = item.assignee;
      }

      if (options.includeNotes && item.notes) {
        exportItem.notes = item.notes;
      }

      if (item.scriptureRef) {
        exportItem.scriptureRef = item.scriptureRef;
      }

      // Include settings if needed
      if (options.includeOperatorNotes || options.includeSpeakerNotes || options.includeCues) {
        try {
          const settings = JSON.parse(item.settings || '{}');
          exportItem.settings = {};

          if (options.includeOperatorNotes && settings.operatorNotes) {
            exportItem.settings.operatorNotes = settings.operatorNotes;
          }

          if (options.includeSpeakerNotes && settings.speakerNotes) {
            exportItem.settings.speakerNotes = settings.speakerNotes;
          }

          if (options.includeCues && settings.cues) {
            exportItem.settings.cues = settings.cues;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      return exportItem;
    }),
    exportedAt: new Date().toISOString(),
    exportOptions: options
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Export plan to CSV format
 */
export const exportToCSV = (data: PlanExportData, options: ExportOptions): string => {
  let csv = '';

  // Headers
  const headers = ['#', 'Title', 'Type', 'Duration (min)'];
  if (options.includeAssignees) headers.push('Assignee');
  if (options.includeNotes) headers.push('Notes');

  csv += headers.join(',') + '\n';

  // Data rows
  data.items.forEach((item, index) => {
    const row = [
      index + 1,
      `"${item.title.replace(/"/g, '""')}"`,
      item.type,
      item.duration || 0
    ];

    if (options.includeAssignees) {
      row.push(item.assignee ? `"${item.assignee.replace(/"/g, '""')}"` : '');
    }

    if (options.includeNotes) {
      row.push(item.notes ? `"${item.notes.replace(/"/g, '""').replace(/\n/g, ' ')}"` : '');
    }

    csv += row.join(',') + '\n';
  });

  return csv;
};

/**
 * Download file to user's system
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Main export function
 */
export const exportPlan = async (data: PlanExportData, options: ExportOptions): Promise<boolean> => {
  try {
    let content = '';
    let filename = '';
    let mimeType = '';

    const sanitizedTitle = data.planTitle.replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().toISOString().split('T')[0];

    switch (options.format) {
      case 'text':
        content = exportToText(data, options);
        filename = `${sanitizedTitle}_${timestamp}.txt`;
        mimeType = 'text/plain';
        break;

      case 'html':
        content = exportToHTML(data, options);
        filename = `${sanitizedTitle}_${timestamp}.html`;
        mimeType = 'text/html';
        break;

      case 'json':
        content = exportToJSON(data, options);
        filename = `${sanitizedTitle}_${timestamp}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        content = exportToCSV(data, options);
        filename = `${sanitizedTitle}_${timestamp}.csv`;
        mimeType = 'text/csv';
        break;

      case 'pdf':
        // For PDF, we'll convert HTML to PDF
        // This would require additional libraries like html2pdf or jsPDF
        // For now, export as HTML and let user print to PDF
        content = exportToHTML(data, { ...options, layout: 'printable' });
        filename = `${sanitizedTitle}_${timestamp}.html`;
        mimeType = 'text/html';
        console.warn('PDF export: Opening HTML for print-to-PDF. Install html2pdf for direct PDF generation.');
        break;

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    downloadFile(content, filename, mimeType);
    return true;
  } catch (error) {
    console.error('Export error:', error);
    return false;
  }
};

export default {
  exportPlan,
  exportToText,
  exportToHTML,
  exportToJSON,
  exportToCSV,
  downloadFile
};
