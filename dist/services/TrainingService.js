"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CsvReader_1 = require("../utils/CsvReader");
class TrainingService {
    constructor() {
        this.csvReader = new CsvReader_1.CsvReader();
        // Use LabelPredictor as the concrete model trainer
    }
}
exports.default = TrainingService;
//# sourceMappingURL=TrainingService.js.map