const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'NILAI UNTUK MAS KRIDO.xlsx');
const workbook = xlsx.readFile(filePath);

const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('tkp'));
const sheet = workbook.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const headers = json[0] || [];
const firstRow = json[1] || [];

console.log("Mapping Headers to First Row Data:");
for (let i = 0; i < Math.max(headers.length, firstRow.length); i++) {
    console.log(`Col ${i} [${headers[i]}]: ${firstRow[i]}`);
}
