import { ModelService } from '../services/ModelService';

export default class ModelController {
    private modelService: ModelService;

    constructor() {
        this.modelService = new ModelService();
    }

    /**
     * Creates a new model with the specified parameters and saves it.
     *
     * @param inputShape Number of input features.
     * @param numClasses Number of output classes.
     * @param modelName
     */
    public async createAndSaveModel(inputShape: number, numClasses: number, modelName: string): Promise<void> {
        this.modelService.createNewModel(inputShape, numClasses);
        await this.modelService.saveModel(modelName);
    }
}