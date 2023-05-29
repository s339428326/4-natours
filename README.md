# Node.js, Express, MongoDB 練習

## 此專案為課程內容，請勿商業使用。

[課程連結](https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/)

## 課程專案名稱：Natours(旅遊預訂平台)

[postman API documenter page](https://documenter.getpostman.com/view/24644154/2s93m8yLUy)

### 此專案在 node version v18.12.1 建立

### 專案使用引導

STEP.1

```
npm init -y
```

```
npm i
```

STEP.2 確認是否有 nodemon，如果未安裝請使用以下指令

```
npm i -D nodemon
```

STEP.3 環境變數設定(若需要使用專案注意請自行建立 config.env)

```
config.env
# 運行環境
NODE_ENV=development

# Node 本地端運行端口
PORT=6300

#######################MongoDB#########################
#  MongoDB 雲端
DATABASE= <自行填入MongoDB提供位置>
# MongoDB 本地
DATABASE_LOCAL=mongodb://localhost:27017/natours
# MongoDB 帳戶密碼
DATABASE_PASSWORD=<自行填入MongoDB密碼>

#######################JWT & cookie######################
# JWT 加密鑰匙
JWT_SECRET= <自行產生加密字串當作JWT的SECRET>
# JWT 加密有效時間
JWT_EXPIRES_IN=<設定有效時間(天數)>d
# COOKIES 加密有效時間
JWT_COOKIE_EXPIRES_IN=<設定有效時間(天數)>


#######################EMAIL############################
# mailtrap
EMAIL_USERNAME=<填入mailtrap username>
EMAIL_PASSWORD=<填入mailtrap password>
EMAIL_HOST=<填入mailtrap 提供位址>
EMAIL_PORT=<填入mailtrap port>

# sendGrid
SENDGRID_USERNAME=<填入sendGrid username>
SENDGRID_API=<填入sendGrid API KEY>

# 寄件人
#因為sendGird 要求需要認證使用信箱因此在prod模式下必需要使用真實信箱
EMAIL_FROM_PROD=<sendGrid認證的真實信箱>
EMAIL_FROM=<dev 模式下使用>

#######################地圖#############################

# MAPBOX 地圖API KEY
MAPBOX_API=<使用MAPBOX 提供API KEY>

#######################stripe#############################
STRIPE_PUBLIC_API_KEY=<填入STRIPE 提供的公開key>

STRIPE_SECRET_PUBLIC_API_KEY=<填入STRIPE 提供的私密key>
```

STEP.4 執行專案

```
npm run dev //使用開發者模式下執行
```

or

```
npm run prod //使用產品模式下執行
```

擇一即可
