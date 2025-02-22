/**
 * Represents a single row (record) in your CSV data,
 * with typed properties for each numeric field and an optional label.
 */
export class Record {
    constructor(
        public impressions: number,
        public clicks: number,
        public ctr: number,
        public spend: number,
        public conversions: number,
        public conversionValue: number,
        public roas: number,
        /**
         * An optional label (e.g., "bird", "superhero", etc.).
         * Mark it optional with "?" so we don't always have to provide it.
         */
        public label?: string
    ) {}
}