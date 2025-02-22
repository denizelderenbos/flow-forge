"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CsvReader_1 = require("../utils/CsvReader");
const LabelPredictor_1 = require("../models/ml/LabelPredictor");
class TrainingService {
    constructor() {
        this.csvReader = new CsvReader_1.CsvReader();
        // Use LabelPredictor as the concrete model trainer
        this.modelTrainer = new LabelPredictor_1.LabelPredictor();
    }
}
exports.default = TrainingService;
//# sourceMappingURL=TrainingService.js.map