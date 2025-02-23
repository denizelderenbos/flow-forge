// src/index.ts

// Example: usage: `npx ts-node src/index.ts greet "John Doe"`


import {CsvReader} from "./utils/CsvReader";
import TrainingController from "./controllers/TrainingController";
import router from "./core/Router";
import PredictionController from "./controllers/PredictionController";
import CheckController from "./controllers/CheckController";

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'csv': {
            const csvReader = new CsvReader();
            const records = await csvReader.read('../training-data/data.csv');
            console.log('Parsed Records:', records);
            break;
        }
        case 'train': {
            await router.run([TrainingController, "train"]);
            break;
        }
        case 'predict': {
            await router.run([PredictionController, "predict"]);
            break;
        }
        case 'check': {
            await router.run([CheckController, "check"]);
            break;
        }
        default:
            console.log('Usage:');
            console.log("npx ts-node src/index.ts train <modelClassName> <csvPath> <modelName>");
            console.log("npx ts-node src/index.ts predict <csvPath> <outputPath> <modelPath> <minmaxPath>");
            console.log("npx ts-node src/index.ts check <csvPath>");
            break;
    }
}

// Run the main function, catching any top-level errors
main().catch((err) => {
    console.error('Error in main:', err);
});