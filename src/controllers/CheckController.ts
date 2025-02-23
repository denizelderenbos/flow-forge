import * as fs from 'fs';
import {CliContext} from "../types/CliContext";

export default class CheckController {
    public async check({args}: CliContext): Promise<void> {
        const [filePath] = args;

        // Read the CSV file content
        const content = fs.readFileSync(filePath, 'utf8');
        // Split the content into lines and filter out empty lines
        const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length < 2) {
            console.log("CSV file has no data rows.");
            return;
        }

        // Parse header row (assumes delimiter is ';')
        const header = lines[0].split(';').map(h => h.trim());
        const labelIndex = header.findIndex(h => h.toLowerCase() === 'label');
        const predictedLabelIndex = header.findIndex(h => h.toLowerCase() === 'predictedlabel');

        if (labelIndex === -1 || predictedLabelIndex === -1) {
            console.log("CSV does not contain required 'label' or 'predictedLabel' columns.");
            return;
        }

        let totalRows = 0;
        let correctRows = 0;

        // Process each data row
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(';').map(col => col.trim());
            // Make sure the row has enough columns
            if (row.length <= Math.max(labelIndex, predictedLabelIndex)) {
                continue;
            }
            totalRows++;
            if (row[labelIndex] === row[predictedLabelIndex]) {
                correctRows++;
            }
        }

        const percentage = totalRows > 0 ? (correctRows / totalRows) * 100 : 0;
        console.log(`Total rows: ${totalRows}`);
        console.log(`Correct predictions: ${correctRows}`);
        console.log(`Percentage correct: ${percentage.toFixed(2)}%`);
    }
}