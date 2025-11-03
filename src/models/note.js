import { Schema, model } from 'mongoose';

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
      enum: [
        'Work',
        'Personal',
        'Meeting',
        'Shopping',
        'Ideas',
        'Travel',
        'Finance',
        'Health',
        'Important',
        'Todo',
      ],
      default: 'Todo',
      trim: true,
    },
  },
  {
    timestamps: true, // створює createdAt та updatedAt автоматично
    versionKey: false, // прибирає __v
  },
);

export const Note = model('Note', noteSchema);
