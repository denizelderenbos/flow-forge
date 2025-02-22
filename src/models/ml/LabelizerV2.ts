import * as tf from '@tensorflow/tfjs-node';
import { IModelTrainer } from './IModelTrainer';
import { DataRecord } from '../../models/domain/DataRecord';

export class LabelizerV2 implements IModelTrainer {
    private readonly LABELS = ['bird', 'superhero', 'average joe', 'zombie', 'turtle'];

    /**
     * Converts a label string into a one-hot encoded array.
     */
    private labelToOneHot(label: string): number[] {
        const index = this.LABELS.indexOf(label.toLowerCase());
        if (index === -1) {
            throw new Error(`Unknown label: ${label}`);
        }
        return this.LABELS.map((_, i) => (i === index ? 1 : 0));
    }

    /**
     * Normalizes features using min–max scaling.
     */
    private normalizeFeatures(xs: tf.Tensor2D): { normalizedXs: tf.Tensor2D; featureMin: tf.Tensor; featureMax: tf.Tensor } {
        const featureMin = xs.min(0);
        const featureMax = xs.max(0);
        const normalizedXs = xs
            .sub(featureMin)
            .div(featureMax.sub(featureMin).add(tf.scalar(1e-10))) as tf.Tensor2D;
        return { normalizedXs, featureMin, featureMax };
    }

    /**
     * Trains a label prediction model on the provided training data
     * and saves the trained model to the specified path.
     *
     * This implementation uses a different architecture with two hidden layers.
     *
     * @param data - An array of DataRecord objects.
     * @param modelSavePath - The directory where the model will be saved.
     */
    public async train(data: DataRecord[], modelSavePath: string): Promise<void> {
        // 1. Prepare training arrays for features and labels
        const features: number[][] = [];
        const labels: number[][] = [];

        data.forEach(record => {
            features.push([
                record.impressions,
                record.clicks,
                record.ctr,
                record.spend,
                record.conversions,
                record.conversionValue,
                record.roas
            ]);

            if (!record.label) {
                throw new Error("Missing label in record");
            }
            labels.push(this.labelToOneHot(record.label));
        });

        // 2. Convert arrays to tensors
        const xs = tf.tensor2d(features);
        const ys = tf.tensor2d(labels);

        // 3. Normalize features
        const { normalizedXs, featureMin, featureMax } = this.normalizeFeatures(xs);
        xs.dispose();

        // 4. Build a new model with two hidden layers
        const inputShape = features[0].length; // should be 7 features
        const numClasses = this.LABELS.length;  // should be 5 classes
        const model = tf.sequential();
        model.add(tf.layers.dense({
            inputShape: [inputShape],
            units: 32,
            activation: 'relu'
        }));
        model.add(tf.layers.dense({
            units: 16,
            activation: 'relu'
        }));
        model.add(tf.layers.dense({
            units: numClasses,
            activation: 'softmax'
        }));

        model.compile({
            optimizer: tf.train.adam(1e-3),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        // 5. Train the model
        console.log("Starting training for LabelizerV2...");
        await model.fit(normalizedXs, ys, {
            epochs: 50,
            batchSize: 32,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}: loss=${logs?.loss?.toFixed(4)} accuracy=${logs?.acc?.toFixed(4)}`);
                }
            }
        });
        console.log("Training complete for LabelizerV2!");

        // 6. Save the model
        await model.save(`file://${modelSavePath}`);
        console.log(`Model saved to ${modelSavePath}`);

        // 7. Clean up tensors
        normalizedXs.dispose();
        ys.dispose();
        featureMin.dispose();
        featureMax.dispose();
    }
}