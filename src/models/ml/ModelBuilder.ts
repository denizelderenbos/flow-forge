import * as tf from '@tensorflow/tfjs-node';

export class ModelBuilder {
    /**
     * Builds and compiles a new model.
     *
     * @param inputShape - Number of input features.
     * @param numClasses - Number of output classes.
     * @returns A compiled tf.Sequential model.
     */
    public static buildModel(inputShape: number, numClasses: number): tf.Sequential {
        const model = tf.sequential();

        // Add a hidden layer.
        model.add(tf.layers.dense({
            inputShape: [inputShape],
            units: 16,
            activation: 'relu',
        }));

        // Add an output layer.
        model.add(tf.layers.dense({
            units: numClasses,
            activation: 'softmax',
        }));

        // Compile the model.
        model.compile({
            optimizer: tf.train.adam(1e-3),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy'],
        });

        console.log('New model created and compiled.');
        return model;
    }
}