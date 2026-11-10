import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { getPhoneVariants } from '../common/utils/phone.util';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) { }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByCardNumber(cardNumber: string): Promise<UserDocument | null> {
    if (!cardNumber) return null;
    return this.userModel.findOne({ cardNumber }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    if (!email) return null;
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    if (!phone) return null;
    const variants = getPhoneVariants(phone);
    if (!variants.length) return null;

    return this.userModel
      .findOne({
        $or: [
          { phone: { $in: variants } },
          { phoneNumber: { $in: variants } },
          { sdt: { $in: variants } },
        ],
      })
      .exec();
  }

  async findByIdentifier(identifier: string): Promise<UserDocument | null> {
    if (!identifier) return null;
    const trimmed = identifier.trim();

    if (trimmed.includes('@')) {
      return this.findByEmail(trimmed);
    }

    // Ưu tiên tìm theo số điện thoại
    const byPhone = await this.findByPhone(trimmed);
    if (byPhone) return byPhone;

    // Tìm theo số thẻ
    const byCard = await this.findByCardNumber(trimmed);
    if (byCard) return byCard;

    // Fallback: tìm theo email
    return this.findByEmail(trimmed);
  }

  async save(user: Partial<User>): Promise<UserDocument> {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async update(
    id: string,
    partial: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, partial, { returnDocument: 'after' })
      .exec();
  }
}

