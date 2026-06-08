import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.User || mongoose.model('User', UserSchema)