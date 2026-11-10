import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  id: string; // Virtual property

  @Prop({ unique: true, sparse: true })
  cardNumber?: string;

  @Prop({ unique: true, sparse: true, lowercase: true, trim: true })
  email?: string;

  @Prop({ unique: true, sparse: true, trim: true })
  phone?: string;

  @Prop({ unique: true, sparse: true, trim: true })
  phoneNumber?: string;

  @Prop({ unique: true, sparse: true, trim: true })
  sdt?: string;

  @Prop({ required: true })
  password: string;


  @Prop()
  fullName?: string;

  @Prop()
  refreshToken?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Ensure virtual 'id' exists and is included in toJSON
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any)._id;
    delete (ret as any).__v;
    delete (ret as any).password;
    delete (ret as any).refreshToken;

    const phoneVal = (ret as any).phone || (ret as any).phoneNumber || (ret as any).sdt;
    if (phoneVal) {
      (ret as any).phone = phoneVal;
      (ret as any).phoneNumber = phoneVal;
      (ret as any).sdt = phoneVal;
    }

    return ret;
  },
});
