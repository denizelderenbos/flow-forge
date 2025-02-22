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
exports.LabelPredictor = void 0;
const tf = __importStar(require("@tensorflow/tfjs-node"));
const ModelBuilder_1 = require("./ModelBuilder");
class LabelPredictor {
    constructor() {
        this.LABELS = ['bird', 'superhero', 'average joe', 'zombie', 'turtle'];
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
     * Trains a label prediction model on the provided training data
     * and saves the trained model to the specified path.
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
        // 4. Build the model using our ModelBuilder (assumed to exist)
        const inputShape = features[0].length; // should be 7 features
        const numClasses = this.LABELS.length; // should be 5 classes
        const model = ModelBuilder_1.ModelBuilder.buildModel(inputShape, numClasses);
        // 5. Train the model
        console.log("Starting training for LabelPredictor...");
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
        console.log("Training complete for LabelPredictor!");
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
exports.LabelPredictor = LabelPredictor;
//# sourceMappingURL=LabelPredictor.js.map