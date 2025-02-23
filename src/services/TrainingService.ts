import {CsvReader} from '../utils/CsvReader';

export default class TrainingService {
    private csvReader: CsvReader;

    constructor() {
        this.csvReader = new CsvReader();
        // Use LabelPredictor as the concrete model trainer
    }

    // /**
    //  * Loads CSV data from the given file path and returns an array of DataRecord objects.
    //  */
    // public async loadData(csvPath: string): Promise<Record<string, string>[]> {
    //     try {
    //         return await this.csvReader.read(csvPath);
    //     } catch (error) {
    //         console.error('Error loading CSV data:', error);
    //         throw error;
    //     }
    // }
    //
    // /**
    //  * Loads CSV data, then trains the model using the concrete model trainer.
    //  *
    //  * @param csvPath - The CSV file path with training data.
    //  * @param modelSavePath - The directory to save the trained model.
    //  */
    // public async trainModel(csvPath: string, modelSavePath: string): Promise<void> {
    //     try {
    //         const data = await this.loadData(csvPath);
    //         console.log(`Loaded ${data.length} records for training.`);
    //         await this.modelTrainer.train(data, modelSavePath);
    //     } catch (error) {
    //         console.error('Error during training:', error);
    //     }
    // }
}