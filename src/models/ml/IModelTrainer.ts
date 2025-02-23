import {DataRecord} from '../../models/domain/DataRecord';


export interface TrainingOptions {
    epochs: number;
    batchSize: number;
    validationSplit: number;
    learningRate: number;
    earlyStoppingPatience: number;
    loggingFrequency: number;
}

/**
 * The IModelTrainer interface defines the contract for a class
 * that can train a machine learning model given training data.
 */
export interface IModelTrainer {
    options: TrainingOptions;

    /**
     * Trains a model based on the provided data and saves it to the specified path.
     *
     * @param data - An array of DataRecord objects serving as training data.
     * @param modelSavePath - The directory where the trained model will be saved.
     */
    train(data: DataRecord[], modelSavePath: string): Promise<void>;
}