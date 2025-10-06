# 🎮 Card Battle Server - Node.js

خادم Node.js لإدارة لعبة Card Battle مع نظام طلبات القدرات الفوري عبر جميع الأجهزة.

## 🚀 الميزات

- **التزامن الفوري**: جميع الأجهزة تتحدث مع خادم مركزي
- **نظام طلبات القدرات**: إدارة طلبات القدرات في الوقت الفعلي
- **Socket.IO**: تواصل فوري بين المضيف واللاعبين
- **إدارة الألعاب**: إنشاء وإدارة غرف الألعاب
- **نظام الإشعارات**: إشعارات فورية للطلبات والموافقات
- **Fallback System**: نظام احتياطي مع localStorage

## 📋 المتطلبات

- Node.js 14.0.0 أو أحدث
- npm أو yarn

## 🛠️ التثبيت

### 1. تثبيت المتطلبات

```bash
cd server
npm install
```

### 2. تشغيل الخادم

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 3. الوصول للخادم

- **الخادم**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Socket.IO**: ws://localhost:3000

## 📡 API Endpoints

### Game Management

```http
GET /api/games/:gameId
```
الحصول على معلومات اللعبة

```http
GET /api/games/:gameId/requests
```
الحصول على طلبات القدرات المعلقة

```http
POST /api/games/:gameId/requests/:requestId/approve
```
الموافقة على طلب القدرة

```http
POST /api/games/:gameId/requests/:requestId/reject
```
رفض طلب القدرة

### Health Check

```http
GET /health
```
فحص حالة الخادم

## 🔌 Socket.IO Events

### Client → Server

#### `joinGame`
```javascript
socket.emit('joinGame', {
  gameId: 'game-123',
  playerParam: 'player1',
  playerName: 'اللاعب الأول',
  abilities: ['قدرة الهجوم', 'قدرة الدفاع'],
  isHost: false
});
```

#### `requestAbility`
```javascript
socket.emit('requestAbility', {
  gameId: 'game-123',
  playerId: 'player1_socket123',
  abilityText: 'قدرة الهجوم السريع'
});
```

#### `approveAbilityRequest`
```javascript
socket.emit('approveAbilityRequest', {
  requestId: 'req-456'
});
```

#### `rejectAbilityRequest`
```javascript
socket.emit('rejectAbilityRequest', {
  requestId: 'req-456'
});
```

#### `getGameState`
```javascript
socket.emit('getGameState', {
  gameId: 'game-123'
});
```

#### `setPlayerAbilities`
```javascript
socket.emit('setPlayerAbilities', {
  gameId: 'game-123',
  playerParam: 'player1',
  abilities: ['قدرة جديدة']
});
```

### Server → Client

#### `gameJoined`
```javascript
socket.on('gameJoined', (data) => {
  console.log('Joined game:', data);
});
```

#### `playerJoined`
```javascript
socket.on('playerJoined', (data) => {
  console.log('Player joined:', data);
});
```

#### `playerLeft`
```javascript
socket.on('playerLeft', (data) => {
  console.log('Player left:', data);
});
```

#### `abilityRequested`
```javascript
socket.on('abilityRequested', (data) => {
  console.log('Ability requested:', data);
});
```

#### `abilityRequestApproved`
```javascript
socket.on('abilityRequestApproved', (data) => {
  console.log('Ability request approved:', data);
});
```

#### `abilityRequestRejected`
```javascript
socket.on('abilityRequestRejected', (data) => {
  console.log('Ability request rejected:', data);
});
```

#### `gameState`
```javascript
socket.on('gameState', (data) => {
  console.log('Game state:', data);
});
```

#### `playerAbilitiesUpdated`
```javascript
socket.on('playerAbilitiesUpdated', (data) => {
  console.log('Player abilities updated:', data);
});
```

#### `error`
```javascript
socket.on('error', (data) => {
  console.error('Server error:', data);
});
```

## 🏗️ البنية

```
server/
├── package.json          # متطلبات المشروع
├── server.js             # الخادم الرئيسي
└── README.md             # هذا الملف

js/
├── socket-manager.js     # مدير Socket.IO للعميل
└── player-cards-simple.js # تكامل Socket.IO للاعب
```

## 🔧 التكوين

### متغيرات البيئة

```bash
PORT=3000                 # منفذ الخادم
NODE_ENV=development      # بيئة التشغيل
```

### إعدادات Socket.IO

```javascript
const io = socketIo(server, {
  cors: {
    origin: "*",           # السماح لجميع المصادر
    methods: ["GET", "POST"]
  }
});
```

## 🚀 الاستخدام

### 1. تشغيل الخادم

```bash
npm start
```

### 2. فتح المتصفح

- **اللاعب 1**: http://localhost:3000/player-cards.html?player=1&gameId=test
- **اللاعب 2**: http://localhost:3000/player-cards.html?player=2&gameId=test
- **المضيف**: http://localhost:3000/card.html?gameId=test

### 3. اختبار النظام

1. افتح صفحة المضيف
2. افتح صفحة اللاعب 1
3. افتح صفحة اللاعب 2
4. اضغط على قدرة في صفحة اللاعب
5. يجب أن تظهر الإشعار في صفحة المضيف
6. اضغط على "قبول" أو "رفض"
7. يجب أن يصل الرد للاعب فوراً

## 🐛 استكشاف الأخطاء

### مشاكل الاتصال

```bash
# فحص حالة الخادم
curl http://localhost:3000/health

# فحص المنافذ المفتوحة
netstat -tulpn | grep :3000
```

### مشاكل Socket.IO

```javascript
// فحص حالة الاتصال
console.log('Socket connected:', socket.connected);

// إعادة الاتصال
socket.connect();
```

### مشاكل الذاكرة

```bash
# مراقبة استخدام الذاكرة
node --inspect server.js
```

## 📊 المراقبة

### إحصائيات الخادم

```javascript
// الحصول على إحصائيات الخادم
GET /health

// الاستجابة
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "games": 5,
  "players": 10,
  "requests": 3
}
```

### مراقبة الأداء

```bash
# مراقبة استخدام CPU
top -p $(pgrep node)

# مراقبة استخدام الذاكرة
ps aux | grep node
```

## 🔒 الأمان

### CORS

```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

### Rate Limiting

```javascript
// إضافة rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

## 🚀 النشر

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2

```bash
# تثبيت PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start server.js --name "card-battle-server"

# مراقبة التطبيق
pm2 monit
```

## 📝 التطوير

### إضافة ميزات جديدة

1. إضافة event جديد في `server.js`
2. إضافة handler في `socket-manager.js`
3. إضافة UI في الملفات المناسبة
4. اختبار الميزة

### اختبار النظام

```bash
# تشغيل الاختبارات
npm test

# اختبار الأداء
npm run test:performance
```

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء branch جديد
3. Commit التغييرات
4. Push إلى Branch
5. إنشاء Pull Request

## 📄 الترخيص

MIT License

## 📞 الدعم

للحصول على الدعم، يرجى فتح issue في GitHub أو التواصل مع الفريق.

---

**تم إنشاء هذا الخادم لضمان عمل طلبات القدرات على جميع الأجهزة بشكل فوري ومتزامن! 🎮✨**