# FlowForge

FlowForge is a command-line tool for training, predicting, and evaluating machine learning models using TensorFlow.js. Designed with a modular architecture and middleware-inspired CLI context injection, FlowForge makes it easy to extend and maintain your machine learning workflows.

## Features

*   **Training:** Create and train models using configurable trainer implementations (e.g. `LabelizerV2`).
*   **Prediction:** Use trained models to label new datasets and generate output CSV files with predicted labels.
*   **Evaluation:** Compare true labels with predicted labels and calculate accuracy.
*   **Modular Design:** Easily add new trainer implementations by following the `IModelTrainer` interface.
*   **CLI Middleware:** Automatic injection of a CLI context (command arguments) into controller methods, similar to frameworks like AdonisJS.

## Prerequisites

*   [Node.js](https://nodejs.org/) (v14 or later recommended)
*   [@tensorflow/tfjs-node-gpu](https://www.npmjs.com/package/@tensorflow/tfjs-node-gpu) (if you want GPU support)
*   Run `npm install` to install all project dependencies.

## How to Invoke the Program

FlowForge is executed via `ts-node` from the command line. The entry point is `src/index.ts`, and the application supports several commands:

### CSV Parsing

To simply parse a CSV file and display its contents (for debugging purposes):

```
npx ts-node src/index.ts csv
```

(This uses a default path; adjust the code if needed.)

### Training a Model

To train a model, use the `train` command with the following parameters:

*   **<modelClassName>:** The name of the trainer to use (currently supported: `LabelizerV2`).
*   **<csvPath>:** Path to the CSV file containing training data.
*   **<modelName>:** The name for the directory where the trained model files will be saved.

Example:

```
npx ts-node src/index.ts train LabelizerV2 training-data/data.csv my-trained-model
```

This command performs the following steps:

*   Reads training data from the specified CSV file.
*   Converts CSV rows into structured data records.
*   Trains a model using the specified trainer (`LabelizerV2`).
*   Saves the trained model files (including `model.json` and weights) in `./src/models/ml/my-trained-model`.
*   Saves normalization statistics to `minmax.json`.

### Making Predictions

To run predictions on a new dataset, use the `predict` command with these parameters:

*   **<csvPath>:** Path to the CSV file with data to predict.
*   **<outputPath>:** Path where the new CSV with predicted labels will be saved.
*   **<modelPath>:** Directory where the trained model is saved (contains `model.json`).
*   **<minmaxPath>:** Path to the JSON file with min–max normalization stats (e.g., `minmax.json`).

Example:

```
npx ts-node src/index.ts predict training-data/data.csv output.csv ./src/models/ml/my-trained-model minmax.json
```

This command:

*   Loads the trained model and normalization stats.
*   Reads the input CSV, normalizes its features, and runs predictions.
*   Appends a new column `predictedLabel` to each row and writes the output CSV to the specified path.

### Checking Predictions

To evaluate the accuracy of predictions, use the `check` command. This command expects a CSV file containing both the true labels (in the `label` column) and predicted labels (in the `predictedLabel` column):

```
npx ts-node src/index.ts check training-data/data.csv
```

This command outputs:

*   Total number of rows.
*   Number of correctly predicted rows.
*   Percentage of correct predictions.

## How to Create New Trainer Model Files

FlowForge uses a modular approach for model training. Every trainer must implement the `IModelTrainer` interface, which requires:

*   An `options` property of type `TrainingOptions` (parameters such as `epochs`, `batchSize`, etc.).
*   A `train(data: DataRecord[], modelSavePath: string): Promise<void>` method that:
    *   Prepares and normalizes data.
    *   Constructs and trains a TensorFlow.js model.
    *   Saves the trained model and any auxiliary data (e.g., normalization stats).

### Steps to Create a New Trainer

1.  **Implement the Interface:**

    Create a new file (e.g., `MyCustomTrainer.ts`) in `src/models/ml/` and implement the `IModelTrainer` interface.

2.  **Define Configuration:**

    Accept a configuration object in the constructor (merging with defaults if necessary) and expose it via an `options` getter.

3.  **Write the Training Method:**

    Process CSV data, normalize it, build and train your model, then save the model and any additional files.

4.  **Register the Trainer:**

    Update your router or entry point to recognize and instantiate your new trainer implementation.


Example skeleton:

```
import * as tf from '@tensorflow/tfjs-node';
import { IModelTrainer, TrainingOptions } from './IModelTrainer';
import { DataRecord } from '../../models/domain/DataRecord';

export class MyCustomTrainer implements IModelTrainer {
  private config: TrainingOptions;

  constructor(config: Partial<TrainingOptions> = {}) {
    const defaultConfig: TrainingOptions = {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      learningRate: 1e-5,
      earlyStoppingPatience: 5,
      loggingFrequency: 5,
    };
    this.config = { ...defaultConfig, ...config };
  }

  public get options(): TrainingOptions {
    return this.config;
  }

  public async train(data: DataRecord[], modelSavePath: string): Promise<void> {
    // Your custom training logic here.
  }
}
```

## Architecture Overview

*   **Controllers:** Controllers (e.g., `TrainingController`, `PredictionController`, `CheckController`) orchestrate tasks and receive a CLI context automatically via a middleware-inspired router.
*   **Services:** Services (e.g., `PredictionService`) encapsulate core logic like model inference, normalization, and CSV handling.
*   **Routing & CLI Context:** A custom `Router` class builds a `CliContext` (containing command arguments) and injects it into controller methods. In your entry point, you can invoke a controller method like:  
    `router.run([PredictionController, 'predict'])`

## Conclusion

FlowForge is designed to be a flexible, modular, and easily extensible CLI tool for machine learning model training, prediction, and evaluation. By following a standardized interface for trainers and using CLI context injection, you can rapidly prototype and extend functionality to suit your needs.

Happy forging!