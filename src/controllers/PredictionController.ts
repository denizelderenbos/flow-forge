import {CliContext} from "../types/CliContext";
import PredictionService from "../services/PredictionService";

export default class PredictionController {
    private predictionService: PredictionService

    constructor() {
        this.predictionService = new PredictionService();
    }

    public async predict({args}: CliContext) {
        const [csvPath,
            outputPath,
            modelPath,
            minmaxPath] = args;

        await this.predictionService.predict(csvPath, outputPath, modelPath, minmaxPath);
    }
}