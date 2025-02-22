import * as tf from '@tensorflow/tfjs-node';
import {ModelBuilder} from '../models/ml/ModelBuilder';

export class ModelService {
    private model: tf.Sequential | null = null;
    private modelPath: string = 'src/models/ml/';

    /**
     * Creates a new model using the specified input shape and number of classes.
     * @param inputShape Number of input features.
     * @param numClasses Number of output classes.
     */
    public createNewModel(inputShape: number, numClasses: number): void {
        this.model = ModelBuilder.buildModel(inputShape, numClasses);
    }

    /**
     * Saves the model to the specified file path.
     * @param modelName The path to save the model (e.g., 'my-model').
     */
    public async saveModel(modelName: string): Promise<void> {
        if (!this.model) {
            throw new Error("No model has been created yet.");
        }
        const fullPath = `${this.modelPath}/${modelName}`
        await this.model.save(`file://${fullPath}`);
        console.log(`Model saved at ${fullPath}`);
    }

    /**
     * Returns the currently created model.
     */
    public getModel(): tf.Sequential | null {
        return this.model;
    }
}