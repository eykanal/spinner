// js/csv-helper.js

/**
 * Parses a CSV string into a grid (array of arrays).
 * Handles basic quoted fields and escaped quotes.
 */
export function parseCSV(csvText) {
    if (!csvText || csvText.trim() === "") return [];

    const rows = csvText.split('\n').map(row => row.trim()).filter(row => row !== '');
    if (rows.length === 0) return [];

    return rows.map(row => parseCSVRow(row));
}

/**
 * Pivots a row-based grid into a column-based list structure.
 * Returns { headers, lists }
 */
export function processCSVToData(rawGrid, hasHeaders) {
    if (rawGrid.length === 0) return { headers: [], lists: [] };

    // Determine columns count
    let maxCols = 0;
    for (let row of rawGrid) {
        if (row.length > maxCols) maxCols = row.length;
    }

    let parsedHeaders = [];
    let startRow = 0;

    if (hasHeaders && rawGrid.length > 0) {
        parsedHeaders = [...rawGrid[0]];
        // Fill empty headers if some columns were missing in header row
        while (parsedHeaders.length < maxCols) parsedHeaders.push(`List ${parsedHeaders.length + 1}`);
        startRow = 1;
    } else {
        for (let i = 0; i < maxCols; i++) {
            parsedHeaders.push(`List ${i + 1}`);
        }
    }

    // Pivot table from rows format to column (lists) format
    let lists = [];
    for (let c = 0; c < maxCols; c++) {
        lists.push([]);
    }

    for (let r = startRow; r < rawGrid.length; r++) {
        const rowData = rawGrid[r];
        for (let c = 0; c < maxCols; c++) {
            const cell = rowData[c];
            if (cell !== undefined && cell !== null && cell.trim() !== '') {
                lists[c].push(cell);
            }
        }
    }

    return { headers: parsedHeaders, lists };
}

// A simple CSV row parser that handles basic quotes formatting
function parseCSVRow(text) {
    let result = [];
    let curVal = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        let char = text[i];

        if (char === '"') {
            if (inQuotes && text[i + 1] === '"') {
                // Escaped quote
                curVal += '"';
                i++;
            } else {
                // Toggle quotes
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(curVal);
            curVal = '';
        } else {
            curVal += char;
        }
    }
    result.push(curVal);

    return result;
}
