const http = require("http");
const path = require("path");
const Koa = require("koa");
const koaBody = require("koa-body").default;
const koaStatic = require("koa-static");
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const fsExtra = require('fs-extra');
const multer = require('@koa/multer');
const cors = require('@koa/cors');

const app = new Koa();

app.use(cors());

let messages = [{
  id: uuidv4(),
  author: 'user',
  type: 'image',
  created: Date.now(),
  isFavorite: false,
  isPinned: false,
  file: 'kristin-brown-MJymGVEazyY-unsplash.jpg'
},
{
  id: uuidv4(),
  author: 'user',
  type: 'link',
  created: Date.now(),
  isFavorite: false,
  isPinned: false,
  text: 'https://unsplash.com/s/photos/cat – сайт, с которого взяты все изображения котеек для проекта 🐱'
},
{
  id: uuidv4(),
  author: 'user',
  type: 'file',
  created: Date.now(),
  isFavorite: false,
  isPinned: false,
  file: 'meow.txt',
  size: 3410
},
{
  id: uuidv4(),
  author: 'user',
  type: 'video',
  created: Date.now(),
  isFavorite: false,
  isPinned: false,
  file: 'cats.webm'
},
{
  id: uuidv4(),
  author: 'user',
  type: 'text',
  created: Date.now(),
  isFavorite: false,
  isPinned: false,
  text: 'В среднем, коты спят по 16-18 часов в день, что составляет более 70% кошачьей жизни.'
},
{
  id: uuidv4(),
  author: 'user',
  type: 'audio',
  created: Date.now(),
  isFavorite: false,
  isPinned: false,
  file: 'purr.mp3'
}];

const public = path.join(__dirname, "/public");
app.use(koaStatic(public));

app.use(async (ctx, next) => {
  const origin = ctx.request.get("Origin");
  if (!origin) {
    return await next();
  }

  const headers = { "Access-Control-Allow-Origin": "*", };

  if (ctx.request.method !== "OPTIONS") {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get("Access-Control-Request-Method")) {
    ctx.response.set({
      ...headers,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH",
    });

    if (ctx.request.get("Access-Control-Request-Headers")) {
      ctx.response.set("Access-Control-Allow-Headers", ctx.request.get("Access-Control-Request-Headers"))
    }

    ctx.response.status = 204;
  }
});

app.use(koaBody({
  text: true,
  urlencoded: true,
  miltipart: true,
  json: true,
}));

const Router = require("koa-router");
const router = new Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
const upload = multer({ storage: storage })

router.get("/messages", async (ctx, next) => {
  ctx.response.body = JSON.stringify(messages);
});

router.post("/new-message", async (ctx, next) => {
  messages.push(ctx.request.body);

  ctx.response.status = 200;
});

router.post("/upload", upload.single('file'), async (ctx) => {
  console.log(ctx.request.file)

  ctx.response.status = 200;
});

router.get("/delete-all", async (ctx, next) => {
  messages = [];
  fsExtra.emptyDirSync(public);

  ctx.response.status = 200;
});

router.post("/favorite", async (ctx, next) => {
  const { id, isFavorite } = ctx.request.body;
  for (const message of messages) {
    if (message.id === id) {
      message.isFavorite = isFavorite;
    }
  }

  ctx.response.status = 200;
});

router.post("/pinned", async (ctx, next) => {
  const { id, isPinned } = ctx.request.body;
  for (const message of messages) {
    if (message.id === id) {
      message.isPinned = isPinned;
    }
  }

  ctx.response.status = 200;
});

router.post("/search", async (ctx, next) => {
  const str = ctx.request.body.str;
  const searchArr = [];
  for (const message of messages) {
    if (message.hasOwnProperty('text') && message.text.includes(str)) {
      searchArr.push(message);
    }
  }

  ctx.response.body = JSON.stringify(searchArr);
  ctx.response.status = 200;
});

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback())

server.listen(port, (err) => {
  if (err) {
    console.log(err);

    return;
  }
  console.log("Server is listening to " + port);
});;