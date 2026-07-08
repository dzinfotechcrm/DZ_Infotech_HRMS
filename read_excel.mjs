import * as XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'DZInfotech_Finance_Tracker_SAMPLE_for_training.xlsx';
const workbook = XLSX.readFile(filePath);

console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    // Print first 5 rows for brevity, and total rows
    console.log(`Total Rows: ${data.length}`);
    console.log(JSON.stringify(data.slice(0, 10), null, 2));
});
