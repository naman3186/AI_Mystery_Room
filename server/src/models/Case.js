import mongoose from 'mongoose';

const suspectSchema = new mongoose.Schema({ id: { type: String, required: true }, name: { type: String, required: true }, description: { type: String, required: true } }, { _id: false });
const clueSchema = new mongoose.Schema({ id: { type: String, required: true }, description: { type: String, required: true }, significance: { type: String, required: true } }, { _id: false });
const caseSchema = new mongoose.Schema({
  title: { type: String, required: true }, story: { type: String, required: true }, difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  suspects: { type: [suspectSchema], required: true }, clues: { type: [clueSchema], required: true }, hints: { type: [String], required: true },
  solution: { culpritId: { type: String, required: true }, explanation: { type: String, required: true }, reasoning: { type: String, required: true } },
  discoveredClueIds: { type: [String], default: [] }, hintsUsed: { type: Number, default: 0, min: 0 },
  accusation: { suspectId: String, correct: Boolean }, score: { type: Number, default: 0, min: 0 }, status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
}, { timestamps: true, versionKey: false });

export default mongoose.models.Case || mongoose.model('Case', caseSchema);
