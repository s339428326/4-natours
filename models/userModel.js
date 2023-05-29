const crypto = require('crypto');
//mongoose(mongoDB操作 in JS)
const mongoose = require('mongoose');
//3-rd plugin
//正規表達驗證
const validator = require('validator');
//bcrypt加密
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '使用者必須包含名稱'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, '請輸入有效的信箱格式'],
      required: [true, '使用者必須包含email'],
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      required: true,
      default: 'user',
      // select: false,
      enum: {
        values: ['user', 'guide', 'lead-guide', 'admin'],
        message: '出現錯誤權限用戶',
      },
    },
    password: {
      type: String,
      minLength: 8,
      required: [true, '使用者必須包含密碼'],
      select: false,
      validate: [
        function (value) {
          return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value);
        },
        '密碼包含至少一個字母和一個數字，長度至少為8位',
      ],
    },
    passwordConfirm: {
      type: String,
      validate: [
        function (value) {
          return this.password === value;
        },
        '請確認密碼是否相同',
      ],
      required: [true, '請重新確認密碼'],
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    tryLoginCount: {
      type: Number,
      default: 0,
    },
    tryLoginTime: {
      type: Date,
    },
  },
  {
    toJSON: { virtuals: true },
    strict: true, //(重要)除了設計中的資料欄位，其他不會儲存到MongoDB中
  }
);

//為什麼大多數文件形式middleware, 使用function expression 是因為this指向schema本身

//儲存進MongoDb前，對password 欄位加密
userSchema.pre('save', async function (next) {
  //bcrypt setting var
  const saltRounds = 12; //推薦為10, 但有鑒於電腦計算速度趨增改為12
  // const myPlaintextPassword = 's0//P4$$w0rD';
  // const someOtherPlaintextPassword = 'not_bacon';

  //如果密碼未被更動，直接跳到下一個middleware
  if (!this.isModified('password')) return next();
  //對密碼進行加密
  this.password = await bcrypt.hash(this.password, saltRounds);
  //重新賦予passwordConfirm undefined，此欄位只用於用戶申請驗證
  this.passwordConfirm = undefined; // 設定undefined 不會紀錄於mongoDB

  next();
});

// 當用戶改變密碼，更新passwordChangedAt 屬性
userSchema.pre('save', function (next) {
  //如果用戶 未更新密碼 或 新增新帳戶 則跳出倒下一個middleware
  if (!this.isModified('password') || this.$isNew) return next();

  //如果更新過則重置到當前時間
  //issue(永遠被判定密碼已被更改) => changePasswordAt > jsonWebToken time(實際運作有機會)
  //儲存資料的時間DataBase 的時間會慢於JsonWebToken傳遞給用戶的時間(修正秒數1秒)
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

//對client端隱藏非活躍用戶(active)
userSchema.pre(/^find/, function (next) {
  //只隱藏非活躍用戶及admin(管理人員)
  this.find({ active: { $ne: false } }, { role: { $ne: 'admin' } });
  next();
});

//比對 bcrypt 加密密碼 是否等與 填入密碼
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//更改密碼後， 確認JWT Token 是否需要更換
userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  //如果passwordChangedAt存在，密碼被更換過
  if (this.passwordChangedAt) {
    //JS系統採毫秒制需要除1000
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //判斷 更換密碼時間 是否大於 JWTToken憑證起始時間(decode.iat)
    return changedTimestamp > JWTTimeStamp;
  }

  //密碼從未被更改過
  return false;
};

//建立Password Reset Token
userSchema.methods.createPasswordResetToken = function () {
  //建立重置Token使用隨機Bytes(16進制)產出
  const resetToken = crypto.randomBytes(32).toString('hex');
  //使用加密SHA256(16進制)Token儲存於MongoDB(安全性)
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  //建立有效期限為10分鐘
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  //回傳未加密重置Token
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
