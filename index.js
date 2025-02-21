/***********************************************************************
 * index.js
 *
 * Debugging version that checks for potential NaNs or extreme values.
 ***********************************************************************/

const fs = require('fs');
// Use GPU if available, otherwise revert to CPU
const tf = require('@tensorflow/tfjs-node-gpu');
// const tf = require('@tensorflow/tfjs-node');  // if no GPU

const dataFile = 'data3.csv';

async function main() {
    // 1. Read the CSV
    const rawCSV = fs.readFileSync(dataFile, 'utf8');

    // 2. Split into lines
    const lines = rawCSV.trim().split('\n');

    // 3. Extract the header row
    const header = lines.shift().split(';');
    console.log('CSV Headers:', header);

    // Prepare arrays for features (X) and labels (Y)
    const X = [];
    const Y = [];

    // One-hot mapping
    function labelToOneHot(label) {
        switch (label) {
            case 'bird':         return [1, 0, 0, 0, 0];
            case 'superhero':    return [0, 1, 0, 0, 0];
            case 'average joe':  return [0, 0, 1, 0, 0];
            case 'zombie':       return [0, 0, 0, 1, 0];
            case 'turtle':       return [0, 0, 0, 0, 1];
            default:
                throw new Error(`Unexpected label: ${label}`);
        }
    }

    lines.forEach((line) => {
        // Split by comma
        const cols = line.split(',');

        // Numeric fields (adjust indexing if needed)
        const impressionsStr     = cols[2];
        const clicksStr          = cols[3];
        const ctrStr             = cols[4]; // Possibly "0,51" => 0.51
        const spendStr           = cols[5];
        const conversionsStr     = cols[6];
        const conversionValueStr = cols[7];
        const roasStr            = cols[8];

        // Label field
        const rawLabel = cols[9] || '';
        const customLabel = rawLabel.replace(/\r$/, '').trim();

        // Convert strings to float
        const impressions     = parseFloat(impressionsStr.replace(',', '.'));
        const clicks          = parseFloat(clicksStr.replace(',', '.'));
        const ctr             = parseFloat(ctrStr.replace(',', '.'));
        const spend           = parseFloat(spendStr.replace(',', '.'));
        const conversions     = parseFloat(conversionsStr.replace(',', '.'));
        const conversionValue = parseFloat(conversionValueStr.replace(',', '.'));
        const roas            = parseFloat(roasStr.replace(',', '.'));

        // Skip if any numeric is NaN
        if (
            isNaN(impressions) || isNaN(clicks) || isNaN(ctr) ||
            isNaN(spend) || isNaN(conversions) || isNaN(conversionValue) ||
            isNaN(roas)
        ) {
            return;
        }

        // Also skip if we have Infinity or negative Infinity
        // (e.g., zero denominators might produce Infinity in CTR/ROAS).
        if (!Number.isFinite(impressions) || !Number.isFinite(ctr) || !Number.isFinite(roas)) {
            return;
        }

        // Push features
        X.push([impressions, clicks, ctr, spend, conversions, conversionValue, roas]);

        // Push label
        Y.push(labelToOneHot(customLabel));
    });

    console.log('Number of training samples:', X.length);

    // Optional: See the first few rows
    console.log('First 5 feature rows:', X.slice(0, 5));
    console.log('First 5 labels:', Y.slice(0, 5));

    // Convert to Tensors
    const xsTensor = tf.tensor2d(X);  // shape: [numSamples, 7]
    const ysTensor = tf.tensor2d(Y);  // shape: [numSamples, 5]

    // Normalize
    const { normalizedXs, featureMin, featureMax } = normalizeFeatures(xsTensor);
    xsTensor.dispose();

    // Check the min/max values
    console.log('featureMin:', await featureMin.array());
    console.log('featureMax:', await featureMax.array());

    // Build model
    const model = buildModel(7, 5);

    // Train
    await trainModel(model, normalizedXs, ysTensor, featureMin, featureMax);

    // Test
    const testX = tf.tensor2d([[50, 1, 0.02, 0.8, 0, 0, 0]]);
    const testXNorm = doMinMaxScaling(testX, featureMin, featureMax);

    const prediction = model.predict(testXNorm);
    prediction.print();
    const predictionArray = await prediction.array();
    console.log('Raw prediction array:', predictionArray);

    const predictedLabel = interpretPrediction(predictionArray[0]);
    console.log('Predicted Label:', predictedLabel);

    // Cleanup
    normalizedXs.dispose();
    ysTensor.dispose();
    testX.dispose();
    testXNorm.dispose();
    prediction.dispose();
}

/***********************************************************************
 * Build Model
 * Lower LR to avoid possible numeric blow-ups.
 ***********************************************************************/
function buildModel(numFeatures, numClasses) {
    const model = tf.sequential();

    model.add(tf.layers.dense({
        inputShape: [numFeatures],
        units: 8,
        activation: 'relu'
    }));

    model.add(tf.layers.dense({
        units: numClasses,
        activation: 'softmax'
    }));

    // Lower learning rate:
    const LEARNING_RATE = 1e-4; // could try 1e-5 if still NaN
    model.compile({
        optimizer: tf.train.adam(LEARNING_RATE),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    console.log(model.summary());
    return model;
}

/***********************************************************************
 * Train Model
 ***********************************************************************/
async function trainModel(model, xs, ys, featureMin, featureMax) {
    const batchSize = 32;
    const epochs = 50;

    // Early stopping
    const earlyStoppingCb = tf.callbacks.earlyStopping({
        monitor: 'val_loss',
        patience: 5
    });

    console.log('Starting training...');
    await model.fit(xs, ys, {
        batchSize,
        epochs,
        shuffle: true,
        validationSplit: 0.2,
        callbacks: {
            onTrainBegin: () => console.log('Training started...'),
            onTrainEnd: () => console.log('Training finished.'),
            onEpochEnd: async (epoch, logs) => {
                // Log every 5 epochs
                if ((epoch + 1) % 5 === 0) {
                    console.log(
                        `Epoch ${epoch + 1}/${epochs} | ` +
                        `loss=${logs.loss?.toFixed(4)}, ` +
                        `acc=${logs.acc?.toFixed(4)}, ` +
                        `val_loss=${logs.val_loss?.toFixed(4)}, ` +
                        `val_acc=${logs.val_acc?.toFixed(4)}`
                    );
                }
                await earlyStoppingCb.onEpochEnd(epoch, logs);
                if (earlyStoppingCb.stopTraining) {
                    model.stopTraining = true;
                }
            }
        }
    });

    console.log('Training complete!');

    // Save the model
    await model.save('file://my-model');

    // Save min/max
    const minData = await featureMin.array();
    const maxData = await featureMax.array();
    const minmax = { min: minData, max: maxData };
    fs.writeFileSync('minmax.json', JSON.stringify(minmax));
    console.log('Model and minmax stats saved!');
}

/***********************************************************************
 * Normalize Features
 ***********************************************************************/
function normalizeFeatures(xs) {
    const mins = xs.min(0);
    const maxs = xs.max(0);
    const epsilon = tf.scalar(1e-10);
    const normalizedXs = xs.sub(mins).div(maxs.sub(mins).add(epsilon));
    return {
        normalizedXs,
        featureMin: mins,
        featureMax: maxs
    };
}

/***********************************************************************
 * Same Min-Max Scaling for New Data
 ***********************************************************************/
function doMinMaxScaling(xs, minTensor, maxTensor) {
    const epsilon = tf.scalar(1e-10);
    return xs.sub(minTensor).div(maxTensor.sub(minTensor).add(epsilon));
}

/***********************************************************************
 * Interpret Prediction
 ***********************************************************************/
function interpretPrediction(probArray) {
    const LABELS = ['bird', 'superhero', 'average joe', 'zombie', 'turtle'];
    let maxIndex = 0;
    for (let i = 1; i < probArray.length; i++) {
        if (probArray[i] > probArray[maxIndex]) {
            maxIndex = i;
        }
    }
    return LABELS[maxIndex];
}

// Run
main().catch(err => console.error(err));