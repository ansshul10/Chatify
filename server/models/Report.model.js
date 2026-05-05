/**
 * @fileoverview Report Model — Tracks user reports for moderation.
 * @module models/Report.model
 */
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const reportSchema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
    collection: 'reports',
  }
);

reportSchema.index({ reporterId: 1 });
reportSchema.index({ reportedId: 1 });
reportSchema.index({ status: 1 });

const Report = model('Report', reportSchema);

export default Report;
