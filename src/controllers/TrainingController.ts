import TrainingService from '../services/TrainingService';

export default class TrainingController {
    private trainingService: TrainingService;

    constructor() {
        this.trainingService = new TrainingService();
    }

    /**
     * Initiates training using the CSV file and saves the model.
     *
     * @param csvPath - The CSV file path.
     * @param modelSavePath - The directory where the model will be saved.
     */
    public async train(csvPath: string, modelSavePath: string): Promise<void> {
        // await this.trainingService.trainModel(csvPath, modelSavePath);
    }
}