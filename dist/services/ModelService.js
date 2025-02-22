"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelService = void 0;
const ModelBuilder_1 = require("../models/ml/ModelBuilder");
class ModelService {
    constructor() {
        this.model = null;
        this.modelPath = 'src/models/ml/';
    }
    /**
     * Creates a new model using the specified input shape and number of classes.
     * @param inputShape Number of input features.
     * @param numClasses Number of output classes.
     */
    createNewModel(inputShape, numClasses) {
        this.model = ModelBuilder_1.ModelBuilder.buildModel(inputShape, numClasses);
    }
    /**
     * Saves the model to the specified file path.
     * @param modelName The path to save the model (e.g., 'my-model').
     */
    async saveModel(modelName) {
        if (!this.model) {
            throw new Error("No model has been created yet.");
        }
        const fullPath = `${this.modelPath}/${modelName}`;
        await this.model.save(`file://${fullPath}`);
        console.log(`Model saved at ${fullPath}`);
    }
    /**
     * Returns the currently created model.
     */
    getModel() {
        return this.model;
    }
}
exports.ModelService = ModelService;
//# sourceMappingURL=ModelService.js.map