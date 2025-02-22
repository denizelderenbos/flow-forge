// src/models/domain/DataRecord.ts
export interface IDataRecord {
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
    conversions: number;
    conversionValue: number;
    roas: number;
    label?: string;
}


export class DataRecord {
    public impressions: number;
    public clicks: number;
    public ctr: number;
    public spend: number;
    public conversions: number;
    public conversionValue: number;
    public roas: number;
    public label?: string;

    constructor({
                    impressions,
                    clicks,
                    ctr,
                    spend,
                    conversions,
                    conversionValue,
                    roas,
                    label,
                }: IDataRecord) {
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