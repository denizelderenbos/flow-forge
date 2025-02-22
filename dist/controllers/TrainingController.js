"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TrainingService_1 = __importDefault(require("../services/TrainingService"));
class TrainingController {
    constructor() {
        this.trainingService = new TrainingService_1.default();
    }
    /**
     * Initiates training using the CSV file and saves the model.
     *
     * @param csvPath - The CSV file path.
     * @param modelSavePath - The directory where the model will be saved.
     */
    async train(csvPath, modelSavePath) {
        // await this.trainingService.trainModel(csvPath, modelSavePath);
    }
}
exports.default = TrainingController;
//# sourceMappingURL=TrainingController.js.map