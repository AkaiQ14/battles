# 🎮 Card Battle Server - تعليمات التشغيل

## 🚀 التشغيل السريع

### Windows
```bash
# تشغيل الملف
start.bat
```

### Linux/Mac
```bash
# جعل الملف قابل للتنفيذ
chmod +x start.sh

# تشغيل الملف
./start.sh
```

### يدوياً
```bash
# الانتقال لمجلد الخادم
cd server

# تثبيت المتطلبات
npm install

# تشغيل الخادم
npm start
```

## 🌐 الوصول للنظام

بعد تشغيل الخادم، ستكون الصفحات متاحة على:

- **الخادم**: http://localhost:3000
- **فحص الحالة**: http://localhost:3000/health
- **صفحة اللاعب 1**: http://localhost:3000/player-cards.html?player=1&gameId=test
- **صفحة اللاعب 2**: http://localhost:3000/player-cards.html?player=2&gameId=test
- **صفحة المضيف**: http://localhost:3000/card.html?gameId=test

## 📱 اختبار النظام

### 1. اختبار أساسي
1. شغل الخادم
2. افتح صفحة المضيف
3. افتح صفحة اللاعب 1
4. اضغط على قدرة في صفحة اللاعب
5. يجب أن تظهر الإشعار في صفحة المضيف

### 2. اختبار متعدد الأجهزة
1. شغل الخادم على جهاز واحد
2. افتح صفحات مختلفة على أجهزة مختلفة
3. تأكد من عمل طلبات القدرات بين جميع الأجهزة

### 3. اختبار الاتصال
```bash
# فحص حالة الخادم
curl http://localhost:3000/health

# يجب أن تحصل على استجابة مثل:
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "games": 0,
  "players": 0,
  "requests": 0
}
```

## 🔧 استكشاف الأخطاء

### مشكلة: الخادم لا يبدأ
```bash
# تحقق من تثبيت Node.js
node --version

# تحقق من تثبيت المتطلبات
npm list

# أعد تثبيت المتطلبات
npm install
```

### مشكلة: Socket.IO لا يعمل
```bash
# تحقق من المنفذ
netstat -tulpn | grep :3000

# تحقق من الحماية النارية
sudo ufw status
```

### مشكلة: طلبات القدرات لا تصل
1. تحقق من اتصال Socket.IO في console المتصفح
2. تحقق من رسائل الخطأ في console الخادم
3. تأكد من أن جميع الأجهزة تستخدم نفس gameId

## 📊 مراقبة النظام

### مراقبة الخادم
```bash
# مراقبة استخدام الذاكرة
ps aux | grep node

# مراقبة المنافذ
netstat -tulpn | grep :3000
```

### مراقبة الاتصالات
```bash
# مراقبة اتصالات Socket.IO
curl http://localhost:3000/health
```

## 🚀 النشر

### على خادم محلي
```bash
# تشغيل في الخلفية
nohup npm start > server.log 2>&1 &

# مراقبة السجل
tail -f server.log
```

### على خادم بعيد
```bash
# نسخ الملفات
scp -r server/ user@server:/path/to/app/

# تشغيل على الخادم
ssh user@server
cd /path/to/app/server
npm install
npm start
```

## 🔒 الأمان

### إعدادات CORS
```javascript
// في server.js
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
```

### حماية المنافذ
```bash
# فتح المنفذ في الحماية النارية
sudo ufw allow 3000

# فتح المنفذ فقط للمصادر المحددة
sudo ufw allow from 192.168.1.0/24 to any port 3000
```

## 📝 السجلات

### سجلات الخادم
```bash
# عرض السجلات
tail -f server.log

# سجلات npm
npm logs
```

### سجلات المتصفح
1. افتح Developer Tools (F12)
2. انتقل إلى Console
3. ابحث عن رسائل Socket.IO

## 🆘 الدعم

إذا واجهت مشاكل:

1. تحقق من السجلات
2. تأكد من تثبيت جميع المتطلبات
3. تحقق من إعدادات الشبكة
4. تأكد من أن المنفذ 3000 متاح

---

**🎮 استمتع بلعبة Card Battle مع النظام الجديد!**