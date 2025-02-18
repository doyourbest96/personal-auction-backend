import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  userId: string;
  details?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    action: { type: String, required: true },
    userId: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>(
  "AuditLog",
  AuditLogSchema
);