/***********************************************************************
 * predict.js
 *
 * Uses a previously trained model (saved in "my-model" folder) and the
 * normalization stats (from "minmax.json") to predict labels for each
 * row in "data.csv". It then creates a new CSV ("output.csv") with an
 * added "Predicted Label" column.
 ***********************************************************************/

const fs = require('fs');
const tf = require('@tensorflow/tfjs-node');
const dataFile = 'train.csv';

// The label order must match the order used during training
const LABELS = ['bird', 'superhero', 'average joe', 'zombie', 'turtle'];

async function main() {
    // -----------------------------
    // A. Load the saved model
    // -----------------------------
    const model = await tf.loadLayersModel('file://my-model/model.json');
    console.log('Loaded model from file://my-model/model.json');

    // -----------------------------
    // B. Load min/max normalization stats
    // -----------------------------
    const rawMinMax = fs.readFileSync('minmax.json', 'utf8');
    const { min, max } = JSON.parse(rawMinMax);
    const featureMin = tf.tensor(min); // shape: [numFeatures]
    const featureMax = tf.tensor(max); // shape: [numFeatures]

    // -----------------------------
    // C. Read the input CSV file ("data.csv")
    // -----------------------------
    const rawCSV = fs.readFileSync(dataFile, 'utf8');
    // Split on both \n and \r\n, and filter out any empty lines.
    const lines = rawCSV.split(/\r?\n/).filter(line => line.trim() !== '');

    // Extract header, trim each header field, then add "Predicted Label"
    const header = lines.shift().split(';').map(col => col.trim());
    header.push('Predicted Label');

    // Array to hold output lines; join with semicolons
    const outputLines = [];
    outputLines.push(header.join(';'));

    // -----------------------------
    // D. Process each row for prediction
    // -----------------------------
    lines.forEach((line) => {
        if (!line.trim()) return;
        // Split and trim each field
        const cols = line.split(',').map(col => col.trim());
        // Expect at least 9 columns (indices 0 through 8)
        if (cols.length < 9) return;


        // Parse the 7 numeric feature columns (assumed indices: 2 to 8)
        const impressions    = parseFloat(cols[2].replace(',', '.'));
        const clicks         = parseFloat(cols[3].replace(',', '.'));
        const ctr            = parseFloat(cols[4].replace(',', '.'));
        const spend          = parseFloat(cols[5].replace(',', '.'));
        const conversions    = parseFloat(cols[6].replace(',', '.'));
        const conversionValue= parseFloat(cols[7].replace(',', '.'));
        const roas           = parseFloat(cols[8].replace(',', '.'));

        // Skip rows with invalid numeric data
        if ([impressions, clicks, ctr, spend, conversions, conversionValue, roas].some(val => isNaN(val))) {
            return;
        }

        // Create a tensor for this row with shape [1, 7]
        const inputTensor = tf.tensor2d([[impressions, clicks, ctr, spend, conversions, conversionValue, roas]]);

        // -----------------------------
        // E. Normalize this row using the saved min/max stats
        // -----------------------------
        const epsilon = tf.scalar(1e-10);
        const scaledTensor = inputTensor.sub(featureMin).div(featureMax.sub(featureMin).add(epsilon));

        // -----------------------------
        // F. Predict using the loaded model
        // -----------------------------
        const prediction = model.predict(scaledTensor);
        const predArray = prediction.dataSync();
        const predictedLabel = interpretPrediction(predArray);

        // Append the predicted label to the current row
        cols.push(predictedLabel);
        outputLines.push(cols.join(';'));

        // Dispose tensors to free memory
        inputTensor.dispose();
        scaledTensor.dispose();
        prediction.dispose();
    });

    // -----------------------------
    // G. Write the output CSV file ("output.csv")
    // -----------------------------
    // Join lines with \n to ensure consistent newlines
    fs.writeFileSync('output.csv', outputLines.join('\n'), 'utf8');
    console.log('Predictions written to output.csv');
}

// Helper: Given an array of probabilities, returns the label corresponding
// to the highest probability.
function interpretPrediction(probArray) {
    let maxIndex = 0;
    for (let i = 1; i < probArray.length; i++) {
        if (probArray[i] > probArray[maxIndex]) {
            maxIndex = i;
        }
    }
    return LABELS[maxIndex];
}

main().catch(err => console.error(err));