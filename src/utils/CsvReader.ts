import * as fs from 'fs';
import { parse, Options } from 'csv-parse';

/**
 * A generic CSV reader that reads a CSV file and returns an array of rows of type T.
 *
 * @template T - The type of each row. Defaults to Record<string, string>.
 */
export class CsvReader<T = Record<string, string>> {
    /**
     * @param options - Default options for csv-parse.
     */
    constructor(private options: Options = { columns: true, delimiter: ',' }) {}

    /**
     * Reads the CSV file at the given path and returns an array of rows of type T.
     *
     * @param filePath - The path to the CSV file.
     * @param delimiter - Optional delimiter to override the default one.
     * @returns A Promise that resolves to an array of rows of type T.
     */
    public async read(filePath: string, delimiter?: string): Promise<T[]> {
        // Merge the default options with the provided delimiter, if any.
        const options: Options = { ...this.options };
        if (delimiter) {
            options.delimiter = delimiter;
        }

        const results: T[] = [];
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(parse(options))
                .on('data', (row: T) => results.push(row))
                .on('end', () => resolve(results))
                .on('error', (err: Error) => reject(err));
        });
    }
}