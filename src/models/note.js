import { Schema, model } from 'mongoose';
import { TAGS } from '../constants/tags.js';

const noteSchema = new Schema(
  {
    title: {
      type: String,
      required: true, //обов'язкове поле
      trim: true, //прибирає пробіли
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    tag: {
      type: String,
      enum: TAGS,
      default: 'Todo',
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true, // створює createdAt та updatedAt автоматично
    versionKey: false, // прибирає __v
  },
);
noteSchema.index({ title: 'text', content: 'text' }); //Додаємо текстовий індекс до моделі
export default model('Note', noteSchema);
