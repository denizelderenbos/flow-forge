"use strict";
// src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Example: usage: `npx ts-node src/index.ts greet "John Doe"`
const CsvReader_1 = require("./utils/CsvReader");
const ModelController_1 = __importDefault(require("./controllers/ModelController"));
const LabelizerV2_1 = require("./models/ml/LabelizerV2");
const DataRecord_1 = require("./models/domain/DataRecord");
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    switch (command) {
        case 'greet': {
            const name = args[1] || 'Anonymous';
            console.log(`Hello, ${name}! Welcome to our TypeScript App.`);
            break;
        }
        case 'csv': {
            const csvReader = new CsvReader_1.CsvReader();
            const records = await csvReader.read('../training-data/data.csv');
            console.log('Parsed Records:', records);
            break;
        }
        case 'train': {
            // Usage:
            //   npx ts-node src/index.ts train <ModelClassName> <path-to-csv> <model-save-path>
            // Example:
            //   npx ts-node src/index.ts train LabelPredictor training-data/data.csv ./src/models/ml/my-trained-model
            const modelClassName = args[1];
            if (!modelClassName) {
                throw new Error("Model class name is required (e.g., 'LabelPredictor' or 'LabelizerV2').");
            }
            const csvPath = args[2] || 'training-data/data.csv';
            const modelName = args[3] || 'my-model';
            const modelSavePath = `./src/models/ml/${modelName}`;
            // Instantiate the correct trainer based on modelClassName
            let trainer;
            switch (modelClassName) {
                case 'LabelizerV2':
                    trainer = new LabelizerV2_1.LabelizerV2();
                    break;
                default:
                    throw new Error(`Unknown model trainer: ${modelClassName}`);
            }
            // Load training data and train the model
            function toNumber(value) {
                const converted = parseFloat(value.replace(',', '.'));
                return Number.isFinite(converted) ? converted : 0;
            }
            const reader = new CsvReader_1.CsvReader();
            const data = await reader.read(csvPath, ',');
            const trainingData = data.map(({ impressions, clicks, ctr, spend, conversions, conversionValue, roas, label }) => {
                return new DataRecord_1.DataRecord({
                    impressions: toNumber(impressions),
                    clicks: toNumber(clicks),
                    ctr: toNumber(ctr),
                    spend: toNumber(spend),
                    conversions: toNumber(conversions),
                    conversionValue: toNumber(conversionValue),
                    roas: toNumber(roas),
                    label
                });
            });
            await trainer.train(trainingData, modelSavePath);
            break;
        }
        case 'createModel': {
            // Use: npx ts-node src/index.ts createModel <inputShape> <numClasses> <savePath>
            const inputShape = Number(args[1]) || 7; // default number of features
            const numClasses = Number(args[2]) || 5; // default number of classes
            const modelName = args[3] || 'my-model';
            const controller = new ModelController_1.default();
            await controller.createAndSaveModel(inputShape, numClasses, modelName);
            break;
        }
        default:
            console.log('Usage:');
            console.log('  npx ts-node src/index.ts greet <name>');
            break;
    }
}
// Run the main function, catching any top-level errors
main().catch((err) => {
    console.error('Error in main:', err);
});
//# sourceMappingURL=index.js.map