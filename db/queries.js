import { userModel } from "@/models/user-model";

import {
  replaceMongoIdInArray,
  replaceMongoIdInObject,
} from "@/utils/data-util";

async function getAllUsers() {
  const allUsers = await userModel.find().lean();
  return replaceMongoIdInArray(allUsers);
}

async function createUser(user) {
  return await userModel.create(user);
}

async function findUserByCredentials(credentials) {
  const user = await userModel.findOne(credentials).lean();
  if (user) {
    return replaceMongoIdInObject(user);
  }
  return null;
}

async function updateUser(email, name, firstTimeLogin, history) {
  await userModel.updateOne(
    { email: email },
    { $set: { name: name, firstTimeLogin: firstTimeLogin, history: history } }
  );
}

async function changePassword(email, password) {
  await userModel.updateOne({ email: email }, { $set: { password: password } });
}

async function changePhoto(email, photo) {
  await userModel.updateOne({ email: email }, { $set: { photo: photo } });
}

async function changePaymentType(email, paymentType, expiredAt) {
  await userModel.updateOne(
    { email: email },
    { $set: { paymentType: paymentType, expiredAt: expiredAt } }
  );
}

export {
  changePassword,
  changePhoto,
  createUser,
  findUserByCredentials,
  getAllUsers,
  updateUser,
  changePaymentType,
};