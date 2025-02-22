"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ModelService_1 = require("../services/ModelService");
class ModelController {
    constructor() {
        this.modelService = new ModelService_1.ModelService();
    }
    /**
     * Creates a new model with the specified parameters and saves it.
     *
     * @param inputShape Number of input features.
     * @param numClasses Number of output classes.
     * @param modelName
     */
    async createAndSaveModel(inputShape, numClasses, modelName) {
        this.modelService.createNewModel(inputShape, numClasses);
        await this.modelService.saveModel(modelName);
    }
}
exports.default = ModelController;
//# sourceMappingURL=ModelController.js.map