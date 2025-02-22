"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvReader = void 0;
const fs = __importStar(require("fs"));
const csv_parse_1 = require("csv-parse");
/**
 * A generic CSV reader that reads a CSV file and returns an array of rows of type T.
 *
 * @template T - The type of each row. Defaults to Record<string, string>.
 */
class CsvReader {
    /**
     * @param options - Default options for csv-parse.
     */
    constructor(options = { columns: true, delimiter: ',' }) {
        this.options = options;
    }
    /**
     * Reads the CSV file at the given path and returns an array of rows of type T.
     *
     * @param filePath - The path to the CSV file.
     * @param delimiter - Optional delimiter to override the default one.
     * @returns A Promise that resolves to an array of rows of type T.
     */
    async read(filePath, delimiter) {
        // Merge the default options with the provided delimiter, if any.
        const options = { ...this.options };
        if (delimiter) {
            options.delimiter = delimiter;
        }
        const results = [];
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe((0, csv_parse_1.parse)(options))
                .on('data', (row) => results.push(row))
                .on('end', () => resolve(results))
                .on('error', (err) => reject(err));
        });
    }
}
exports.CsvReader = CsvReader;
//# sourceMappingURL=CsvReader.js.map