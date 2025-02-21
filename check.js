/***********************************************************************
 * check.js
 *
 * Loads "output.csv" and checks each row to see if the value in the
 * "Custom Label 4" column matches the value in the "Predicted Label" column.
 * It then outputs a summary of total rows, matches, and mismatches.
 ***********************************************************************/

const fs = require('fs');

function main() {
    // Read output.csv
    const rawCSV = fs.readFileSync('output.csv', 'utf8');
    // Split by newlines (handling both \n and \r\n) and filter empty lines
    const lines = rawCSV.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length === 0) {
        console.error("The CSV file is empty or not formatted correctly.");
        return;
    }

    // Parse the header row to get column indices
    const header = lines.shift().split(';').map(col => col.trim());
    const customLabelIndex = header.indexOf("Custom Label 4");
    const predictedLabelIndex = header.indexOf("Predicted Label");

    if (customLabelIndex === -1 || predictedLabelIndex === -1) {
        console.error("Could not find one or both required columns: 'Custom Label 4' or 'Predicted Label'.");
        return;
    }

    let totalRows = 0;
    let matchCount = 0;
    let mismatchCount = 0;

    // Process each row
    lines.forEach(line => {
        const cols = line.split(';').map(col => col.trim());
        // Ensure the row has enough columns
        if (cols.length <= Math.max(customLabelIndex, predictedLabelIndex)) return;
        totalRows++;

        const customLabel = cols[customLabelIndex];
        const predictedLabel = cols[predictedLabelIndex];

        if (customLabel === predictedLabel) {
            matchCount++;
        } else {
            mismatchCount++;
        }
    });

    console.log(`Total rows: ${totalRows}`);
    console.log(`Matches: ${matchCount}`);
    console.log(`Mismatches: ${mismatchCount}`);
    const percentageGood = totalRows > 0 ? (matchCount / totalRows * 100).toFixed(2) : 0;
    console.log(`% good: ${percentageGood}%`);
}

main();