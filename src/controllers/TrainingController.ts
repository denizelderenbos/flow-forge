import {CsvReader} from "../utils/CsvReader";
import {IModelTrainer} from "../models/ml/IModelTrainer";
import {DataRecord} from "../models/domain/DataRecord";
import {CliContext} from "../types/CliContext";
import {LabelizerV2} from "../models/ml/LabelizerV2";

export default class TrainingController {
    // Helper to convert a CSV numeric field to a number,
    // returning 0 if the converted value is not finite.
    private toNumber(value: string): number {
        const converted = parseFloat(value.replace(",", "."));
        return Number.isFinite(converted) ? converted : 0;
    }

    /**
     * Reads the CSV at csvPath, converts each row into a DataRecord,
     * and then calls the provided trainer to train and save the model.
     *
     * @param trainer The model trainer instance (implements IModelTrainer)
     * @param csvPath The path to the CSV file.
     * @param modelSavePath The directory where the model will be saved.
     */
    public async train({args}: CliContext): Promise<void> {
        const [modelClassName, csvPath, modelName] = args

        const modelSavePath = `./src/models/ml/${modelName}`;

        let trainer: IModelTrainer;
        switch (modelClassName) {
            case 'LabelizerV2':
                trainer = new LabelizerV2();
                break;
            default:
                throw new Error(`Unknown model trainer: ${modelClassName}`);
        }

        const reader = new CsvReader();
        // Pass the delimiter if needed (here we assume CSV uses ',' or you can change as required)
        const data = await reader.read(csvPath, ",");

        // Map each row (an object with string values) to a DataRecord instance.
        const trainingData = data.map(({
                                           impressions,
                                           clicks,
                                           ctr,
                                           spend,
                                           conversions,
                                           conversionValue,
                                           roas,
                                           label,
                                       }) => {
            return new DataRecord({
                impressions: this.toNumber(impressions),
                clicks: this.toNumber(clicks),
                ctr: this.toNumber(ctr),
                spend: this.toNumber(spend),
                conversions: this.toNumber(conversions),
                conversionValue: this.toNumber(conversionValue),
                roas: this.toNumber(roas),
                label,
            });
        });

        // Now delegate to the trainer
        await trainer.train(trainingData, modelSavePath);
    }
}