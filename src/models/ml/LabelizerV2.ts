import * as tf from '@tensorflow/tfjs-node';
import { IModelTrainer, TrainingOptions } from './IModelTrainer';
import { DataRecord } from '../../models/domain/DataRecord';
import * as fs from 'fs';

export class LabelizerV2 implements IModelTrainer {
    private readonly LABELS = ['bird', 'superhero', 'average joe', 'zombie', 'turtle'];
    private config: TrainingOptions;

    /**
     * Accepts a configuration object for training options.
     * Any options not provided will default to:
     *  - epochs: 50
     *  - batchSize: 32
     *  - validationSplit: 0.2
     *  - learningRate: 1e-5
     *  - earlyStoppingPatience: 5
     *  - loggingFrequency: 5
     *
     * @param config Partial configuration for training.
     */
    constructor(config: Partial<TrainingOptions> = {}) {
        const defaultConfig: TrainingOptions = {
            epochs: 50,
            batchSize: 32,
            validationSplit: 0.2,
            learningRate: 1e-5,
            earlyStoppingPatience: 5,
            loggingFrequency: 5,
        };
        this.config = { ...defaultConfig, ...config };
    }

    /**
     * Exposes the training configuration options.
     */
    public get options(): TrainingOptions {
        return this.config;
    }

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
    private normalizeFeatures(xs: tf.Tensor2D): {
        normalizedXs: tf.Tensor2D;
        featureMin: tf.Tensor;
        featureMax: tf.Tensor;
    } {
        const featureMin = xs.min(0);
        const featureMax = xs.max(0);
        const normalizedXs = xs
            .sub(featureMin)
            .div(featureMax.sub(featureMin).add(tf.scalar(1e-10))) as tf.Tensor2D;
        return { normalizedXs, featureMin, featureMax };
    }

    /**
     * Trains a label prediction model on the provided training data and saves the trained model to the specified path.
     *
     * This implementation uses a two-hidden-layer architecture.
     * It mimics the training procedure of the old code by using the provided configuration.
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
                record.roas,
            ]);

            if (!record.label) {
                throw new Error("Missing label in record");
            }
            labels.push(this.labelToOneHot(record.label));
        });

        // 2. Convert arrays to tensors
        const xs = tf.tensor2d(features);  // shape: [numSamples, 7]
        const ys = tf.tensor2d(labels);      // shape: [numSamples, 5]

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
            activation: 'relu',
        }));
        model.add(tf.layers.dense({
            units: 16,
            activation: 'relu',
        }));
        model.add(tf.layers.dense({
            units: numClasses,
            activation: 'softmax',
        }));

        // Use learning rate from configuration
        model.compile({
            optimizer: tf.train.adam(this.config.learningRate),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy'],
        });

        console.log("Starting training for LabelizerV2...");

        // 5. Set up early stopping callback using configured patience
        const earlyStoppingCb = tf.callbacks.earlyStopping({
            monitor: 'val_loss',
            patience: this.config.earlyStoppingPatience,
        });

        // 6. Create a logging callback using tf.CustomCallback and configured logging frequency
        const loggingCallback = new tf.CustomCallback({
            onEpochEnd: async (epoch, logs) => {
                if ((epoch + 1) % this.config.loggingFrequency === 0) {
                    console.log(`Epoch ${epoch + 1}/${this.config.epochs}: loss=${logs?.loss?.toFixed(4)}, accuracy=${logs?.acc?.toFixed(4)}, val_loss=${logs?.val_loss?.toFixed(4)}, val_accuracy=${logs?.val_acc?.toFixed(4)}`);
                }
            },
        });

        console.log('Feature mins:', await featureMin.array());
        console.log('Feature maxs:', await featureMax.array());

        // 7. Train the model using configured parameters
        await model.fit(normalizedXs, ys, {
            epochs: this.config.epochs,
            batchSize: this.config.batchSize,
            validationSplit: this.config.validationSplit,
            shuffle: true,
            callbacks: [loggingCallback, earlyStoppingCb],
        });
        console.log("Training complete for LabelizerV2!");

        // 8. Save the model
        await model.save(`file://${modelSavePath}`);
        console.log(`Model saved to ${modelSavePath}`);

        // 9. Save min/max normalization stats to minmax.json
        const minData = await featureMin.array();
        const maxData = await featureMax.array();
        const minmax = { min: minData, max: maxData };
        fs.writeFileSync('minmax.json', JSON.stringify(minmax));
        console.log('Model and minmax stats saved!');

        // 10. Clean up tensors to free memory
        normalizedXs.dispose();
        ys.dispose();
        featureMin.dispose();
        featureMax.dispose();
    }
}