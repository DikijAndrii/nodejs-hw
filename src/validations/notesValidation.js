import { Joi, Segments } from 'celebrate';
import { TAGS } from '../constants/tags.js';
import { isValidObjectId } from 'mongoose';

const objectIdValidator = (value, helpers) => {
  return !isValidObjectId(value) ? helpers.message('Invalid id format') : value;
};

export const getAllNotesSchema = {
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).empty('').default(1).messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),

    perPage: Joi.number()
      .integer()
      .min(5)
      .max(20)
      .empty('')
      .default(10)
      .messages({
        'number.base': 'perPage must be a number',
        'number.integer': 'perPage must be an integer',
        'number.min': 'perPage must be at least 5',
        'number.max': 'perPage must be at most 20',
      }),

    tag: Joi.string()
      .valid(...TAGS)
      .optional()
      .messages({
        'string.base': 'Tag must be a string',
        'any.only': `Tag must be one of: ${TAGS.join(', ')}`,
      }),

    search: Joi.string().trim().allow('').optional().messages({
      'string.base': 'Search must be a string',
    }),
  }),
};

export const createNoteSchema = {
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(1).required().messages({
      'string.base': 'Title must be a string',
      'string.empty': 'Title cannot be empty',
      'string.min': 'Title must have at least 1 character',
      'any.required': 'Title is required',
    }),

    content: Joi.string().allow('').optional().messages({
      'string.base': 'Content must be a string',
    }),

    tag: Joi.string()
      .valid(...TAGS)
      .optional()
      .messages({
        'string.base': 'Tag must be a string',
        'any.only': `Tag must be one of: ${TAGS.join(', ')}`,
      }),
  }),
};

export const noteIdSchema = {
  [Segments.PARAMS]: Joi.object({
    noteId: Joi.string().custom(objectIdValidator).required().messages({
      'string.base': 'noteId must be a string',
      'any.required': 'noteId is required',
    }),
  }),
};

export const updateNoteSchema = {
  ...noteIdSchema, // додаємо перевірку параметра noteId через спред оператор
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(1).optional().messages({
      'string.base': 'Title must be a string',
      'string.min': 'Title must have at least 1 character',
    }),

    content: Joi.string().allow('').optional().messages({
      'string.base': 'Content must be a string',
    }),

    tag: Joi.string()
      .valid(...TAGS)
      .optional()
      .messages({
        'string.base': 'Tag must be a string',
        'any.only': `Tag must be one of: ${TAGS.join(', ')}`,
      }),
  })
    .min(1)
    .messages({
      'object.missing':
        'At least one field (title, content, or tag) must be provided',
    }),
};
