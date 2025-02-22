// src/index.ts

// Example: usage: `npx ts-node src/index.ts greet "John Doe"`


import {CsvReader} from "./utils/CsvReader";
import TrainingController from "./controllers/TrainingController";
import ModelController from "./controllers/ModelController";
import {IModelTrainer} from "./models/ml/IModelTrainer";
import {LabelPredictor} from "./models/ml/LabelPredictor";
import {LabelizerV2} from "./models/ml/LabelizerV2";
import {DataRecord} from "./models/domain/DataRecord";

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
            const csvReader = new CsvReader();
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
            let trainer: IModelTrainer;
            switch (modelClassName) {
                case 'LabelPredictor':
                    trainer = new LabelPredictor();
                    break;
                case 'LabelizerV2':
                    trainer = new LabelizerV2();
                    break;
                default:
                    throw new Error(`Unknown model trainer: ${modelClassName}`);
            }

            // Load training data and train the model
            const reader = new CsvReader();
            const data = await reader.read(csvPath, ';');
            const trainingData = data.map(({
                                               impressions,
                                               clicks,
                                               ctr,
                                               spend,
                                               conversions,
                                               conversionValue,
                                               roas,
                                               label
                                           }) => {
                return new DataRecord({
                    impressions: parseFloat(impressions.replace(',', '.')),
                    clicks: parseFloat(clicks.replace(',', '.')),
                    ctr: parseFloat(ctr.replace(',', '.')),
                    spend: parseFloat(spend.replace(',', '.')),
                    conversions: parseFloat(conversions.replace(',', '.')),
                    conversionValue: parseFloat(conversionValue.replace(',', '.')),
                    roas: parseFloat(roas.replace(',', '.')),
                    label
                });
            });

            await trainer.train(trainingData, modelSavePath);
            break;
        }
        case 'createModel': {
            // Use: npx ts-node src/index.ts createModel <inputShape> <numClasses> <savePath>
            const inputShape = Number(args[1]) || 7; // default number of features
            const numClasses = Number(args[2]) || 5;   // default number of classes
            const modelName = args[3] || 'my-model';
            const controller = new ModelController();
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