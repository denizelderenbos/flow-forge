"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Record = void 0;
/**
 * Represents a single row (record) in your CSV data,
 * with typed properties for each numeric field and an optional label.
 */
class Record {
    constructor(impressions, clicks, ctr, spend, conversions, conversionValue, roas, 
    /**
     * An optional label (e.g., "bird", "superhero", etc.).
     * Mark it optional with "?" so we don't always have to provide it.
     */
    label) {
        this.impressions = impressions;
        this.clicks = clicks;
        this.ctr = ctr;
        this.spend = spend;
        this.conversions = conversions;
        this.conversionValue = conversionValue;
        this.roas = roas;
        this.label = label;
    }
}
exports.Record = Record;
//# sourceMappingURL=Record.js.map