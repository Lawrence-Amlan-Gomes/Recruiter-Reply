import mongoose, { Schema } from "mongoose";

const schema = new Schema({
  name: {
    required: true,
    type: String,
  },
  email: {
    required: true,
    type: String,
  },
  password: {
    required: false,
    type: String,
  },
  photo: {
    required: false,
    type: String,
  },
  paymentType: {
    required: false,
    type: String,
  },
  createdAt: {
    type: String,
    required: false,
  },
  expiredAt: {
    type: String,
    required: false,
  },
  isAdmin: {
    type: Boolean,
    required: false,
  },
  firstTimeLogin: {
    type: Boolean,
    required: false,
  },
  history: {
    type: Array,
    required: false,
  },
});

export const userModel =
  mongoose.models.users ?? mongoose.model("users", schema);
