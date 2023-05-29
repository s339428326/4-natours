const slugify = require('slugify');
const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema(
  {
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: [true, '旅遊項目中必須含名稱'],
      unique: true,
      trim: true,
      minLength: 10,
    },
    duration: {
      type: String,
      required: [true, '旅遊項目中必須含時程'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, '旅遊項目中必須含最大團人數'],
    },
    difficulty: {
      type: String,
      required: [true, '旅遊項目中必須含難度'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: "難度value只能填入 'easy', 'medium', 'difficult'.",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'ratingAverage 最小分數到 1'],
      max: [5, 'ratingAverage 最大分數到 5'],
      //Ex:4.66666, 46.66666, 47, 4.7
      set: (currentValue) => Math.round(currentValue * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, '旅遊項目中必須含價格'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          return this.price > value;
        },
        message: `打折後價格({VALUE})高於或等於原價`,
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, '旅遊項目中必須含背景圖片連結'],
    },
    images: [String],
    createAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    //Location Embedded tour
    startLocation: {
      //GeoJSON
      type: {
        //子層的type
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      //[經度, 緯度] 跟正常相反
      coordinates: [Number],
      address: String,
      description: String,
    },
    //Embedded(嵌入)資料需要Array
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number, //多久後開始
      },
    ],
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    //在mongoose序列化(serialization)時，是否可以使用虛擬屬性
    //序列化意指MongoDB資料轉換為其他格式的過程
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//index可以暫存資料搜索結果
/*
1:升序
-1:降序
2dSphere用於2D地理二維平面位置
*/
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//新增虛擬屬性'durationWeeks'
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//virtual populate(當前的schema建立子引用但不會保存至DateBase)
tourSchema.virtual('reviews', {
  ref: 'Review', //想要呈現的參考資料
  foreignField: 'tour', // 填入外部文件相呼應的value, 這裡選擇使用tour id , tour 欄位 value 正好為 tourId
  localField: '_id', //填入呼應foreignField欄位的value, 這裡正是tour schema 因此選擇_id做呼應
});

//在mongoDB存儲資料前的預處理方法(pre)，稱為文件middleware或hook

//輸入名稱透過第三方套件，自動轉換為小寫
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
//透過正規表達式抓取所有 EX: findById findByIdAndUpdate 已find為開頭的方法
tourSchema.pre(/^find/, function (next) {
  //過濾掉所有被標記為秘密行程的項目
  this.find({ secretTour: { $ne: true } });
  //
  this.start = Date.now();
  next();
});

//使用aggregate之前，剔除秘密行程
tourSchema.pre('aggregate', function (next) {
  //判斷pipeline first stage是不是$geoNear
  Object.entries(this.pipeline()).forEach((stageItem) => {
    const [index, stageObj] = stageItem;
    if (index === '0') {
      if (!stageObj?.$geoNear) {
        //剔除秘密行程
        this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
      }
    }
  });

  next();
});

//
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -tryLoginCount',
  });
  next();
});

//向user collection 拿取user資料 Embedding
// tourSchema.pre('save', async function (next) {
//   const guidesPromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
