const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/toursModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

dotenv.config({ path: './config.env' });

const DB = {
  server: process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
  ),
  local: process.env.DATABASE_LOCAL,
};

mongoose
  .connect(DB.server, {
    useNewUrlParser: true,
  })
  .then(() => console.log('使用自動寫入本地JSON腳本'));

//tours.json
//tours-simple.json

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours.json`, 'utf-8', (err) =>
    console.log(`讀取本地tours.json檔案失敗\n${err}`)
  )
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8', (err) =>
    console.log(`讀取本地reviews.json檔案失敗\n${err}`)
  )
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/users.json`, 'utf-8', (err) =>
    console.log(`讀取本地users.json檔案失敗\n${err}`)
  )
);

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('[成功]MongoDB 已載入本地JSON檔案資料');
  } catch (err) {
    console.log(`[失敗]MongoDB 未載入本地JSON檔案資料\n${err}`);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    console.log('[成功]MongoDB 已刪除本地JSON檔案資料');
  } catch (err) {
    console.log(`[失敗]MongoDB 未刪除本地JSON檔案資料\n${err}`);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

if (process.env?.NODE_ENV === 'development') console.log(process.argv);
