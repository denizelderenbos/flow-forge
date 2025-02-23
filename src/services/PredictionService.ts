import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import { CsvReader } from '../utils/CsvReader';

export default class PredictionService {
    // These labels should match what was used during training.
    private readonly LABELS = ['bird', 'superhero', 'average joe', 'zombie', 'turtle'];

    // Load min-max stats from a JSON file.
    private loadMinMax(minmaxPath: string): { featureMin: tf.Tensor; featureMax: tf.Tensor } {
        const raw = fs.readFileSync(minmaxPath, 'utf8');
        const { min, max } = JSON.parse(raw);
        return { featureMin: tf.tensor(min), featureMax: tf.tensor(max) };
    }

    // Normalize new data using stored min and max values.
    private normalizeNewData(xs: tf.Tensor2D, featureMin: tf.Tensor, featureMax: tf.Tensor): tf.Tensor2D {
        const epsilon = tf.scalar(1e-10);
        return xs.sub(featureMin).div(featureMax.sub(featureMin).add(epsilon)) as tf.Tensor2D;
    }

    // Given a probability vector, returns the corresponding label.
    private interpretPrediction(probArray: number[]): string {
        let maxIndex = 0;
        for (let i = 1; i < probArray.length; i++) {
            if (probArray[i] > probArray[maxIndex]) {
                maxIndex = i;
            }
        }
        return this.LABELS[maxIndex];
    }

    /**
     * Uses a trained model to predict labels for a given CSV dataset,
     * then writes an output CSV file with an extra "predictedLabel" column.
     *
     * @param csvPath - Path to the CSV file with data.
     * @param outputPath - Path where the new CSV with predictions will be saved.
     * @param modelPath - Directory where the trained model is saved (contains model.json).
     * @param minmaxPath - Path to the JSON file containing min/max normalization stats.
     */
    public async predict(
        csvPath: string,
        outputPath: string,
        modelPath: string,
        minmaxPath: string
    ): Promise<void> {
        // Load the model (assumes model.json is in modelPath)
        const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);

        // Load normalization stats
        const { featureMin, featureMax } = this.loadMinMax(minmaxPath);

        // Read the CSV data (assumes delimiter is ';' if that's what your CSV uses)
        const reader = new CsvReader();
        const data = await reader.read(csvPath, ",");

        // Convert each CSV row (an object with string values) into a record with numeric features.
        // We assume the CSV has keys like: impressions, clicks, ctr, spend, conversions, conversionValue, roas
        const newRecords = data.map(row => ({
            ...row,
            impressions: parseFloat(row.impressions.replace(',', '.')),
            clicks: parseFloat(row.clicks.replace(',', '.')),
            ctr: parseFloat(row.ctr.replace(',', '.')),
            spend: parseFloat(row.spend.replace(',', '.')),
            conversions: parseFloat(row.conversions.replace(',', '.')),
            conversionValue: parseFloat(row.conversionValue.replace(',', '.')),
            roas: parseFloat(row.roas.replace(',', '.')),
        }));

        // Build feature array from each record (we use the same 7 features as in training)
        const features: number[][] = newRecords.map(record => [
            record.impressions,
            record.clicks,
            record.ctr,
            record.spend,
            record.conversions,
            record.conversionValue,
            record.roas,
        ]);

        // Convert to tensor and normalize using saved min/max
        const xs = tf.tensor2d(features);
        const normalizedXs = this.normalizeNewData(xs, featureMin, featureMax);

        // Get predictions from the model; assume model.predict returns a Tensor
        const predictionsTensor = model.predict(normalizedXs) as tf.Tensor;
        const predictionsArray = await predictionsTensor.array() as number[][];

        // Append predicted label to each record
        const outputRecords = newRecords.map((record, i) => {
            const predProb = predictionsArray[i];
            const predictedLabel = this.interpretPrediction(predProb);
            return { ...record, predictedLabel };
        });

        // Write output CSV: extract headers from the first record and join rows with delimiter.
        if (outputRecords.length === 0) {
            console.log("No records to output.");
            return;
        }
        const headers = Object.keys(outputRecords[0]);
        const csvLines = [headers.join(";")];
        for (const record of outputRecords) {
            const line = headers.map(header => (record as Record<string, any>)[header]).join(";");
            csvLines.push(line);
        }
        fs.writeFileSync(outputPath, csvLines.join("\n"), "utf8");
        console.log(`Predicted output saved to ${outputPath}`);

        // Cleanup tensors
        xs.dispose();
        normalizedXs.dispose();
        predictionsTensor.dispose();
        featureMin.dispose();
        featureMax.dispose();
    }
}