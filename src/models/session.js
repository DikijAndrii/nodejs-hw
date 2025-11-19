import { Schema, model } from 'mongoose';
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, //власник сесії(по ID)
    accessToken: { type: String, required: true }, //короткоживучий токен (у нас 15 хвилин)
    refreshToken: { type: String, required: true }, //довшоживучий токен (у нас 1 день), щоб оновити пару токенів.
    accessTokenValidUntil: { type: Date, required: true }, // коли accessToken спливає.
    refreshTokenValidUntil: { type: Date, required: true }, //коли refreshToken спливає.
  },
  { timestamps: true, versionKey: false },
);

export default model('Session', sessionSchema);
