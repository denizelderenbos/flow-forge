"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelizerV2 = void 0;
const tf = __importStar(require("@tensorflow/tfjs-node"));
const fs = __importStar(require("fs"));
class LabelizerV2 {
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
    constructor(config = {}) {
        this.LABELS = ['bird', 'superhero', 'average joe', 'zombie', 'turtle'];
        const defaultConfig = {
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
    get options() {
        return this.config;
    }
    /**
     * Converts a label string into a one-hot encoded array.
     */
    labelToOneHot(label) {
        const index = this.LABELS.indexOf(label.toLowerCase());
        if (index === -1) {
            throw new Error(`Unknown label: ${label}`);
        }
        return this.LABELS.map((_, i) => (i === index ? 1 : 0));
    }
    /**
     * Normalizes features using min–max scaling.
     */
    normalizeFeatures(xs) {
        const featureMin = xs.min(0);
        const featureMax = xs.max(0);
        const normalizedXs = xs
            .sub(featureMin)
            .div(featureMax.sub(featureMin).add(tf.scalar(1e-10)));
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
    async train(data, modelSavePath) {
        // 1. Prepare training arrays for features and labels
        const features = [];
        const labels = [];
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
        const xs = tf.tensor2d(features); // shape: [numSamples, 7]
        const ys = tf.tensor2d(labels); // shape: [numSamples, 5]
        // 3. Normalize features
        const { normalizedXs, featureMin, featureMax } = this.normalizeFeatures(xs);
        xs.dispose();
        // 4. Build a new model with two hidden layers
        const inputShape = features[0].length; // should be 7 features
        const numClasses = this.LABELS.length; // should be 5 classes
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
exports.LabelizerV2 = LabelizerV2;
//# sourceMappingURL=LabelizerV2.js.map