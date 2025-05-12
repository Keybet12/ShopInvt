// src/lib/csvUtils.ts

/**
 * Download an array of objects as a CSV file.
 */
export function downloadCSV<T extends Record<string, any>>(data: T[], filename = 'export.csv') {
    if (!data.length) return;
  
    const headers = Object.keys(data[0]);
    const rows = data.map(obj =>
      headers.map(field => JSON.stringify(obj[field] ?? '')).join(',')
    );
    
    const csv = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  